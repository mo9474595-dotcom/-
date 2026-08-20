import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";

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
      <h1 className="text-2xl font-bold text-slate-900">سجل التعديلات</h1>
      <p className="mt-1 text-sm text-slate-500">
        سجل بكل الإجراءات الحساسة التي قمت بها (تعديل درجات، إعادة تعيين محاولات...)، لآخر
        200 إجراء.
      </p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
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
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    {actionLabels[log.action] ?? log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{log.summary}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                  لا توجد إجراءات مسجَّلة بعد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
