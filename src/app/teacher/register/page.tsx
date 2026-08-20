import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function TeacherRegisterPage() {
  return (
    <AuthForm
      title="إنشاء حساب أستاذ"
      subtitle="أنشئ حساباً لإدارة امتحاناتك وطلابك"
      endpoint="/api/teacher/register"
      redirectTo="/teacher/dashboard"
      submitLabel="إنشاء الحساب"
      fields={[
        { name: "name", label: "الاسم الكامل", type: "text", autoComplete: "name" },
        { name: "email", label: "البريد الإلكتروني", type: "email", autoComplete: "email" },
        {
          name: "password",
          label: "كلمة المرور (8 أحرف على الأقل)",
          type: "password",
          autoComplete: "new-password",
          minLength: 8,
        },
      ]}
      footer={
        <>
          لديك حساب بالفعل؟{" "}
          <Link href="/teacher/login" className="font-medium text-blue-600 hover:underline">
            تسجيل الدخول
          </Link>
        </>
      }
    />
  );
}
