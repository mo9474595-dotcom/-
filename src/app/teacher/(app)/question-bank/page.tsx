import { requireTeacherId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QuestionBankClient from "./QuestionBankClient";
import Icon from "@/components/brand/Icon";

export default async function QuestionBankPage() {
  const teacherId = await requireTeacherId();

  const bankQuestions = await prisma.bankQuestion.findMany({
    where: { teacherId },
    orderBy: { createdAt: "desc" },
    include: { choices: { orderBy: { order: "asc" } } },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-brand-navy-dark">
          <Icon name="folder" size={22} className="text-brand-blue" />
          بنك الأسئلة
        </h1>
      </div>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        احفظ أسئلة هنا لإعادة استخدامها في أكثر من امتحان دون كتابتها من جديد كل مرة. أي تعديل
        على السؤال هنا لا يغيّر نسخته المُضافة سابقاً في امتحان قائم.
      </p>
      <div className="mt-6">
        <QuestionBankClient initialBankQuestions={bankQuestions} />
      </div>
    </div>
  );
}
