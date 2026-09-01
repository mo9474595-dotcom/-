import Link from "next/link";
import { getExamSessionToken } from "@/lib/exam-session";
import { prisma } from "@/lib/prisma";
import { getAttemptReview } from "@/lib/exam-review";
import ExamReviewView from "@/components/ExamReviewView";

const messages: Record<string, string> = {
  not_found: "لم يتم العثور على هذه المحاولة.",
  in_progress: "لم تُسلَّم هذه المحاولة بعد.",
  not_published: "لم يقم الأستاذ بنشر تفاصيل النتيجة بعد. عد لاحقاً للاطلاع عليها.",
};

export default async function ExamReviewPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  const token = await getExamSessionToken(attemptId);
  if (!token) {
    return (
      <CenteredMessage text="انتهت صلاحية الجلسة على هذا الجهاز. إن كنت طالباً مسجلاً في شعبة، يمكنك مراجعة نتيجتك من رابط بوابتك الشخصية." />
    );
  }
  const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.sessionToken !== token) {
    return <CenteredMessage text="هذه الجلسة غير صالحة لهذه المحاولة." />;
  }

  const review = await getAttemptReview(attemptId);
  if (!review.ok) {
    return <CenteredMessage text={messages[review.reason]} />;
  }

  return <ExamReviewView data={review.data} />;
}

function CenteredMessage({ text }: { text: string }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-brand-page-tint px-4 py-16 dark:bg-slate-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-slate-800">
        <p className="text-sm text-slate-600 dark:text-slate-400">{text}</p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm font-medium text-brand-blue hover:underline dark:text-blue-400"
        >
          العودة للصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
