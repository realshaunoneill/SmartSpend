import { db } from '@/lib/db';
import { subscriptions, subscriptionPayments, type Subscription } from '@/lib/db/schema';
import { eq, and, lte, or } from 'drizzle-orm';

export class SubscriptionService {
  /**
   * Calculate next billing date based on billing frequency
   * Handles month-end edge cases (e.g., Jan 31 -> Feb 28/29)
   */
  static calculateNextBillingDate(
    startDate: Date,
    billingFrequency: 'monthly' | 'quarterly' | 'yearly' | 'custom',
    customFrequencyDays?: number,
  ): Date {
    const nextBilling = new Date(startDate);
    const originalDay = startDate.getDate();

    switch (billingFrequency) {
      case 'monthly':
        nextBilling.setMonth(nextBilling.getMonth() + 1);
        // Handle month-end dates: if we wanted day 31 but next month only has 30 days,
        // the date will overflow to the next month. Fix by setting to last day of intended month.
        if (nextBilling.getDate() !== originalDay) {
          nextBilling.setDate(0); // Set to last day of previous month
        }
        break;
      case 'quarterly':
        nextBilling.setMonth(nextBilling.getMonth() + 3);
        // Handle month-end dates for quarterly billing
        if (nextBilling.getDate() !== originalDay) {
          nextBilling.setDate(0); // Set to last day of previous month
        }
        break;
      case 'yearly':
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
        // Handle Feb 29 (leap year) edge case
        if (nextBilling.getDate() !== originalDay) {
          nextBilling.setDate(0); // Set to last day of previous month
        }
        break;
      case 'custom':
        if (customFrequencyDays) {
          nextBilling.setDate(nextBilling.getDate() + customFrequencyDays);
        }
        break;
    }

    return nextBilling;
  }

  /**
   * Generate expected payments for a subscription
   * Creates payment records for the next N billing cycles (default: 12 months ahead)
   */
  static async generateExpectedPayments(
    subscriptionId: string,
    monthsAhead: number = 12,
  ): Promise<number> {
    // Fetch subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (!subscription || subscription.status !== 'active') {
      return 0;
    }

    // Get existing pending/missed payments to avoid duplicates
    const existingPayments = await db
      .select()
      .from(subscriptionPayments)
      .where(
        and(
          eq(subscriptionPayments.subscriptionId, subscriptionId),
          or(
            eq(subscriptionPayments.status, 'pending'),
            eq(subscriptionPayments.status, 'missed'),
          ),
        ),
      );

    // Find the latest expected date
    let lastExpectedDate = subscription.nextBillingDate;
    if (existingPayments.length > 0) {
      const sortedPayments = existingPayments.sort(
        (a, b) => new Date(b.expectedDate).getTime() - new Date(a.expectedDate).getTime(),
      );
      lastExpectedDate = sortedPayments[0].expectedDate;
    }

    // Calculate how many payments to generate
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setMonth(futureDate.getMonth() + monthsAhead);

    const paymentsToCreate: Array<{
      subscriptionId: string;
      expectedDate: Date;
      expectedAmount: string;
      status: string;
    }> = [];

    let currentDate = new Date(lastExpectedDate);
    let safetyCounter = 0;
    const MAX_ITERATIONS = 1000; // Safety limit to prevent infinite loops (~83 years of monthly payments)

    // Generate payments until we reach the future date
    while (currentDate <= futureDate && safetyCounter < MAX_ITERATIONS) {
      const previousDate = new Date(currentDate);
      
      // Calculate next date
      currentDate = this.calculateNextBillingDate(
        currentDate,
        subscription.billingFrequency as 'monthly' | 'quarterly' | 'yearly' | 'custom',
        subscription.customFrequencyDays || undefined,
      );
      
      // Safety check: ensure date actually progressed
      if (currentDate <= previousDate) {
        throw new Error(`Date calculation did not progress forward for subscription ${subscriptionId}`);
      }
      
      safetyCounter++;

      // Check if this payment already exists
      const existingPayment = existingPayments.find(
        (p) => {
          const diff = Math.abs(
            new Date(p.expectedDate).getTime() - currentDate.getTime(),
          );
          return diff < 24 * 60 * 60 * 1000; // Within 1 day
        },
      );

      if (!existingPayment && currentDate <= futureDate) {
        paymentsToCreate.push({
          subscriptionId: subscription.id,
          expectedDate: new Date(currentDate),
          expectedAmount: subscription.amount,
          status: 'pending',
        });
      }
    }

    // Bulk insert payments
    if (paymentsToCreate.length > 0) {
      await db.insert(subscriptionPayments).values(paymentsToCreate);
    }

    return paymentsToCreate.length;
  }

  /**
   * Generate expected payments for all active subscriptions
   * This should be run periodically (e.g., daily cron job)
   */
  static async generateAllExpectedPayments(monthsAhead: number = 12): Promise<{
    processed: number;
    created: number;
  }> {
    // Get all active subscriptions
    const activeSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));

    let totalCreated = 0;

    for (const subscription of activeSubscriptions) {
      const created = await this.generateExpectedPayments(subscription.id, monthsAhead);
      totalCreated += created;
    }

    return {
      processed: activeSubscriptions.length,
      created: totalCreated,
    };
  }

  /**
   * Update missed payments status
   * Mark payments as "missed" if they're past due and still pending
   */
  static async updateMissedPayments(): Promise<number> {
    const now = new Date();

    const result = await db
      .update(subscriptionPayments)
      .set({ status: 'missed' })
      .where(
        and(
          eq(subscriptionPayments.status, 'pending'),
          lte(subscriptionPayments.expectedDate, now),
        ),
      )
      .returning();

    return result.length;
  }

  /**
   * When a payment is marked as paid, generate the next expected payment
   * and update the subscription's nextBillingDate
   */
  static async handlePaymentPaid(
    subscriptionId: string,
    paidDate: Date,
  ): Promise<void> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (!subscription || subscription.status !== 'active') {
      return;
    }

    // Calculate next billing date from the paid date
    const nextBilling = this.calculateNextBillingDate(
      paidDate,
      subscription.billingFrequency as 'monthly' | 'quarterly' | 'yearly' | 'custom',
      subscription.customFrequencyDays || undefined,
    );

    // Update subscription's nextBillingDate and lastPaymentDate
    await db
      .update(subscriptions)
      .set({
        nextBillingDate: nextBilling,
        lastPaymentDate: paidDate,
      })
      .where(eq(subscriptions.id, subscriptionId));

    // Generate future expected payments
    await this.generateExpectedPayments(subscriptionId, 12);
  }

  /**
   * Verify subscription ownership
   * Returns subscription if owned by user, null otherwise
   */
  static async getSubscriptionByIdAndUserId(
    subscriptionId: string,
    userId: string,
  ): Promise<Subscription | null> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.id, subscriptionId),
          eq(subscriptions.userId, userId),
        ),
      )
      .limit(1);

    return subscription || null;
  }

  /**
   * Verify subscription ownership and throw if not found
   * Returns the subscription or throws an error
   */
  static async requireSubscriptionOwnership(
    subscriptionId: string,
    userId: string,
  ): Promise<Subscription> {
    const subscription = await this.getSubscriptionByIdAndUserId(subscriptionId, userId);

    if (!subscription) {
      throw new Error('Subscription not found or access denied');
    }

    return subscription;
  }
}
