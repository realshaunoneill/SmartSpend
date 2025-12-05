import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { submitLogEvent } from "@/lib/logging";
import { getReceipts } from "@/lib/receipt-scanner";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const householdId = searchParams.get("householdId");
    const personalOnly = searchParams.get("personalOnly") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Use the helper function to get receipts
    const result = await getReceipts({
      userId: user.id,
      householdId,
      personalOnly,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    submitLogEvent('receipt', `Error fetching receipts: ${error instanceof Error ? error.message : 'Unknown error'}`, null, {}, true);
    return NextResponse.json(
      { error: "Failed to fetch receipts" },
      { status: 500 },
    );
  }
}
