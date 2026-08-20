import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import Icon from "@/components/brand/Icon";

const actionLabels: Record<string, string> = {
  MANUAL_GRADE_SET: "درجة يدوية",
  MANUAL_GRADE_DELETE: "حذف درجة يدوية",
  PROJECT_GRADE_SET: "درجة مشروع",
  ATTEMPT_ANSWER_GRADE_SET: "تصحيح إجابة",
  ATTEMPT_RESET: "إعادة تعيين محاولة",
  CLASS_DELETED: "حذف شعبة",
  CLASS_RESTORED: "استعادة شعبة",
  EXAM_DELETED: "حذف امتحان",
  EXAM_RESTORED: "استعادة امتحان",
};

export default async function AuditLogPage() {
  const teacherId = await requireTeacherId();

  const logs = await prisma.auditLog.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-brand-navy-dark">
        سجل التعديلات
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-panel text-brand-blue">
          <Icon name="clockHistory" size={17} />
        </span>
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        سجل يدخل الإجراءات الحساسة التي تمت من قبل المعلم. يمكنك عرض آخر 200 إجراء.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-right text-slate-500">
              <th className="px-4 py-3 font-medium">الوقت</th>
              <th className="px-4 py-3 font-medium">النوع</th>
              <th className="px-4 py-3 font-medium">التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-slate-100 last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {new Date(log.createdAt).toLocaleString("ar")}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="rounded-full bg-brand-panel px-2.5 py-0.5 text-xs font-medium text-brand-navy-dark">
                    {actionLabels[log.action] ?? log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{log.summary}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-panel text-brand-blue">
                    <Icon name="folder" size={28} />
                  </span>
                  <p className="mt-3 font-semibold text-slate-700">لا توجد إجراءات مسجَّلة بعد</p>
                  <p className="mt-1 text-sm text-slate-500">لم يتم تنفيذ أي إجراءات حساسة بعد.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
