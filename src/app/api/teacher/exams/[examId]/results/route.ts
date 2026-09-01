import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedExam } from "@/lib/exams";

type RouteParams = { params: Promise<{ examId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { examId } = await params;
    await getOwnedExam(teacherId, examId);

    const attempts = await prisma.examAttempt.findMany({
      where: { examId },
      orderBy: { startedAt: "desc" },
      include: {
        examCode: { select: { code: true } },
        _count: { select: { cheatLogs: true } },
        answers: {
          where: { question: { type: { in: ["SHORT_ANSWER", "AUDIO_ANSWER"] } } },
          select: { id: true, pointsAwarded: true },
        },
      },
    });

    return NextResponse.json({ attempts });
  } catch (err) {
    return handleApiError(err);
  }
}
