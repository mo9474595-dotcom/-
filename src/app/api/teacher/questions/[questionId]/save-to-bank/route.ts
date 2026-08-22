import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedQuestion } from "@/lib/exams";

type RouteParams = { params: Promise<{ questionId: string }> };

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { questionId } = await params;
    await getOwnedQuestion(teacherId, questionId);

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { choices: { orderBy: { order: "asc" } } },
    });
    if (!question) {
      return NextResponse.json({ error: "السؤال غير موجود" }, { status: 404 });
    }

    const bankQuestion = await prisma.bankQuestion.create({
      data: {
        teacherId,
        type: question.type,
        text: question.text,
        points: question.points,
        correctAnswer: question.correctAnswer,
        choices: {
          create: question.choices.map((c) => ({
            text: c.text,
            isCorrect: c.isCorrect,
            order: c.order,
          })),
        },
      },
      include: { choices: true },
    });

    return NextResponse.json({ bankQuestion }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
