import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, ConflictError } from "@/lib/api-utils";
import { getVerifiedAttempt, closeIfExpired } from "@/lib/attempt-guard";
import { answerSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ attemptId: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { attemptId } = await params;
    let attempt = await getVerifiedAttempt(attemptId);
    attempt = await closeIfExpired(attempt);

    if (attempt.status !== "IN_PROGRESS") {
      throw new ConflictError("انتهى الوقت أو تم تسليم الامتحان بالفعل");
    }

    const body = await req.json().catch(() => null);
    const parsed = answerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const { questionId, selectedChoiceId, textAnswer, audioUrl } = parsed.data;

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { choices: true },
    });
    if (!question || question.examId !== attempt.examId) {
      return NextResponse.json({ error: "سؤال غير صالح" }, { status: 400 });
    }

    let isCorrect: boolean | null = null;
    let pointsAwarded: number | null = null;
    let validatedChoiceId: string | null = null;

    if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
      const choice = question.choices.find((c) => c.id === selectedChoiceId);
      if (!choice) {
        return NextResponse.json({ error: "خيار غير صالح" }, { status: 400 });
      }
      validatedChoiceId = choice.id;
      isCorrect = choice.isCorrect;
      pointsAwarded = choice.isCorrect ? question.points : 0;
    } else if (question.type === "SHORT_ANSWER") {
      // Exact case-insensitive match auto-grades; anything else is left
      // for the teacher to grade manually.
      const trimmed = (textAnswer ?? "").trim();
      if (question.correctAnswer && trimmed) {
        const matches =
          trimmed.toLowerCase() === question.correctAnswer.trim().toLowerCase();
        if (matches) {
          isCorrect = true;
          pointsAwarded = question.points;
        }
      }
    }
    // AUDIO_ANSWER always needs the teacher to listen and grade manually —
    // there's nothing to auto-match a recording against.

    const answer = await prisma.answer.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      create: {
        attemptId,
        questionId,
        selectedChoiceId: validatedChoiceId,
        textAnswer: question.type === "SHORT_ANSWER" ? textAnswer ?? null : null,
        audioUrl: question.type === "AUDIO_ANSWER" ? audioUrl ?? null : null,
        isCorrect,
        pointsAwarded,
      },
      update: {
        selectedChoiceId: validatedChoiceId,
        textAnswer: question.type === "SHORT_ANSWER" ? textAnswer ?? null : null,
        audioUrl: question.type === "AUDIO_ANSWER" ? audioUrl ?? null : null,
        isCorrect,
        pointsAwarded,
      },
    });

    return NextResponse.json({ savedAt: answer.updatedAt });
  } catch (err) {
    return handleApiError(err);
  }
}
