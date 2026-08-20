import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import ExamDetailClient from "./ExamDetailClient";

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const teacherId = await requireTeacherId();
  const { examId } = await params;

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      questions: { orderBy: { order: "asc" }, include: { choices: { orderBy: { order: "asc" } } } },
      _count: { select: { attempts: true, codes: true } },
    },
  });

  if (!exam || exam.teacherId !== teacherId || exam.deletedAt) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{exam.title}</h1>
        <div className="flex gap-2">
          <Link
            href={`/teacher/exams/${exam.id}/codes`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            رموز الدخول ({exam._count.codes})
          </Link>
          <Link
            href={`/teacher/exams/${exam.id}/results`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            النتائج ({exam._count.attempts})
          </Link>
        </div>
      </div>

      <ExamDetailClient exam={exam} />
    </div>
  );
}
