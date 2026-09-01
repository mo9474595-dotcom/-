"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/brand/Icon";

type IconName =
  | "clipboard"
  | "users"
  | "clockHistory"
  | "trash"
  | "folder"
  | "scale"
  | "shield"
  | "calendarCheck"
  | "userPlus";

const ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/teacher/dashboard", label: "الامتحانات", icon: "clipboard" },
  { href: "/teacher/classes", label: "الشعب والطلاب", icon: "users" },
  { href: "/teacher/calendar", label: "التقويم", icon: "calendarCheck" },
  { href: "/teacher/question-bank", label: "بنك الأسئلة", icon: "folder" },
  { href: "/teacher/statistics", label: "الإحصائيات", icon: "scale" },
  { href: "/teacher/assistants", label: "المساعدون", icon: "userPlus" },
  { href: "/teacher/audit-log", label: "سجل التعديلات", icon: "clockHistory" },
  { href: "/teacher/trash", label: "سلة المحذوفات", icon: "trash" },
];

const ADMIN_ITEM: { href: string; label: string; icon: IconName } = {
  href: "/teacher/admin",
  label: "إدارة الأساتذة",
  icon: "shield",
};

export default function TeacherNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...ITEMS, ADMIN_ITEM] : ITEMS;

  return (
    <nav className="mt-3 flex items-center gap-6 overflow-x-auto whitespace-nowrap border-t border-slate-100 pt-3">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 border-b-2 pb-2 text-sm font-medium transition ${
              active
                ? "border-brand-blue text-brand-navy-dark"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon name={item.icon} size={16} />
            {item.label}
          </Link>
        );
      })}
      <Link
        href="/teacher/backups"
        className={`flex items-center gap-1.5 border-b-2 pb-2 text-sm font-medium transition ${
          pathname.startsWith("/teacher/backups")
            ? "border-brand-blue text-brand-navy-dark"
            : "border-transparent text-slate-500 hover:text-slate-700"
        }`}
      >
        <Icon name="cloud" size={16} />
        النسخ الاحتياطية
      </Link>
    </nav>
  );
}
