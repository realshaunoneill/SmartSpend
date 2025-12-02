import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { receipts } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { submitLogEvent } from "@/lib/logging";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const receiptId = params.id;

    // Get the receipt to verify ownership
    const receipt = await db.query.receipts.findFirst({
      where: and(
        eq(receipts.id, receiptId),
        isNull(receipts.deletedAt)
      ),
    });

    if (!receipt) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      );
    }

    // Verify the user owns this receipt
    if (receipt.userId !== clerkId) {
      return NextResponse.json(
        { error: "You can only delete your own receipts" },
        { status: 403 }
      );
    }

    // Soft delete the receipt
    await db
      .update(receipts)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(receipts.id, receiptId));

    // Log the deletion
    await submitLogEvent({
      level: "info",
      category: "receipt",
      message: "Receipt soft deleted",
      metadata: {
        receiptId,
        userId: clerkId,
        merchantName: receipt.merchantName,
        totalAmount: receipt.totalAmount,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Receipt deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting receipt:", error);

    await submitLogEvent({
      level: "error",
      category: "receipt-error",
      message: "Failed to delete receipt",
      metadata: {
        error: error instanceof Error ? error.message : "Unknown error",
        receiptId: params.id,
      },
    });

    return NextResponse.json(
      { error: "Failed to delete receipt" },
      { status: 500 }
    );
  }
}
