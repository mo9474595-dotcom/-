import { requireTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Icon from "@/components/brand/Icon";
import AssistantsClient from "./AssistantsClient";

export default async function AssistantsPage() {
  const teacherId = await requireTeacherId();

  const assistants = await prisma.teacher.findMany({
    where: { ownerId: teacherId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-brand-navy-dark">
        <Icon name="users" size={22} className="text-brand-blue" />
        المساعدون
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        أنشئ حسابات مساعدين يسجّلون الدخول من نفس صفحة تسجيل الدخول العادية، ويرون امتحاناتك
        فقط لعرض النتائج وتصحيح الأسئلة ذات الإجابة القصيرة — دون صلاحية حذف أي شيء أو تعديل
        إعدادات الامتحانات أو الشعب.
      </p>

      <AssistantsClient initialAssistants={assistants} />
    </div>
  );
}
