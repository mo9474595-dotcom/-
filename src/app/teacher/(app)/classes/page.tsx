import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";

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
        <h1 className="text-2xl font-bold text-slate-900">الشعب والطلاب</h1>
        <Link
          href="/teacher/classes/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + شعبة جديدة
        </Link>
      </div>

      {classes.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          لا توجد شعب بعد. أنشئ شعبة وأضف طلابها لتتبع درجاتهم ومشاريعهم وحضورهم.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/teacher/classes/${c.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <h2 className="font-semibold text-slate-900">{c.name}</h2>
              <div className="mt-4 flex gap-4 text-sm text-slate-600">
                <span>{c._count.students} طالب</span>
                <span>{c._count.projects} مشروع</span>
                <span>{c._count.attendanceSessions} جلسة حضور</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
