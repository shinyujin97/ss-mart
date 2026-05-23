"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  counts: {
    orders: number;
    coupons: number;
    wishlist: number;
    embroidery: number;
    embroideryRequests: number;
    points: number;
  };
}

const MENU_GROUPS = [
  {
    label: "MY ORDER",
    items: [
      { num: "/01", href: "/mypage",        label: "대시보드",          exact: true },
      { num: "/02", href: "/mypage/orders", label: "주문 / 배송 조회", countKey: "orders" },
    ],
  },
  {
    label: "EMBROIDERY",
    items: [
      { num: "/03", href: "/mypage/embroidery",          label: "자수 시안 보관함", countKey: "embroidery" },
      { num: "/04", href: "/mypage/embroidery/requests", label: "자수 신청현황",    countKey: "embroideryRequests" },
    ],
  },
  {
    label: "REWARDS",
    items: [
      { num: "/05", href: "/mypage/points",   label: "적립금 내역", countKey: "points", unit: "P" },
      { num: "/06", href: "/mypage/coupons",  label: "쿠폰함",      countKey: "coupons", unit: "장" },
      { num: "/07", href: "/mypage/wishlist", label: "위시리스트",  countKey: "wishlist" },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { num: "/08", href: "/mypage/profile",   label: "회원 정보 수정" },
      { num: "/09", href: "/mypage/addresses", label: "배송지 관리" },
    ],
  },
] as const;

export default function MypageSidebar({ counts }: Props) {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  function getCount(countKey?: string, unit?: string) {
    if (!countKey) return null;
    const val = counts[countKey as keyof typeof counts];
    if (val === undefined) return null;
    return `${val.toLocaleString()}${unit ?? ""}`;
  }

  return (
    <aside className="sticky top-6">
      {MENU_GROUPS.map((group) => (
        <div key={group.label} className="border border-[var(--line)] bg-white mb-2">
          <div className="bg-[var(--black)] text-white px-4 py-3 font-[var(--font-mono)] text-[10px] tracking-[1.5px] font-semibold flex items-center gap-2">
            <span className="text-[var(--yellow)]">▣</span>
            {group.label}
          </div>
          {group.items.map((item) => {
            const active = isActive(item.href, "exact" in item ? item.exact : false);
            const count = "countKey" in item ? getCount(item.countKey, "unit" in item ? item.unit : undefined) : null;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 text-[13px] border-b border-[var(--line)] last:border-b-0 transition-all ${
                  active
                    ? "bg-[var(--gray-50)] text-[var(--red)] font-bold border-l-[3px] border-l-[var(--red)] pl-[13px]"
                    : "hover:bg-[var(--gray-50)] hover:pl-[22px] hover:text-[var(--red)]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`font-[var(--font-mono)] text-[9px] tracking-[0.3px] ${active ? "text-[var(--red)]" : "text-[var(--gray-300)]"}`}>
                    {item.num}
                  </span>
                  {item.label}
                </span>
                {count && (
                  <span className={`font-[var(--font-mono)] text-[11px] ${active ? "text-[var(--red)] font-bold" : "text-[var(--gray-500)]"}`}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
