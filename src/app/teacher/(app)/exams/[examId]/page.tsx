import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import ExamDetailClient from "./ExamDetailClient";
import Icon from "@/components/brand/Icon";

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
        <div className="flex gap-2">
          <Link
            href={`/teacher/exams/${exam.id}/results`}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Icon name="scale" size={15} />
            النتائج ({exam._count.attempts})
          </Link>
          <Link
            href={`/teacher/exams/${exam.id}/codes`}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Icon name="key" size={15} />
            رموز الدخول ({exam._count.codes})
          </Link>
          <Link
            href={`/teacher/print/${exam.id}`}
            target="_blank"
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Icon name="clipboard" size={15} />
            نسخة للطباعة
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-brand-navy-dark">{exam.title}</h1>
      </div>
      <div className="mt-1 flex justify-end">
        <div className="h-1 w-16 rounded-full bg-brand-blue" />
      </div>

      <ExamDetailClient exam={exam} />
    </div>
  );
}
