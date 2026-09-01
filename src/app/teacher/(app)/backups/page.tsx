import { requireTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Icon from "@/components/brand/Icon";

export default async function BackupsPage() {
  const teacherId = await requireTeacherId();

  const backups = await prisma.backup.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });

  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-brand-navy-dark">
        <Icon name="cloud" size={22} className="text-brand-blue" />
        النسخ الاحتياطية
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        نسخة كاملة (JSON) من كل شعبك وامتحاناتك ودرجات طلابك. تُنشأ نسخة تلقائياً بشكل دوري
        ويُحتفظ بآخر 10 نسخ، بالإضافة إلى إمكانية تنزيل نسخة فورية في أي وقت.
      </p>

      <a
        href="/api/teacher/export"
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy"
      >
        <Icon name="cloud" size={14} />
        تنزيل نسخة فورية الآن
      </a>

      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">النسخ التلقائية المجدولة</h2>

        {backups.length === 0 ? (
          <p className="mt-6 py-6 text-center text-sm text-slate-500">
            لا توجد نسخ تلقائية بعد — ستظهر هنا أول ما يعمل الجدول الدوري.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {backups.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-brand-panel/40 p-3"
              >
                <span className="text-sm text-slate-700">
                  {new Date(b.createdAt).toLocaleString("ar", { dateStyle: "long", timeStyle: "short" })}
                </span>
                <a
                  href={`/api/teacher/backups/${b.id}`}
                  className="flex items-center gap-1 text-xs font-medium text-brand-blue hover:underline"
                >
                  <Icon name="cloud" size={13} />
                  تنزيل
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
