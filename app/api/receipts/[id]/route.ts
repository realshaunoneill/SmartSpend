import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { CorrelationId, submitLogEvent } from "@/lib/logging";
import { getReceiptById, deleteReceipt } from "@/lib/receipt-scanner";
import { randomUUID } from "crypto";

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

    // Verify the user owns this receipt
    if (receipt.userId !== user.id) {
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
      }
    );

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
