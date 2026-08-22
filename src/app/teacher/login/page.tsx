import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import Icon from "@/components/brand/Icon";

export default function TeacherLoginPage() {
  return (
    <AuthForm
      title="تسجيل دخول الأستاذ"
      subtitle="ادخل إلى لوحة التحكم لإدارة امتحاناتك"
      endpoint="/api/teacher/login"
      redirectTo="/teacher/dashboard"
      submitLabel="دخول"
      formIcon={<Icon name="lock" size={24} />}
      fields={[
        { name: "email", label: "البريد الإلكتروني", type: "email", autoComplete: "email", icon: <Icon name="mail" size={17} /> },
        { name: "password", label: "كلمة المرور", type: "password", autoComplete: "current-password", icon: <Icon name="lock" size={17} /> },
      ]}
      footer={
        <>
          <p>
            لا تملك حساباً؟{" "}
            <Link href="/teacher/register" className="font-medium text-brand-blue hover:underline">
              إنشاء حساب جديد
            </Link>
          </p>
          <p className="mt-1">
            <Link href="/teacher/forgot-password" className="font-medium text-brand-blue hover:underline">
              نسيت كلمة المرور؟
            </Link>
          </p>
        </>
      }
    />
  );
}
