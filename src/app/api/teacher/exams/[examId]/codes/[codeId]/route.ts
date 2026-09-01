import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedExamCode } from "@/lib/exams";
import { z } from "zod";

type RouteParams = { params: Promise<{ examId: string; codeId: string }> };

const updateSchema = z.object({
  extraMinutes: z.coerce.number().int().min(0).max(600),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { codeId } = await params;
    const owned = await getOwnedExamCode(teacherId, codeId);

    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const examCode = await prisma.examCode.update({
      where: { id: codeId },
      data: { extraMinutes: parsed.data.extraMinutes },
    });

    // If the student is already mid-attempt, extend their live deadline too
    // — an accommodation set after they've started (e.g. a technical issue
    // came up) should still take effect, not just apply to a future join.
    const attempt = await prisma.examAttempt.findUnique({ where: { examCodeId: codeId } });
    if (attempt && attempt.status === "IN_PROGRESS") {
      const deadlineAt = new Date(
        attempt.startedAt.getTime() + (owned.exam.durationMinutes + parsed.data.extraMinutes) * 60_000
      );
      await prisma.examAttempt.update({ where: { id: attempt.id }, data: { deadlineAt } });
    }

    return NextResponse.json({ examCode });
  } catch (err) {
    return handleApiError(err);
  }
}
