import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-utils";
import { getVerifiedAttempt, closeIfExpired } from "@/lib/attempt-guard";
import { finalizeAttempt } from "@/lib/grading";
import { cheatEventSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ attemptId: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { attemptId } = await params;
    let attempt = await getVerifiedAttempt(attemptId);
    attempt = await closeIfExpired(attempt);

    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json({ status: attempt.status, tabViolations: attempt.tabViolations });
    }

    const body = await req.json().catch(() => null);
    const parsed = cheatEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.findUniqueOrThrow({ where: { id: attempt.examId } });

    const [, updated] = await prisma.$transaction([
      prisma.cheatLog.create({
        data: { attemptId, type: parsed.data.type, detail: parsed.data.detail },
      }),
      prisma.examAttempt.update({
        where: { id: attemptId },
        data: { tabViolations: { increment: 1 } },
      }),
    ]);

    let status: string = updated.status;
    if (
      exam.maxTabViolations > 0 &&
      updated.tabViolations >= exam.maxTabViolations &&
      updated.status === "IN_PROGRESS"
    ) {
      await finalizeAttempt(attemptId, "TERMINATED");
      status = "TERMINATED";
    }

    return NextResponse.json({ status, tabViolations: updated.tabViolations, maxTabViolations: exam.maxTabViolations });
  } catch (err) {
    return handleApiError(err);
  }
}
