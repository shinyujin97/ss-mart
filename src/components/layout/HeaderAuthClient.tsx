"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { useCartStore } from "@/lib/cartStore";

export default function HeaderAuthClient({ name, isAdmin }: { name: string; isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative border-l border-[var(--line)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-[18px] py-[10px] text-xs font-medium text-[var(--gray-700)] hover:text-[var(--red)] transition-colors flex items-center gap-1.5"
      >
        <span className="text-[var(--red)] font-bold">{name}</span>님
        <span className="text-[var(--gray-400)] text-[10px]">▾</span>
      </button>

      {open && (
        <>
          {/* 배경 클릭 닫기 */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-px w-[160px] bg-white border border-[var(--line)] shadow-lg z-50">
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-[var(--red)] hover:bg-[var(--red)] hover:text-white transition-colors border-b border-[var(--line)]"
              >
                ▣ 관리자 페이지
              </Link>
            )}
            <Link
              href="/mypage"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-xs font-medium hover:bg-[var(--gray-50)] hover:text-[var(--red)] transition-colors border-b border-[var(--line)]"
            >
              마이페이지
            </Link>
            <Link
              href="/mypage/orders"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-xs font-medium hover:bg-[var(--gray-50)] hover:text-[var(--red)] transition-colors border-b border-[var(--line)]"
            >
              주문 내역
            </Link>
            {!isAdmin && (
              <Link
                href="/mypage/embroidery"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium hover:bg-[var(--gray-50)] hover:text-[var(--red)] transition-colors border-b border-[var(--line)]"
              >
                자수 시안 보관함
              </Link>
            )}
            <button
              onClick={() => {
                useCartStore.getState().clearCart();
                signOut({ callbackUrl: "/login" });
              }}
              className="w-full text-left flex items-center gap-2 px-4 py-3 text-xs font-medium text-[var(--gray-500)] hover:bg-[var(--gray-50)] hover:text-[var(--red)] transition-colors"
            >
              로그아웃
            </button>
          </div>
        </>
      )}
    </div>
  );
}
