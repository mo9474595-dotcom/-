"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/brand/Icon";

const ITEMS: { href: string; label: string; icon: "clipboard" | "users" | "clockHistory" | "trash" | "folder" }[] = [
  { href: "/teacher/dashboard", label: "الامتحانات", icon: "clipboard" },
  { href: "/teacher/classes", label: "الشعب والطلاب", icon: "users" },
  { href: "/teacher/question-bank", label: "بنك الأسئلة", icon: "folder" },
  { href: "/teacher/audit-log", label: "سجل التعديلات", icon: "clockHistory" },
  { href: "/teacher/trash", label: "سلة المحذوفات", icon: "trash" },
];

export default function TeacherNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-3 flex items-center gap-6 overflow-x-auto whitespace-nowrap border-t border-slate-100 pt-3">
      {ITEMS.map((item) => {
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
      <a
        href="/api/teacher/export"
        className="flex items-center gap-1.5 border-b-2 border-transparent pb-2 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <Icon name="cloud" size={16} />
        نسخة احتياطية
      </a>
    </nav>
  );
}
