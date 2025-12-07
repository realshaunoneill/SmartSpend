import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { UserService } from "@/lib/services/user-service";
import { CorrelationId } from "@/lib/logging";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const correlationId = (req.headers.get('x-correlation-id') || randomUUID()) as CorrelationId;
  
  try {
    const authResult = await getAuthenticatedUser(correlationId);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const isAdmin = await UserService.isAdmin(user.id);

    return NextResponse.json({
      isAdmin,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check admin status" },
      { status: 500 }
    );
  }
}
