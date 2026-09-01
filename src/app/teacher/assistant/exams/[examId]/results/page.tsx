import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacherId, resolveScopeTeacherId } from "@/lib/auth";
import ResultsTableClient from "@/app/teacher/(app)/exams/[examId]/results/ResultsTableClient";

export default async function AssistantResultsPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const teacherId = await requireTeacherId();
  const ownerId = await resolveScopeTeacherId(teacherId);
  const { examId } = await params;

  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam || exam.teacherId !== ownerId || exam.deletedAt) notFound();

  const attempts = await prisma.examAttempt.findMany({
    where: { examId },
    orderBy: { startedAt: "desc" },
    include: {
      _count: { select: { cheatLogs: true } },
      answers: {
        where: { question: { type: "SHORT_ANSWER" } },
        select: { pointsAwarded: true },
      },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy-dark">النتائج — {exam.title}</h1>
      <div className="mt-1 h-1 w-16 rounded-full bg-brand-blue" />
      <ResultsTableClient examId={examId} attempts={attempts} basePath="/teacher/assistant/exams" />
    </div>
  );
}
