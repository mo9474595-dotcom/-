import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { bankQuestionSchema } from "@/lib/validation";

export async function GET() {
  try {
    const teacherId = await requireTeacherId();
    const bankQuestions = await prisma.bankQuestion.findMany({
      where: { teacherId },
      orderBy: { createdAt: "desc" },
      include: { choices: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json({ bankQuestions });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const teacherId = await requireTeacherId();
    const body = await req.json().catch(() => null);
    const parsed = bankQuestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const { type, text, points, correctAnswer, imageUrl, choices } = parsed.data;

    if (type === "MULTIPLE_CHOICE") {
      if (!choices || choices.length < 2) {
        return NextResponse.json({ error: "أضف خيارين على الأقل" }, { status: 400 });
      }
      if (!choices.some((c) => c.isCorrect)) {
        return NextResponse.json(
          { error: "حدد خياراً صحيحاً واحداً على الأقل" },
          { status: 400 }
        );
      }
    }

    const bankQuestion = await prisma.bankQuestion.create({
      data: {
        teacherId,
        type,
        text,
        points,
        correctAnswer: type === "SHORT_ANSWER" && correctAnswer ? correctAnswer : null,
        imageUrl: imageUrl || null,
        choices:
          type === "MULTIPLE_CHOICE" && choices
            ? { create: choices.map((c, i) => ({ text: c.text, isCorrect: c.isCorrect, order: i })) }
            : type === "TRUE_FALSE"
            ? {
                create: [
                  { text: "صح", isCorrect: correctAnswer === "true", order: 0 },
                  { text: "خطأ", isCorrect: correctAnswer !== "true", order: 1 },
                ],
              }
            : undefined,
      },
      include: { choices: true },
    });

    return NextResponse.json({ bankQuestion }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
