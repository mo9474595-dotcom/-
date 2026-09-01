import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAttemptReview } from "@/lib/exam-review";
import ExamReviewView from "@/components/ExamReviewView";

const messages: Record<string, string> = {
  not_found: "لم يتم العثور على هذه المحاولة.",
  in_progress: "لم تُسلَّم هذه المحاولة بعد.",
  not_published: "لم يقم الأستاذ بنشر تفاصيل النتيجة بعد. عد لاحقاً للاطلاع عليها.",
};

export default async function StudentExamReviewPage({
  params,
}: {
  params: Promise<{ token: string; attemptId: string }>;
}) {
  const { token, attemptId } = await params;

  const student = await prisma.studentProfile.findUnique({ where: { portalToken: token } });
  if (!student) notFound();

  // Ownership check: the attempt's exam code must have been generated for
  // this exact student profile — a portal token can't be used to read
  // another student's review by guessing an attempt id.
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: { examCode: true },
  });
  if (!attempt || attempt.examCode.studentProfileId !== student.id) notFound();

  const review = await getAttemptReview(attemptId);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl px-4 pt-6">
        <Link
          href={`/student/${token}`}
          className="text-sm font-medium text-brand-blue hover:underline dark:text-blue-400"
        >
          ← العودة إلى بوابتي
        </Link>
      </div>
      {review.ok ? (
        <ExamReviewView data={review.data} />
      ) : (
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400">{messages[review.reason]}</p>
          </div>
        </div>
      )}
    </div>
  );
}
