import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { receipts, receiptItems } from "@/lib/db/schema";
import { UserService } from "@/lib/services/user-service";
import { getClerkUserEmail } from "@/lib/auth-helpers";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { submitLogEvent } from "@/lib/logging";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // Prepare data for OpenAI
    const dataForAI = {
      period: `${months} months`,
      totalItems: items.length,
      totalSpent: totalSpent.toFixed(2),
      currency: items[0]?.currency || "USD",
      topItems: topItems.slice(0, 10),
      topCategories: topCategories.slice(0, 5),
      topMerchants: topMerchants.slice(0, 5),
    };

    submitLogEvent('receipt', "Calling OpenAI for spending summary", null, {
      userId: user.id,
      itemCount: items.length,
      totalSpent,
    });

    // Call OpenAI for summary
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful financial advisor analyzing spending patterns. Provide insights, identify trends, and offer actionable advice. Be concise but insightful. Use a friendly, conversational tone.",
        },
        {
          role: "user",
          content: `Analyze this spending data and provide a summary with insights and recommendations:

Period: ${dataForAI.period}
Total Items Purchased: ${dataForAI.totalItems}
Total Spent: ${dataForAI.currency} ${dataForAI.totalSpent}

Top 10 Most Frequently Purchased Items:
${dataForAI.topItems.map((item, i) => `${i + 1}. ${item.name} (${item.count} times)`).join('\n')}

Top 5 Spending Categories:
${dataForAI.topCategories.map((cat, i) => `${i + 1}. ${cat.category}: ${dataForAI.currency} ${cat.total}`).join('\n')}

Top 5 Merchants:
${dataForAI.topMerchants.map((m, i) => `${i + 1}. ${m.merchant}: ${dataForAI.currency} ${m.total}`).join('\n')}

Please provide:
1. A brief overview of spending patterns
2. Key insights about purchasing habits
3. Potential areas for savings
4. Any notable trends or patterns
5. 2-3 actionable recommendations

Keep the response under 300 words and format it in a friendly, easy-to-read way.`,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiSummary = response.choices[0]?.message?.content || "Unable to generate summary.";

    submitLogEvent('receipt', "AI spending summary generated", null, {
      userId: user.id,
      tokensUsed: response.usage?.total_tokens,
    });

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
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    });
  } catch (error) {
    submitLogEvent('receipt-error', `Error generating spending summary: ${error instanceof Error ? error.message : 'Unknown error'}`, null, {}, true);
    return NextResponse.json(
      { error: "Failed to generate spending summary" },
      { status: 500 }
    );
  }
}
