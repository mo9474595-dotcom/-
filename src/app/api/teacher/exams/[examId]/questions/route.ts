import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedExam } from "@/lib/exams";
import { questionSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ examId: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { examId } = await params;
    await getOwnedExam(teacherId, examId);

    const body = await req.json().catch(() => null);
    const parsed = questionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const { type, text, points, correctAnswer, choices } = parsed.data;

    if (type === "MULTIPLE_CHOICE") {
      if (!choices || choices.length < 2) {
        return NextResponse.json(
          { error: "أضف خيارين على الأقل" },
          { status: 400 }
        );
      }
      if (!choices.some((c) => c.isCorrect)) {
        return NextResponse.json(
          { error: "حدد خياراً صحيحاً واحداً على الأقل" },
          { status: 400 }
        );
      }
    }

    const lastQuestion = await prisma.question.findFirst({
      where: { examId },
      orderBy: { order: "desc" },
    });
    const nextOrder = (lastQuestion?.order ?? -1) + 1;

    const question = await prisma.question.create({
      data: {
        examId,
        type,
        text,
        points,
        order: nextOrder,
        correctAnswer:
          type === "SHORT_ANSWER" && correctAnswer ? correctAnswer : null,
        choices:
          type === "MULTIPLE_CHOICE" && choices
            ? {
                create: choices.map((c, i) => ({
                  text: c.text,
                  isCorrect: c.isCorrect,
                  order: i,
                })),
              }
            : type === "TRUE_FALSE"
            ? {
                create: [
                  { text: "صح", isCorrect: correctAnswer === "true", order: 0 },
                  {
                    text: "خطأ",
                    isCorrect: correctAnswer !== "true",
                    order: 1,
                  },
                ],
              }
            : undefined,
      },
      include: { choices: true },
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
