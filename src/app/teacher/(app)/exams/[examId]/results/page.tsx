import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import ResultsTableClient from "./ResultsTableClient";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const teacherId = await requireTeacherId();
  const { examId } = await params;

  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam || exam.teacherId !== teacherId || exam.deletedAt) notFound();

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

      <div className="relative mt-4 hidden h-32 overflow-hidden rounded-2xl shadow-sm sm:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/photos/results-banner.jpg"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-brand-navy-dark/80 via-brand-navy-dark/30 to-transparent" />
        <p className="absolute inset-y-0 right-6 flex items-center text-lg font-bold text-white">
          نتائج طلابك جاهزة للمراجعة
        </p>
      </div>

      <ResultsTableClient examId={examId} attempts={attempts} />
    </div>
  );
}
