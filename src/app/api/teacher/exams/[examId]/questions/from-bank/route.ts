import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedExam } from "@/lib/exams";
import { addFromBankSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ examId: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { examId } = await params;
    await getOwnedExam(teacherId, examId);

    const body = await req.json().catch(() => null);
    const parsed = addFromBankSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    // findMany (not one findUnique per id) so ownership is checked in a single
    // query — any requested id that isn't this teacher's bank is silently
    // dropped rather than trusted.
    const bankQuestions = await prisma.bankQuestion.findMany({
      where: { id: { in: parsed.data.bankQuestionIds }, teacherId },
      include: { choices: { orderBy: { order: "asc" } } },
    });
    if (bankQuestions.length === 0) {
      return NextResponse.json({ error: "لم يتم العثور على أسئلة صالحة" }, { status: 400 });
    }

    const lastQuestion = await prisma.question.findFirst({
      where: { examId },
      orderBy: { order: "desc" },
    });
    let nextOrder = (lastQuestion?.order ?? -1) + 1;

    const questions = await prisma.$transaction(
      bankQuestions.map((bq) =>
        prisma.question.create({
          data: {
            examId,
            type: bq.type,
            text: bq.text,
            points: bq.points,
            order: nextOrder++,
            correctAnswer: bq.correctAnswer,
            choices: {
              create: bq.choices.map((c) => ({
                text: c.text,
                isCorrect: c.isCorrect,
                order: c.order,
              })),
            },
          },
          include: { choices: true },
        })
      )
    );

    return NextResponse.json({ questions }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
