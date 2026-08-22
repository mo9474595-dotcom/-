import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedBankQuestion } from "@/lib/exams";
import { questionUpdateSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ bankQuestionId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { bankQuestionId } = await params;
    const existing = await getOwnedBankQuestion(teacherId, bankQuestionId);

    const body = await req.json().catch(() => null);
    const parsed = questionUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const { text, points, correctAnswer, choices } = parsed.data;

    const bankQuestion = await prisma.$transaction(async (tx) => {
      if (choices && existing.type === "MULTIPLE_CHOICE") {
        await tx.bankChoice.deleteMany({ where: { bankQuestionId } });
        await tx.bankChoice.createMany({
          data: choices.map((c, i) => ({
            bankQuestionId,
            text: c.text,
            isCorrect: c.isCorrect,
            order: i,
          })),
        });
      }

      return tx.bankQuestion.update({
        where: { id: bankQuestionId },
        data: {
          ...(text !== undefined ? { text } : {}),
          ...(points !== undefined ? { points } : {}),
          ...(existing.type === "SHORT_ANSWER" && correctAnswer !== undefined
            ? { correctAnswer }
            : {}),
        },
        include: { choices: { orderBy: { order: "asc" } } },
      });
    });

    return NextResponse.json({ bankQuestion });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { bankQuestionId } = await params;
    await getOwnedBankQuestion(teacherId, bankQuestionId);

    await prisma.bankQuestion.delete({ where: { id: bankQuestionId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
