import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import TrashClient from "./TrashClient";

export default async function TrashPage() {
  const teacherId = await requireTeacherId();

  const [classes, exams] = await Promise.all([
    prisma.classSection.findMany({
      where: { teacherId, deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      select: { id: true, name: true, deletedAt: true },
    }),
    prisma.exam.findMany({
      where: { teacherId, deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      select: { id: true, title: true, deletedAt: true },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">سلة المحذوفات</h1>
      <p className="mt-1 text-sm text-slate-500">
        الشعب والامتحانات المحذوفة تبقى هنا ويمكن استعادتها في أي وقت — لا يوجد حذف نهائي حالياً.
      </p>

      <TrashClient classes={classes} exams={exams} />
    </div>
  );
}
