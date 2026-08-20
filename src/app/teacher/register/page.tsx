import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import Icon from "@/components/brand/Icon";

export default function TeacherRegisterPage() {
  return (
    <AuthForm
      title="إنشاء حساب أستاذ"
      subtitle="أنشئ حساباً لإدارة امتحاناتك وطلابك"
      endpoint="/api/teacher/register"
      redirectTo="/teacher/dashboard"
      submitLabel="إنشاء الحساب"
      formIcon={<Icon name="userPlus" size={24} />}
      fields={[
        { name: "name", label: "الاسم الكامل", type: "text", autoComplete: "name", icon: <Icon name="user" size={17} /> },
        { name: "email", label: "البريد الإلكتروني", type: "email", autoComplete: "email", icon: <Icon name="mail" size={17} /> },
        {
          name: "password",
          label: "كلمة المرور (8 أحرف على الأقل)",
          type: "password",
          autoComplete: "new-password",
          minLength: 8,
          icon: <Icon name="lock" size={17} />,
        },
      ]}
      footer={
        <>
          لديك حساب بالفعل؟{" "}
          <Link href="/teacher/login" className="font-medium text-brand-blue hover:underline">
            تسجيل الدخول
          </Link>
        </>
      }
    />
  );
}
