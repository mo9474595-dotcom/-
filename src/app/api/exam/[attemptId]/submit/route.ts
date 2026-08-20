import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-utils";
import { getVerifiedAttempt, closeIfExpired } from "@/lib/attempt-guard";
import { finalizeAttempt } from "@/lib/grading";

type RouteParams = { params: Promise<{ attemptId: string }> };

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const { attemptId } = await params;
    let attempt = await getVerifiedAttempt(attemptId);
    attempt = await closeIfExpired(attempt);

    if (attempt.status === "IN_PROGRESS") {
      await finalizeAttempt(attempt.id, "SUBMITTED");
      attempt = await prisma.examAttempt.findUniqueOrThrow({
        where: { id: attempt.id },
      });
    }

    return NextResponse.json({ status: attempt.status });
  } catch (err) {
    return handleApiError(err);
  }
}
