import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { receipts, receiptItems } from "@/lib/db/schema";
import { UserService } from "@/lib/services/user-service";
import { getClerkUserEmail } from "@/lib/auth-helpers";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { submitLogEvent } from "@/lib/logging";
import { generateSpendingSummary } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * GET /api/receipts/items/summary
 * Get AI-powered summary of spending patterns based on receipt items
 * Query params:
 * - householdId: string (optional) - Filter by household
 * - months: number (optional, default: 3) - Number of months to analyze
 */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Clerk user email
    const email = await getClerkUserEmail(clerkId);
    if (!email) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    // Get or create user in database
    const user = await UserService.getOrCreateUser(clerkId, email);

    const { searchParams } = new URL(req.url);
    const householdId = searchParams.get("householdId");
    const months = parseInt(searchParams.get("months") || "3");

    // Calculate date range
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    submitLogEvent('receipt', "Generating AI spending summary", null, {
      userId: user.id,
      householdId,
      months,
    });

    // Get all receipt items with their receipt details
    const items = await db
      .select({
        itemName: receiptItems.name,
        quantity: receiptItems.quantity,
        totalPrice: receiptItems.totalPrice,
        unitPrice: receiptItems.unitPrice,
        category: receiptItems.category,
        merchantName: receipts.merchantName,
        transactionDate: receipts.transactionDate,
        receiptCategory: receipts.category,
        currency: receipts.currency,
      })
      .from(receiptItems)
      .innerJoin(receipts, eq(receiptItems.receiptId, receipts.id))
      .where(
        and(
          eq(receipts.userId, user.id),
          gte(
            sql`TO_DATE(${receipts.transactionDate}, 'YYYY-MM-DD')`,
            startDate.toISOString().split('T')[0]
          ),
          sql`${receipts.deletedAt} IS NULL`,
          householdId ? eq(receipts.householdId, householdId) : undefined
        )
      )
      .orderBy(desc(receipts.transactionDate))
      .limit(500); // Limit to prevent token overflow

    if (items.length === 0) {
      return NextResponse.json({
        summary: "No receipt data found for the selected period.",
        itemCount: 0,
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          months,
        },
      });
    }

    // Calculate basic statistics
    const totalSpent = items.reduce((sum, item) => {
      return sum + parseFloat(item.totalPrice || item.unitPrice || "0");
    }, 0);

    const categoryBreakdown: Record<string, number> = {};
    const merchantBreakdown: Record<string, number> = {};
    const itemFrequency: Record<string, number> = {};

    items.forEach((item) => {
      const price = parseFloat(item.totalPrice || item.unitPrice || "0");
      
      // Category breakdown
      const category = item.category || item.receiptCategory || "other";
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + price;
      
      // Merchant breakdown
      const merchant = item.merchantName || "Unknown";
      merchantBreakdown[merchant] = (merchantBreakdown[merchant] || 0) + price;
      
      // Item frequency
      itemFrequency[item.itemName] = (itemFrequency[item.itemName] || 0) + 1;
    });

    // Get top items by frequency
    const topItems = Object.entries(itemFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, count]) => ({ name, count }));

    // Get top categories
    const topCategories = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([category, total]) => ({ category, total: parseFloat(total.toFixed(2)) }));

    // Get top merchants
    const topMerchants = Object.entries(merchantBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([merchant, total]) => ({ merchant, total: parseFloat(total.toFixed(2)) }));

    // Prepare data for AI analysis
    const dataForAI = {
      period: `${months} months`,
      totalItems: items.length,
      totalSpent: totalSpent.toFixed(2),
      currency: items[0]?.currency || "USD",
      topItems: topItems.slice(0, 10),
      topCategories: topCategories.slice(0, 5),
      topMerchants: topMerchants.slice(0, 5),
    };

    // Generate AI summary using OpenAI lib
    const { summary: aiSummary, usage: aiUsage } = await generateSpendingSummary(
      dataForAI,
      email,
      user.id
    );

    return NextResponse.json({
      summary: aiSummary,
      data: {
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          months,
        },
        statistics: {
          totalItems: items.length,
          totalSpent: parseFloat(totalSpent.toFixed(2)),
          currency: items[0]?.currency || "USD",
          averagePerItem: parseFloat((totalSpent / items.length).toFixed(2)),
        },
        topItems,
        topCategories,
        topMerchants,
      },
      usage: aiUsage,
    });
  } catch (error) {
    submitLogEvent('receipt-error', `Error generating spending summary: ${error instanceof Error ? error.message : 'Unknown error'}`, null, {}, true);
    return NextResponse.json(
      { error: "Failed to generate spending summary" },
      { status: 500 }
    );
  }
}
