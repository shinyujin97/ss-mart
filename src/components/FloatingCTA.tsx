"use client";

import { usePathname } from "next/navigation";

export default function FloatingCTA() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {/* 카카오 채널 */}
      <a
        href="https://pf.kakao.com/_ssmart"
        target="_blank"
        rel="noreferrer"
        aria-label="카카오톡 문의"
        className="w-14 h-14 bg-[#FEE500] flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#3C1E1E">
          <path d="M12 3C6.477 3 2 6.582 2 11c0 2.731 1.615 5.147 4.075 6.633L5.14 21l4.28-2.304C10.155 18.879 11.064 19 12 19c5.523 0 10-3.582 10-8s-4.477-8-10-8z"/>
        </svg>
      </a>

      {/* 전화 */}
      <a
        href="tel:031-430-0497"
        aria-label="전화 문의 031-430-0497"
        className="w-14 h-14 bg-[var(--red)] flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
          <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C9.61 21 3 14.39 3 6a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z"/>
        </svg>
      </a>
    </div>
  );
}
