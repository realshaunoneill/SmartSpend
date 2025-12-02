import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { receipts, receiptItems } from "@/lib/db/schema";
import { UserService } from "@/lib/services/user-service";
import { analyzeReceiptSimple } from "@/lib/openai";
import { submitLogEvent } from "@/lib/logging";

// Route configuration
export const runtime = "nodejs";
export const maxDuration = 60; // Increased for OpenAI processing

const ENV_PATH_PREFIX =
  process.env.NODE_ENV === "production" ? "prod" : "dev";
const MAX_UPLOAD_SIZE_MB = parseInt(
  process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || "15",
);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Clerk user to get email
    const clerkUser = await currentUser();
    if (!clerkUser?.emailAddresses?.[0]?.emailAddress) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 },
      );
    }

    const email = clerkUser.emailAddresses[0].emailAddress;

    // Get or create user in database
    const user = await UserService.getOrCreateUser(clerkId, email);

    // Check subscription (skip in development if SKIP_SUBSCRIPTION_CHECK is set)
    const skipSubscriptionCheck =
      process.env.SKIP_SUBSCRIPTION_CHECK === "true";
    if (!skipSubscriptionCheck && !user.subscribed) {
      return NextResponse.json(
        { error: "Subscription required to upload receipts" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as HandleUploadBody;

    submitLogEvent('receipt-upload', "Starting receipt upload", null, { userId: user.id, clerkId });

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (
        pathname: string,
        clientPayload: string | null,
      ) => {
        if (!pathname.startsWith(`${ENV_PATH_PREFIX}/receipts/`)) {
          throw new Error("Invalid pathname");
        }

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: MAX_UPLOAD_SIZE_MB * 1024 * 1024,
          tokenPayload: JSON.stringify({
            userId: user.id,
            clerkId,
            clientPayload,
          }),
        };
      },
    });

    // Check if this is just a token generation response
    if (jsonResponse.type === "blob.generate-client-token") {
      return NextResponse.json(jsonResponse);
    }

    submitLogEvent('receipt-upload', "Upload completed, processing receipt", null, { userId: user.id, clerkId });

    // For upload completion, just return success
    // The actual processing will happen via webhook or we need a different approach
    return NextResponse.json(jsonResponse);
  } catch (error) {
    submitLogEvent('receipt-error', `Receipt upload error: ${error instanceof Error ? error.message : 'Unknown error'}`, null, { error: error instanceof Error ? error.stack : undefined }, true);
    return NextResponse.json(
      {
        error: (error as Error).message,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 400 },
    );
  }
}
