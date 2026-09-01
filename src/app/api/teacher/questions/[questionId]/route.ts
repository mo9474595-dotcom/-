import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedQuestion } from "@/lib/exams";
import { questionUpdateSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ questionId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { questionId } = await params;
    const existing = await getOwnedQuestion(teacherId, questionId);

    const body = await req.json().catch(() => null);
    const parsed = questionUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const { text, points, correctAnswer, imageUrl, choices } = parsed.data;

    const question = await prisma.$transaction(async (tx) => {
      if (choices && existing.type === "MULTIPLE_CHOICE") {
        await tx.choice.deleteMany({ where: { questionId } });
        await tx.choice.createMany({
          data: choices.map((c, i) => ({
            questionId,
            text: c.text,
            isCorrect: c.isCorrect,
            order: i,
          })),
        });
      }

      return tx.question.update({
        where: { id: questionId },
        data: {
          ...(text !== undefined ? { text } : {}),
          ...(points !== undefined ? { points } : {}),
          ...(existing.type === "SHORT_ANSWER" && correctAnswer !== undefined
            ? { correctAnswer }
            : {}),
          ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}),
        },
        include: { choices: { orderBy: { order: "asc" } } },
      });
    });

    return NextResponse.json({ question });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { questionId } = await params;
    await getOwnedQuestion(teacherId, questionId);

    await prisma.question.delete({ where: { id: questionId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
