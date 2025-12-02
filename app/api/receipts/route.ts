import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { UserService } from "@/lib/services/user-service";
import { getClerkUserEmail } from "@/lib/auth-helpers";
import { submitLogEvent } from "@/lib/logging";
import { getReceipts } from "@/lib/receipt-scanner";

export const runtime = "nodejs";

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
