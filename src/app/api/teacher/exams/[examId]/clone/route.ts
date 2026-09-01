import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedExam } from "@/lib/exams";

type RouteParams = { params: Promise<{ examId: string }> };

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { examId } = await params;
    await getOwnedExam(teacherId, examId);

    const source = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: { orderBy: { order: "asc" }, include: { choices: { orderBy: { order: "asc" } } } },
      },
    });
    if (!source) {
      return NextResponse.json({ error: "الامتحان غير موجود" }, { status: 404 });
    }

    // A clone is a fresh draft: unpublished, no schedule, no results
    // published, and no codes/attempts carried over — only the exam's own
    // settings and its question bank are worth duplicating.
    const clone = await prisma.exam.create({
      data: {
        teacherId,
        title: `${source.title} (نسخة)`,
        description: source.description,
        durationMinutes: source.durationMinutes,
        shuffleQuestions: source.shuffleQuestions,
        shuffleChoices: source.shuffleChoices,
        maxTabViolations: source.maxTabViolations,
        questions: {
          create: source.questions.map((q) => ({
            type: q.type,
            text: q.text,
            points: q.points,
            order: q.order,
            correctAnswer: q.correctAnswer,
            imageUrl: q.imageUrl,
            choices: {
              create: q.choices.map((c) => ({
                text: c.text,
                isCorrect: c.isCorrect,
                order: c.order,
              })),
            },
          })),
        },
      },
    });

    return NextResponse.json({ exam: clone }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
