import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-utils";
import { joinExamSchema } from "@/lib/validation";
import { generateSessionToken, setExamSessionCookie, getExamSessionToken } from "@/lib/exam-session";
import { shuffle } from "@/lib/shuffle";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = joinExamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const { code, studentName, studentRef } = parsed.data;

    const examCode = await prisma.examCode.findUnique({
      where: { code },
      include: { exam: true, attempt: true },
    });

    if (!examCode) {
      return NextResponse.json({ error: "رمز الامتحان غير صحيح" }, { status: 404 });
    }
    if (!examCode.exam.isPublished) {
      return NextResponse.json(
        { error: "هذا الامتحان غير متاح حالياً" },
        { status: 403 }
      );
    }

    if (examCode.attempt) {
      const attempt = examCode.attempt;

      if (attempt.status === "IN_PROGRESS") {
        const cookieToken = await getExamSessionToken(attempt.id);
        if (cookieToken && cookieToken === attempt.sessionToken) {
          // Same browser resuming (e.g. page refresh) — let them back in.
          return NextResponse.json({ attemptId: attempt.id });
        }

        await prisma.cheatLog.create({
          data: {
            attemptId: attempt.id,
            type: "MULTIPLE_SESSION_BLOCKED",
            detail: "Join attempted from a different session while in progress",
          },
        });
        return NextResponse.json(
          { error: "هذا الرمز قيد الاستخدام حالياً من جهاز آخر" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "تم استخدام هذا الرمز بالفعل ولا يمكن إعادة الدخول" },
        { status: 409 }
      );
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examCode.examId },
      include: { questions: { include: { choices: true }, orderBy: { order: "asc" } } },
    });
    if (!exam || exam.questions.length === 0) {
      return NextResponse.json(
        { error: "لا يحتوي هذا الامتحان على أسئلة بعد" },
        { status: 400 }
      );
    }

    const questionIds = exam.questions.map((q) => q.id);
    const orderedQuestionIds = exam.shuffleQuestions ? shuffle(questionIds) : questionIds;

    const choiceOrderMap: Record<string, string[]> = {};
    for (const q of exam.questions) {
      const choiceIds = q.choices.map((c) => c.id);
      choiceOrderMap[q.id] = exam.shuffleChoices ? shuffle(choiceIds) : choiceIds;
    }

    const sessionToken = generateSessionToken();
    const now = new Date();
    const deadlineAt = new Date(now.getTime() + exam.durationMinutes * 60_000);
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    const attempt = await prisma.$transaction(async (tx) => {
      const created = await tx.examAttempt.create({
        data: {
          examId: exam.id,
          examCodeId: examCode.id,
          studentName,
          studentRef: studentRef || null,
          sessionToken,
          deadlineAt,
          ipAddress,
          questionOrder: JSON.stringify(orderedQuestionIds),
          choiceOrderMap: JSON.stringify(choiceOrderMap),
        },
      });
      await tx.examCode.update({
        where: { id: examCode.id },
        data: { usedAt: now, studentName, studentRef: studentRef || null },
      });
      return created;
    });

    // Cookie outlives the exam a bit so the "submitted" confirmation page
    // still works after the deadline passes.
    const cookieExpiry = new Date(deadlineAt.getTime() + 60 * 60_000);
    await setExamSessionCookie(attempt.id, sessionToken, cookieExpiry);

    return NextResponse.json({ attemptId: attempt.id });
  } catch (err) {
    return handleApiError(err);
  }
}
