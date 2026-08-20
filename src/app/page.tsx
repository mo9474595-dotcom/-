import Link from "next/link";
import OrgLogo from "@/components/brand/OrgLogo";
import Icon from "@/components/brand/Icon";

const TRUST_BADGES: { icon: "shield" | "clock" | "users"; title: string; desc: string }[] = [
  { icon: "shield", title: "آمن وموثوق", desc: "حماية كاملة لبياناتك" },
  { icon: "clock", title: "توفير الوقت", desc: "إدارة امتحاناتك بسهولة" },
  { icon: "users", title: "دعم مستمر", desc: "فريق دعم لمساعدتك دائماً" },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Top utility bar */}
      <div className="brand-header-gradient">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4 text-sm text-white/90">
            <span className="flex items-center gap-1.5">
              <Icon name="globe" size={16} />
              العربية
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="headset" size={16} />
              تواصل معنا
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-white">الموقع الرسمي</p>
              <p className="text-xs text-white/80">
                التابع لمنظمة رياض النجاح للتنمية المستدامة
              </p>
            </div>
            <OrgLogo size={44} />
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="relative flex flex-1 flex-col items-center overflow-hidden bg-brand-page-tint px-6 py-16">
        <div className="brand-dot-grid pointer-events-none absolute right-10 top-16 hidden h-32 w-48 text-brand-blue/20 sm:block" />
        <div className="brand-ring pointer-events-none absolute -left-10 top-40 hidden h-40 w-40 border-emerald-400/40 sm:block" />

        <div className="relative w-full max-w-3xl text-center">
          <OrgLogo size={110} />
          <h1 className="mx-auto mt-6 text-3xl font-bold tracking-tight text-brand-navy-dark sm:text-4xl">
            الموقع الرسمي
          </h1>
          <p className="mt-2 text-xl font-bold text-brand-green">
            التابع لمنظمة رياض النجاح للتنمية المستدامة
          </p>
          <p className="mt-4 text-base text-slate-600">
            منصة تعليمية تابعة للمنظمة لخدمة المتدربين والكوادر التعليمية.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <Link
              href="/exam/join"
              className="group flex flex-col items-center gap-3 rounded-2xl bg-white p-8 shadow-sm transition hover:shadow-md"
            >
              <span className="text-4xl">🎓</span>
              <span className="text-xl font-bold text-slate-900">أنا طالب</span>
              <span className="text-sm text-slate-500">الدخول إلى الامتحان عبر الجدول</span>
              <span className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-brand-blue py-3 text-sm font-semibold text-white transition group-hover:bg-brand-navy">
                دخول الطالب ‹
              </span>
            </Link>

            <Link
              href="/teacher/login"
              className="group flex flex-col items-center gap-3 rounded-2xl bg-white p-8 shadow-sm transition hover:shadow-md"
            >
              <span className="text-4xl">🧑‍🏫</span>
              <span className="text-xl font-bold text-slate-900">أنا أستاذ</span>
              <span className="text-sm text-slate-500">إدارة المحتوى والأسئلة والنتائج</span>
              <span className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-brand-green py-3 text-sm font-semibold text-white transition group-hover:bg-brand-green-dark">
                دخول الأستاذ ‹
              </span>
            </Link>
          </div>

          <div className="mt-8 flex flex-col gap-4 rounded-2xl bg-white px-6 py-5 shadow-sm sm:flex-row sm:justify-around">
            {TRUST_BADGES.map((b) => (
              <div key={b.title} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-panel text-brand-blue">
                  <Icon name={b.icon} size={20} />
                </span>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{b.title}</p>
                  <p className="text-xs text-slate-500">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        جميع الحقوق محفوظة © {new Date().getFullYear()} منظمة رياض النجاح للتنمية المستدامة
      </div>
    </div>
  );
}
