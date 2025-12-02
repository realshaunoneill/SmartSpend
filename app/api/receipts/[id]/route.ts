import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { UserService } from "@/lib/services/user-service";
import { getClerkUserEmail } from "@/lib/auth-helpers";
import { submitLogEvent } from "@/lib/logging";
import { getReceiptById, deleteReceipt } from "@/lib/receipt-scanner";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      null,
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
      null,
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
