"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, string> = {
  ADMIN_NEW_REQUEST:      "▣",
  ADMIN_NEW_ORDER:        "◈",
  USER_EMBROIDERY_STATUS: "◆",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default function NotificationBell({ initialCount }: { initialCount: number }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialCount);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=1", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUnread(data.unreadCount);
      }
    } catch {}
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=20", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnread(data.unreadCount);
      }
    } catch {}
    setLoading(false);
  }, []);

  // 마운트 시 즉시 + 10초마다 미읽음 수 갱신
  useEffect(() => {
    fetchCount();
    intervalRef.current = setInterval(fetchCount, 10000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchCount]);

  // 드롭다운 열릴 때 목록 로드
  useEffect(() => {
    if (open) fetchList();
  }, [open, fetchList]);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  };

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnread((c) => Math.max(0, c - 1));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-9 h-9 hover:bg-[var(--gray-100)] transition-colors"
        aria-label="알림"
      >
        {/* Bell SVG */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--gray-700)]">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] bg-[var(--red)] text-white text-[9px] font-bold font-[var(--font-mono)] rounded-full flex items-center justify-center px-[3px] leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-px w-[320px] bg-white border border-[var(--line)] shadow-xl z-50">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)] bg-[var(--black)]">
              <div className="font-[var(--font-mono)] text-[10px] text-white tracking-[1.5px] font-bold">
                NOTIFICATIONS {unread > 0 && <span className="text-[var(--yellow)]">({unread})</span>}
              </div>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="font-[var(--font-mono)] text-[9px] text-[#aaa] hover:text-white transition-colors"
                >
                  모두 읽음
                </button>
              )}
            </div>

            {/* 목록 */}
            <div className="max-h-[360px] overflow-y-auto">
              {loading ? (
                <div className="py-10 text-center font-[var(--font-mono)] text-[11px] text-[var(--gray-400)]">
                  로딩 중...
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="font-[var(--font-display)] text-[32px] text-[var(--gray-100)] leading-none mb-2">EMPTY</div>
                  <p className="text-xs text-[var(--gray-400)]">알림이 없습니다.</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const inner = (
                    <div
                      className={`flex gap-3 px-4 py-3 border-b border-[var(--line)] last:border-b-0 cursor-pointer transition-colors ${
                        n.isRead ? "bg-white hover:bg-[var(--gray-50)]" : "bg-[#fffbf0] hover:bg-[#fff8e0]"
                      }`}
                      onClick={() => !n.isRead && markRead(n.id)}
                    >
                      <span className="text-[var(--red)] font-bold text-sm flex-shrink-0 mt-0.5">
                        {TYPE_ICON[n.type] ?? "◆"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[12px] font-bold truncate ${n.isRead ? "text-[var(--gray-700)]" : "text-[var(--black)]"}`}>
                          {n.title}
                        </div>
                        <div className="text-[11px] text-[var(--gray-500)] mt-0.5 line-clamp-2 leading-relaxed">
                          {n.body}
                        </div>
                        <div className="font-[var(--font-mono)] text-[9px] text-[var(--gray-300)] mt-1">
                          {timeAgo(n.createdAt)}
                        </div>
                      </div>
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 bg-[var(--red)] rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  );

                  return n.link ? (
                    <Link key={n.id} href={n.link} onClick={() => { setOpen(false); if (!n.isRead) markRead(n.id); }}>
                      {inner}
                    </Link>
                  ) : (
                    <div key={n.id}>{inner}</div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
