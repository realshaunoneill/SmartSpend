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
   * Creates payment records only for billing cycles that have already occurred (in the past)
   * This ensures we only track payments that should have been made, not future predictions
   */
  static async generateExpectedPayments(
    subscriptionId: string,
    _monthsAhead: number = 12,
    _generateHistorical: boolean = false,
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

    const now = new Date();
    const paymentsToCreate: Array<{
      subscriptionId: string;
      expectedDate: Date;
      expectedAmount: string;
      status: string;
    }> = [];

    const startDate = new Date(subscription.startDate);

    // Special case: if subscription has started and there are no payments,
    // create the first expected payment so user can link their initial receipt
    if (existingPayments.length === 0 && startDate <= now) {
      const firstBillingDate = this.calculateNextBillingDate(
        startDate,
        subscription.billingFrequency as 'monthly' | 'quarterly' | 'yearly' | 'custom',
        subscription.customFrequencyDays || undefined,
      );

      paymentsToCreate.push({
        subscriptionId: subscription.id,
        expectedDate: new Date(firstBillingDate),
        expectedAmount: subscription.amount,
        status: 'pending',
      });
    }

    // Determine the starting point for payment generation
    let startingDate: Date;

    if (existingPayments.length === 0) {
      // No payments exist - start from the first billing date we just created
      startingDate = this.calculateNextBillingDate(
        startDate,
        subscription.billingFrequency as 'monthly' | 'quarterly' | 'yearly' | 'custom',
        subscription.customFrequencyDays || undefined,
      );
    } else {
      // Payments exist - start from the latest payment to check for gaps
      const sortedPayments = existingPayments.sort(
        (a, b) => new Date(b.expectedDate).getTime() - new Date(a.expectedDate).getTime(),
      );
      startingDate = sortedPayments[0].expectedDate;
    }

    // ALWAYS only generate up to today - never create future expected payments
    const endDate = now;

    let currentDate = new Date(startingDate);
    let safetyCounter = 0;
    const MAX_ITERATIONS = 1000;

    // Generate payments from start to end date
    while (safetyCounter < MAX_ITERATIONS) {
      const previousDate = new Date(currentDate);

      // Calculate next billing date
      const nextDate = this.calculateNextBillingDate(
        currentDate,
        subscription.billingFrequency as 'monthly' | 'quarterly' | 'yearly' | 'custom',
        subscription.customFrequencyDays || undefined,
      );

      // Safety check: ensure date actually progressed
      if (nextDate <= previousDate) {
        throw new Error(`Date calculation did not progress forward for subscription ${subscriptionId}`);
      }

      safetyCounter++;

      // Check if we've reached the end date
      if (nextDate > endDate) {
        break;
      }

      // Check if this payment already exists (including the first one we just created)
      const existingPayment = existingPayments.find(
        (p) => {
          const diff = Math.abs(
            new Date(p.expectedDate).getTime() - nextDate.getTime(),
          );
          return diff < 24 * 60 * 60 * 1000; // Within 1 day
        },
      );

      const alreadyCreated = paymentsToCreate.find(
        (p) => {
          const diff = Math.abs(
            p.expectedDate.getTime() - nextDate.getTime(),
          );
          return diff < 24 * 60 * 60 * 1000; // Within 1 day
        },
      );

      if (!existingPayment && !alreadyCreated) {
        paymentsToCreate.push({
          subscriptionId: subscription.id,
          expectedDate: new Date(nextDate),
          expectedAmount: subscription.amount,
          status: 'pending',
        });
      }

      currentDate = nextDate;
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
