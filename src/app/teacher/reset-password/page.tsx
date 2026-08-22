import AppHeader from "@/components/brand/AppHeader";
import Icon from "@/components/brand/Icon";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="تعيين كلمة مرور جديدة" icon={<Icon name="lock" size={18} />} />

      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-brand-page-tint px-4 py-16">
        <div className="brand-dot-grid pointer-events-none absolute right-16 top-16 hidden h-28 w-40 text-brand-blue/20 sm:block" />
        <div className="brand-ring pointer-events-none absolute -left-16 top-1/3 hidden h-44 w-44 border-emerald-400/40 sm:block" />

        <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-panel text-brand-blue">
            <Icon name="lock" size={24} />
          </div>
          <h1 className="text-center text-2xl font-bold text-brand-navy-dark">كلمة مرور جديدة</h1>
          <p className="mt-1 text-center text-sm text-slate-500">
            اختر كلمة مرور جديدة لحسابك.
          </p>

          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}
