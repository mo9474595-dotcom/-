import Link from "next/link";
import { requireTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Icon from "@/components/brand/Icon";

const WEEKDAYS = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const MONTH_NAMES = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

type CalendarEvent = {
  date: Date;
  type: "exam" | "attendance" | "project";
  title: string;
  subtitle: string;
  href: string;
};

const typeStyles: Record<CalendarEvent["type"], { bg: string; text: string; label: string }> = {
  exam: { bg: "bg-blue-100", text: "text-blue-700", label: "امتحان" },
  attendance: { bg: "bg-amber-100", text: "text-amber-700", label: "حضور" },
  project: { bg: "bg-green-100", text: "text-green-700", label: "تسليم مشروع" },
};

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const teacherId = await requireTeacherId();
  const { month } = await searchParams;

  const now = new Date();
  let year = now.getFullYear();
  let monthIndex = now.getMonth();
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    year = y;
    monthIndex = m - 1;
  }

  const classes = await prisma.classSection.findMany({
    where: { teacherId, deletedAt: null },
    select: { id: true, name: true },
  });
  const classIds = classes.map((c) => c.id);
  const classNameById = new Map(classes.map((c) => [c.id, c.name]));

  const [exams, attendanceSessions, projects] = await Promise.all([
    prisma.exam.findMany({
      where: { teacherId, deletedAt: null, opensAt: { not: null } },
      select: { id: true, title: true, opensAt: true },
    }),
    classIds.length
      ? prisma.attendanceSession.findMany({
          where: { classSectionId: { in: classIds } },
          select: { id: true, title: true, date: true, classSectionId: true },
        })
      : Promise.resolve([]),
    classIds.length
      ? prisma.project.findMany({
          where: { classSectionId: { in: classIds }, dueDate: { not: null } },
          select: { id: true, title: true, dueDate: true, classSectionId: true },
        })
      : Promise.resolve([]),
  ]);

  const events: CalendarEvent[] = [
    ...exams.map((e) => ({
      date: e.opensAt!,
      type: "exam" as const,
      title: e.title,
      subtitle: "يفتح الامتحان",
      href: `/teacher/exams/${e.id}`,
    })),
    ...attendanceSessions.map((s) => ({
      date: s.date,
      type: "attendance" as const,
      title: s.title || "جلسة حضور",
      subtitle: classNameById.get(s.classSectionId) ?? "",
      href: `/teacher/classes/${s.classSectionId}/attendance/${s.id}`,
    })),
    ...projects.map((p) => ({
      date: p.dueDate!,
      type: "project" as const,
      title: p.title,
      subtitle: classNameById.get(p.classSectionId) ?? "",
      href: `/teacher/classes/${p.classSectionId}/projects/${p.id}`,
    })),
  ];

  const eventsByDay = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const key = dayKey(ev.date);
    if (!eventsByDay.has(key)) eventsByDay.set(key, []);
    eventsByDay.get(key)!.push(ev);
  }

  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const cells: (Date | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, monthIndex, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = new Date(year, monthIndex - 1, 1);
  const nextMonth = new Date(year, monthIndex + 1, 1);
  const prevHref = `/teacher/calendar?month=${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
  const nextHref = `/teacher/calendar?month=${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;
  const todayKey = dayKey(now);

  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-brand-navy-dark">
        <Icon name="calendarCheck" size={22} className="text-brand-blue" />
        التقويم الموحّد
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        كل الامتحانات المجدولة، جلسات الحضور، ومواعيد تسليم المشاريع عبر جميع شعبك في مكان واحد.
      </p>

      <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <Link href={prevHref} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          ‹ الشهر السابق
        </Link>
        <h2 className="text-lg font-bold text-slate-900">
          {MONTH_NAMES[monthIndex]} {year}
        </h2>
        <Link href={nextHref} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          الشهر التالي ›
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
        {(Object.keys(typeStyles) as CalendarEvent["type"][]).map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${typeStyles[t].bg}`} />
            {typeStyles[t].label}
          </span>
        ))}
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-medium text-slate-500">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((date, i) => {
            const key = date ? dayKey(date) : `empty-${i}`;
            const dayEvents = date ? eventsByDay.get(dayKey(date)) ?? [] : [];
            const isToday = date && dayKey(date) === todayKey;
            return (
              <div
                key={key}
                className={`min-h-24 border-b border-l border-slate-100 p-1.5 align-top last:border-l-0 [&:nth-child(7n)]:border-l-0 ${
                  date ? "" : "bg-slate-50/50"
                }`}
              >
                {date && (
                  <>
                    <p
                      className={`mb-1 text-xs font-medium ${
                        isToday
                          ? "flex h-5 w-5 items-center justify-center rounded-full bg-brand-blue text-white"
                          : "text-slate-500"
                      }`}
                    >
                      {date.getDate()}
                    </p>
                    <div className="flex flex-col gap-1">
                      {dayEvents.slice(0, 3).map((ev, idx) => (
                        <Link
                          key={idx}
                          href={ev.href}
                          title={`${ev.title} — ${ev.subtitle}`}
                          className={`block truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${typeStyles[ev.type].bg} ${typeStyles[ev.type].text} hover:opacity-80`}
                        >
                          {ev.title}
                        </Link>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-slate-400">+{dayEvents.length - 3} أخرى</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
