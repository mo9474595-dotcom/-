import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import Icon from "@/components/brand/Icon";

export default async function ClassesPage() {
  const teacherId = await requireTeacherId();

  const classes = await prisma.classSection.findMany({
    where: { teacherId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { students: true, projects: true, attendanceSessions: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link
          href="/teacher/classes/new"
          className="flex items-center gap-2 rounded-full bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-navy"
        >
          شعبة جديدة +
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-brand-navy-dark">الشعب والطلاب</h1>
          <div className="mt-1 h-1 w-16 rounded-full bg-brand-blue" />
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white p-12 text-center text-slate-500 shadow-sm">
          لا توجد شعب بعد. أنشئ شعبة وأضف طلابها لتتبع درجاتهم ومشاريعهم وحضورهم.
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/teacher/classes/${c.id}`}
              className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-panel text-brand-blue">
                <Icon name="graduationCap" size={20} />
              </span>
              <h2 className="flex-1 text-right font-semibold text-slate-900">{c.name}</h2>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  {c._count.students} طالب <Icon name="users" size={15} />
                </span>
                <span className="h-4 w-px bg-slate-200" />
                <span className="flex items-center gap-1.5">
                  {c._count.projects} مشروع <Icon name="folder" size={15} />
                </span>
                <span className="h-4 w-px bg-slate-200" />
                <span className="flex items-center gap-1.5">
                  {c._count.attendanceSessions} جلسة حضور <Icon name="calendarCheck" size={15} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
