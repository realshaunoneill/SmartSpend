import { db } from '@/lib/db';
import { subscriptions, type Subscription } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export class SubscriptionService {
  /**
   * Calculate next billing date based on billing frequency
   */
  static calculateNextBillingDate(
    startDate: Date,
    billingFrequency: 'monthly' | 'quarterly' | 'yearly' | 'custom',
    customFrequencyDays?: number,
  ): Date {
    const nextBilling = new Date(startDate);

    switch (billingFrequency) {
      case 'monthly':
        nextBilling.setMonth(nextBilling.getMonth() + 1);
        break;
      case 'quarterly':
        nextBilling.setMonth(nextBilling.getMonth() + 3);
        break;
      case 'yearly':
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
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
