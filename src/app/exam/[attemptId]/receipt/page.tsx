import Link from "next/link";
import { getExamSessionToken } from "@/lib/exam-session";
import { prisma } from "@/lib/prisma";
import ScoreFraction from "@/components/ScoreFraction";
import OrgLogo from "@/components/brand/OrgLogo";
import ReceiptPrintButton from "./ReceiptPrintButton";

const statusLabels: Record<string, string> = {
  SUBMITTED: "تم تسليم الامتحان بنجاح",
  AUTO_SUBMITTED: "تم التسليم تلقائياً لانتهاء الوقت المحدد",
  TERMINATED: "أُنهيت المحاولة بسبب تجاوز عدد المخالفات المسموح به",
};

export default async function ExamReceiptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  const token = await getExamSessionToken(attemptId);
  if (!token) return <CenteredMessage text="انتهت صلاحية الجلسة على هذا الجهاز." />;

  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: { exam: true },
  });
  if (!attempt || attempt.sessionToken !== token) {
    return <CenteredMessage text="هذه الجلسة غير صالحة لهذه المحاولة." />;
  }
  if (attempt.status === "IN_PROGRESS") {
    return <CenteredMessage text="لم تُسلَّم هذه المحاولة بعد." />;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-6 px-4 py-10">
      <ReceiptPrintButton />

      <div
        id="receipt"
        className="w-full rounded-2xl border-2 border-brand-blue/20 bg-white p-10 text-center shadow-sm"
      >
        <div className="flex flex-col items-center gap-2">
          <OrgLogo size={56} />
          <p className="text-sm font-medium text-slate-500">منظمة رياض النجاح للتنمية المستدامة</p>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-brand-navy-dark">إيصال إتمام الامتحان</h1>
        <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-brand-blue" />

        <div className="mt-8 flex flex-col gap-4 text-right">
          <Row label="اسم الطالب" value={attempt.studentName} />
          {attempt.studentRef && <Row label="الرقم / المعرّف" value={attempt.studentRef} />}
          <Row label="الامتحان" value={attempt.exam.title} />
          <Row label="حالة التسليم" value={statusLabels[attempt.status] ?? attempt.status} />
          <Row
            label="وقت التسليم"
            value={
              attempt.submittedAt
                ? new Date(attempt.submittedAt).toLocaleString("ar", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })
                : "—"
            }
          />
          <Row
            label="الدرجة"
            value={
              attempt.score != null && attempt.maxScore != null ? (
                <ScoreFraction score={attempt.score} max={attempt.maxScore} />
              ) : (
                "بانتظار التصحيح"
              )
            }
          />
        </div>

        <p className="mt-8 border-t border-dashed border-slate-200 pt-4 text-xs text-slate-400">
          رقم مرجعي: <span dir="ltr">{attempt.id}</span>
        </p>
      </div>

      <Link
        href={`/exam/${attemptId}/submitted`}
        className="no-print text-sm font-medium text-brand-blue hover:underline"
      >
        ← العودة
      </Link>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function CenteredMessage({ text }: { text: string }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-brand-page-tint px-4 py-16">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <p className="text-sm text-slate-600">{text}</p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-brand-blue hover:underline">
          العودة للصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
