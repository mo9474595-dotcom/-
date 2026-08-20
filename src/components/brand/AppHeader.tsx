import type { ReactNode } from "react";
import OrgLogo from "./OrgLogo";

export default function AppHeader({
  title,
  icon,
}: {
  title: string;
  icon?: ReactNode;
}) {
  return (
    <header className="brand-header-gradient relative overflow-hidden">
      <div className="brand-dot-grid pointer-events-none absolute -top-2 left-4 h-20 w-32 text-white/20 sm:block" />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-10"
        preserveAspectRatio="none"
        viewBox="0 0 400 100"
      >
        <path d="M0 60 Q100 20 200 55 T400 40" stroke="white" strokeWidth="2" fill="none" />
      </svg>
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Not an <h1> — each page keeps its own single real heading in
              its content area; this is a decorative header label. */}
          <p className="text-lg font-bold text-white sm:text-xl">{title}</p>
          {icon ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
              {icon}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold text-white">منظمة رياض النجاح</p>
            <p className="text-xs text-white/80">للتنمية المستدامة</p>
          </div>
          <OrgLogo size={44} />
        </div>
      </div>
    </header>
  );
}
