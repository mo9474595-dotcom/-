import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import CodesClient from "./CodesClient";

export default async function CodesPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const teacherId = await requireTeacherId();
  const { examId } = await params;

  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam || exam.teacherId !== teacherId) notFound();

  const codes = await prisma.examCode.findMany({
    where: { examId },
    orderBy: { createdAt: "desc" },
    include: { attempt: { select: { status: true, score: true, maxScore: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">رموز الدخول — {exam.title}</h1>
      <p className="mt-1 text-sm text-slate-500">
        كل طالب يحتاج رمزاً فريداً للدخول إلى الامتحان. الرمز يُستخدم مرة واحدة فقط ولا يمكن
        مشاركته بين جهازين في نفس الوقت.
      </p>
      <CodesClient examId={examId} initialCodes={codes} />
    </div>
  );
}
