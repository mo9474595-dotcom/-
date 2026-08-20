import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function TeacherLoginPage() {
  return (
    <AuthForm
      title="تسجيل دخول الأستاذ"
      subtitle="ادخل إلى لوحة التحكم لإدارة امتحاناتك"
      endpoint="/api/teacher/login"
      redirectTo="/teacher/dashboard"
      submitLabel="دخول"
      fields={[
        { name: "email", label: "البريد الإلكتروني", type: "email", autoComplete: "email" },
        { name: "password", label: "كلمة المرور", type: "password", autoComplete: "current-password" },
      ]}
      footer={
        <>
          لا تملك حساباً؟{" "}
          <Link href="/teacher/register" className="font-medium text-blue-600 hover:underline">
            إنشاء حساب جديد
          </Link>
        </>
      }
    />
  );
}
