import { type NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { receipts, receiptItems, subscriptions, subscriptionPayments, households, householdUsers, users } from '@/lib/db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { type CorrelationId, submitLogEvent } from '@/lib/logging';

export const runtime = 'nodejs';

/**
 * GET /api/users/export
 * Export user data in CSV or JSON format
 * Query params:
 * - format: 'csv' | 'json' (default: csv)
 * - type: 'receipts' | 'subscriptions' | 'all' (default: all)
 */
export async function GET(req: NextRequest) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;

  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';
    const type = searchParams.get('type') || 'all';

    // Fetch user's receipts with items
    const userReceipts = await db
      .select({
        id: receipts.id,
        imageUrl: receipts.imageUrl,
        merchantName: receipts.merchantName,
        totalAmount: receipts.totalAmount,
        currency: receipts.currency,
        transactionDate: receipts.transactionDate,
        category: receipts.category,
        paymentMethod: receipts.paymentMethod,
        location: receipts.location,
        tax: receipts.tax,
        serviceCharge: receipts.serviceCharge,
        subtotal: receipts.subtotal,
        receiptNumber: receipts.receiptNumber,
        isBusinessExpense: receipts.isBusinessExpense,
        businessCategory: receipts.businessCategory,
        businessNotes: receipts.businessNotes,
        taxDeductible: receipts.taxDeductible,
        createdAt: receipts.createdAt,
      })
      .from(receipts)
      .where(
        and(
          eq(receipts.userId, user.id),
          isNull(receipts.deletedAt),
        ),
      )
      .orderBy(receipts.transactionDate);

    // Fetch user's subscriptions with payments
    const userSubscriptions = await db
      .select({
        id: subscriptions.id,
        name: subscriptions.name,
        description: subscriptions.description,
        category: subscriptions.category,
        amount: subscriptions.amount,
        currency: subscriptions.currency,
        billingFrequency: subscriptions.billingFrequency,
        billingDay: subscriptions.billingDay,
        status: subscriptions.status,
        startDate: subscriptions.startDate,
        nextBillingDate: subscriptions.nextBillingDate,
        lastPaymentDate: subscriptions.lastPaymentDate,
        isBusinessExpense: subscriptions.isBusinessExpense,
        website: subscriptions.website,
        notes: subscriptions.notes,
        createdAt: subscriptions.createdAt,
      })
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .orderBy(subscriptions.createdAt);

    // Fetch subscription payments
    const subscriptionIds = userSubscriptions.map(s => s.id);
    const payments = subscriptionIds.length > 0 ? await db
      .select({
        subscriptionId: subscriptionPayments.subscriptionId,
        expectedDate: subscriptionPayments.expectedDate,
        expectedAmount: subscriptionPayments.expectedAmount,
        status: subscriptionPayments.status,
        actualDate: subscriptionPayments.actualDate,
        actualAmount: subscriptionPayments.actualAmount,
        notes: subscriptionPayments.notes,
        createdAt: subscriptionPayments.createdAt,
      })
      .from(subscriptionPayments)
      .where(inArray(subscriptionPayments.subscriptionId, subscriptionIds))
      : [];

    // Fetch household memberships
    const userHouseholds = await db
      .select({
        householdId: householdUsers.householdId,
        role: householdUsers.role,
        householdName: households.name,
        joinedAt: householdUsers.createdAt,
      })
      .from(householdUsers)
      .innerJoin(households, eq(householdUsers.householdId, households.id))
      .where(eq(householdUsers.userId, user.id));

    // Update last exported timestamp
    await db
      .update(users)
      .set({ lastExportedAt: new Date() })
      .where(eq(users.id, user.id));

    submitLogEvent('user', `User exported data: format=${format}, type=${type}`, correlationId, { userId: user.id });

    // Generate export based on format
    if (format === 'json') {
      const exportData: Record<string, unknown> = {
        exportDate: new Date().toISOString(),
        user: {
          email: user.email,
          subscribed: user.subscribed,
          createdAt: user.createdAt,
        },
      };

      if (type === 'receipts-with-images') {
        // Fetch receipt items for all receipts
        const receiptIds = userReceipts.map(r => r.id);
        const allItems = receiptIds.length > 0 ? await db
          .select({
            receiptId: receiptItems.receiptId,
            name: receiptItems.name,
            quantity: receiptItems.quantity,
            price: receiptItems.price,
            totalPrice: receiptItems.totalPrice,
            category: receiptItems.category,
          })
          .from(receiptItems)
          .where(inArray(receiptItems.receiptId, receiptIds))
          : [];

        // Combine receipts with their items
        exportData.receipts = userReceipts.map(receipt => ({
          ...receipt,
          items: allItems.filter(item => item.receiptId === receipt.id),
        }));

        return NextResponse.json(exportData, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      if (type === 'receipts' || type === 'all') {
        exportData.receipts = userReceipts;
      }

      if (type === 'subscriptions' || type === 'all') {
        exportData.subscriptions = userSubscriptions.map(sub => ({
          ...sub,
          payments: payments.filter(p => p.subscriptionId === sub.id),
        }));
      }

      if (type === 'all') {
        exportData.households = userHouseholds;
      }

      return NextResponse.json(exportData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="smartspend-export-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    } else {
      // CSV format
      let csvContent = '';

      if (type === 'receipts' || type === 'all') {
        csvContent += 'RECEIPTS\n';
        csvContent += 'Merchant,Amount,Currency,Date,Category,Payment Method,Location,Tax,Subtotal,Receipt Number,Business Expense,Business Category,Tax Deductible,Created At\n';

        userReceipts.forEach(receipt => {
          csvContent += [
            escapeCSV(receipt.merchantName || ''),
            receipt.totalAmount || '',
            receipt.currency || '',
            receipt.transactionDate || '',
            receipt.category || '',
            receipt.paymentMethod || '',
            escapeCSV(receipt.location || ''),
            receipt.tax || '',
            receipt.subtotal || '',
            receipt.receiptNumber || '',
            receipt.isBusinessExpense ? 'Yes' : 'No',
            receipt.businessCategory || '',
            receipt.taxDeductible ? 'Yes' : 'No',
            receipt.createdAt?.toISOString() || '',
          ].join(',') + '\n';
        });
        csvContent += '\n';
      }

      if (type === 'subscriptions' || type === 'all') {
        csvContent += 'SUBSCRIPTIONS\n';
        csvContent += 'Name,Description,Amount,Currency,Billing Frequency,Billing Day,Status,Start Date,Next Billing,Last Payment,Business Expense,Website,Created At\n';

        userSubscriptions.forEach(sub => {
          csvContent += [
            escapeCSV(sub.name),
            escapeCSV(sub.description || ''),
            sub.amount,
            sub.currency,
            sub.billingFrequency,
            sub.billingDay,
            sub.status,
            sub.startDate?.toISOString().split('T')[0] || '',
            sub.nextBillingDate?.toISOString().split('T')[0] || '',
            sub.lastPaymentDate?.toISOString().split('T')[0] || '',
            sub.isBusinessExpense ? 'Yes' : 'No',
            sub.website || '',
            sub.createdAt?.toISOString() || '',
          ].join(',') + '\n';
        });
        csvContent += '\n';

        csvContent += 'SUBSCRIPTION PAYMENTS\n';
        csvContent += 'Subscription,Expected Date,Expected Amount,Status,Actual Date,Actual Amount,Notes\n';

        payments.forEach(payment => {
          const sub = userSubscriptions.find(s => s.id === payment.subscriptionId);
          csvContent += [
            escapeCSV(sub?.name || ''),
            payment.expectedDate?.toISOString().split('T')[0] || '',
            payment.expectedAmount,
            payment.status,
            payment.actualDate?.toISOString().split('T')[0] || '',
            payment.actualAmount || '',
            escapeCSV(payment.notes || ''),
          ].join(',') + '\n';
        });
        csvContent += '\n';
      }

      if (type === 'all') {
        csvContent += 'HOUSEHOLDS\n';
        csvContent += 'Household Name,Role,Joined At\n';

        userHouseholds.forEach(household => {
          csvContent += [
            escapeCSV(household.householdName),
            household.role,
            household.joinedAt?.toISOString() || '',
          ].join(',') + '\n';
        });
      }

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="smartspend-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }
  } catch (error) {
    submitLogEvent('user', `Error exporting data: ${error instanceof Error ? error.message : 'Unknown error'}`, correlationId, {}, true);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 },
    );
  }
}

/**
 * Escape CSV values to handle commas, quotes, and newlines
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
