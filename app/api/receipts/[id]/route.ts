import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { CorrelationId, submitLogEvent } from "@/lib/logging";
import { getReceiptById, deleteReceipt } from "@/lib/receipt-scanner";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { insightsCache } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = (request.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { id: receiptId } = await params;

    const receipt = await getReceiptById(receiptId);

    if (!receipt) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      );
    }

    // Verify the user owns this receipt or is admin
    if (receipt.userId !== user.id && !user.isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to view this receipt" },
        { status: 403 }
      );
    }

    return NextResponse.json(receipt);
  } catch (error) {
    console.error("Error fetching receipt:", error);
    
    submitLogEvent(
      "receipt-error",
      "Failed to fetch receipt",
      correlationId,
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      true
    );

    return NextResponse.json(
      { error: "Failed to fetch receipt" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = (request.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Await params in Next.js 15+
    const { id: receiptId } = await params;

    // Get the receipt to verify ownership and log details
    const receipt = await getReceiptById(receiptId);

    if (!receipt) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      );
    }

    // Verify the user owns this receipt or is admin
    if (receipt.userId !== user.id && !user.isAdmin) {
      return NextResponse.json(
        { error: "You can only delete your own receipts" },
        { status: 403 }
      );
    }

    // Soft delete the receipt using helper function
    const deleted = await deleteReceipt(receiptId, user.id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete receipt" },
        { status: 500 }
      );
    }

    // Log the deletion
    submitLogEvent(
      "receipt",
      "Receipt soft deleted",
      correlationId,
      {
        receiptId,
        userId: user.id,
        merchantName: receipt.merchantName,
        totalAmount: receipt.totalAmount,
        deletedByAdmin: user.isAdmin && receipt.userId !== user.id,
        receiptOwnerId: receipt.userId,
      }
    );

    // Invalidate insights cache for this user
    try {
      await db
        .delete(insightsCache)
        .where(
          or(
            eq(insightsCache.userId, user.id),
            receipt.householdId ? eq(insightsCache.householdId, receipt.householdId) : undefined
          )
        );
      submitLogEvent('receipt', "Invalidated insights cache after receipt deletion", correlationId, { userId: user.id, householdId: receipt.householdId });
    } catch (cacheError) {
      // Log but don't fail the request if cache invalidation fails
      submitLogEvent('receipt-error', `Failed to invalidate insights cache: ${cacheError instanceof Error ? cacheError.message : 'Unknown error'}`, correlationId, {}, true);
    }

    return NextResponse.json({
      success: true,
      message: "Receipt deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting receipt:", error);

    // Get receiptId from params for error logging
    const { id: receiptId } = await params;
    
    submitLogEvent(
      "receipt-error",
      "Failed to delete receipt",
      correlationId,
      {
        error: error instanceof Error ? error.message : "Unknown error",
        receiptId,
      },
      true // alert on error
    );

    return NextResponse.json(
      { error: "Failed to delete receipt" },
      { status: 500 }
    );
  }
}
