import Link from "next/link";
import type { StudentBreakdown } from "@/lib/ranking";
import Icon from "@/components/brand/Icon";

function pct(v: number | null) {
  return v == null ? "—" : `${v.toFixed(1)}%`;
}

export default function RankingTable({
  classId,
  ranking,
}: {
  classId: string;
  ranking: StudentBreakdown[];
}) {
  const ranked = ranking.filter((r) => r.overallPct != null);
  const top = ranked[0];
  const bottom = ranked.length > 1 ? ranked[ranked.length - 1] : null;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        <Icon name="users" size={17} className="text-brand-blue" />
        ترتيب الطلاب
      </h2>

      {ranking.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">أضف طلاباً لعرض الترتيب.</p>
      ) : (
        <>
          {(top || bottom) && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {top && (
                <div className="rounded-xl bg-green-50 p-4">
                  <p className="text-xs font-medium text-green-700">الأعلى تفوقاً</p>
                  <p className="mt-1 font-semibold text-green-900">{top.fullName}</p>
                  <p className="text-sm text-green-700">{pct(top.overallPct)}</p>
                </div>
              )}
              {bottom && (
                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-xs font-medium text-amber-700">
                    يحتاج متابعة (الأضعف)
                  </p>
                  <p className="mt-1 font-semibold text-amber-900">{bottom.fullName}</p>
                  <p className="text-sm text-amber-700">{pct(bottom.overallPct)}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-right text-slate-500">
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">الطالب</th>
                  <th className="px-3 py-2 font-medium">الامتحانات</th>
                  <th className="px-3 py-2 font-medium">درجات أخرى</th>
                  <th className="px-3 py-2 font-medium">المشاريع</th>
                  <th className="px-3 py-2 font-medium">الحضور</th>
                  <th className="px-3 py-2 font-medium">المعدل العام</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, i) => (
                  <tr key={r.studentId} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/teacher/classes/${classId}/students/${r.studentId}`}
                        className="font-medium text-brand-blue hover:underline"
                      >
                        {r.fullName}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{pct(r.examPct)}</td>
                    <td className="px-3 py-2 text-slate-600">{pct(r.manualPct)}</td>
                    <td className="px-3 py-2 text-slate-600">{pct(r.projectPct)}</td>
                    <td className="px-3 py-2 text-slate-600">{pct(r.attendancePct)}</td>
                    <td className="px-3 py-2 font-semibold text-slate-900">
                      {pct(r.overallPct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
