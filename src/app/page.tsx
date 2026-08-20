import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-3xl text-center">
        <span className="inline-block rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-700">
          نظام امتحانات إلكترونية آمن
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          امتحانات أونلاين محمية من الغش
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          قفل شاشة كامل، رصد الخروج من الصفحة، منع النسخ واللصق، عشوائية الأسئلة
          والخيارات، وتوقيت يُفرض من الخادم لا يمكن التلاعب به.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <Link
            href="/exam/join"
            className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <span className="text-3xl">🎓</span>
            <span className="text-xl font-semibold text-slate-900">
              أنا طالب
            </span>
            <span className="text-sm text-slate-500">
              الدخول إلى الامتحان برمز الدخول
            </span>
          </Link>

          <Link
            href="/teacher/login"
            className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-blue-300 hover:shadow-md"
          >
            <span className="text-3xl">🧑‍🏫</span>
            <span className="text-xl font-semibold text-slate-900">
              أنا أستاذ
            </span>
            <span className="text-sm text-slate-500">
              إدارة الامتحانات والأسئلة والنتائج
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
