"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/brand/Icon";

type NotificationItem = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

const POLL_INTERVAL_MS = 25_000;

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `قبل ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${hours} س`;
  const days = Math.floor(hours / 24);
  return `قبل ${days} يوم`;
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  function refresh() {
    fetch("/api/teacher/notifications")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setItems(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      })
      .catch(() => {});
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleItemClick(item: NotificationItem) {
    setOpen(false);
    if (!item.read) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      fetch(`/api/teacher/notifications/${item.id}`, { method: "PATCH" }).catch(() => {});
    }
    if (item.link) router.push(item.link);
  }

  async function handleMarkAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await fetch("/api/teacher/notifications/mark-all-read", { method: "POST" }).catch(() => {});
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
        aria-label="الإشعارات"
      >
        <Icon name="bell" size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -left-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-20 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="text-sm font-semibold text-slate-800">الإشعارات</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-brand-blue hover:underline"
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-slate-500">لا توجد إشعارات بعد.</p>
            )}
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`flex w-full flex-col items-start gap-0.5 rounded-xl px-2.5 py-2 text-right text-sm transition hover:bg-slate-50 ${
                  item.read ? "text-slate-600" : "bg-brand-panel/40 font-medium text-slate-900"
                }`}
              >
                <span>{item.message}</span>
                <span className="text-xs text-slate-400">{timeAgo(item.createdAt)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
