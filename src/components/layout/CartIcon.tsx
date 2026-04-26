"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";

export default function CartIcon() {
  const count = useCartStore((s) => s.totalCount());
  return (
    <Link
      href="/cart"
      className="px-[18px] py-[10px] text-xs font-medium text-[var(--gray-700)] hover:text-[var(--red)] transition-colors flex items-center gap-1.5 border-l border-[var(--line)]"
    >
      장바구니{" "}
      {count > 0 && (
        <span className="text-[var(--red)] font-bold font-[var(--font-display)] text-sm">
          {String(count).padStart(2, "0")}
        </span>
      )}
    </Link>
  );
}
