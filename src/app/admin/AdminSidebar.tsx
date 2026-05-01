"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = [
  { group: "OVERVIEW", items: [
    { href: "/admin", label: "대시보드", icon: "◈", exact: true },
  ]},
  { group: "CATALOG", items: [
    { href: "/admin/products", label: "상품 관리", icon: "▣" },
    { href: "/admin/members", label: "회원 관리", icon: "◎" },
  ]},
  { group: "OPERATIONS", items: [
    { href: "/admin/orders", label: "주문 관리", icon: "▷" },
    { href: "/admin/embroidery", label: "자수 시안 관리", icon: "✦" },
    { href: "/admin/bulk-orders", label: "단체주문 견적", icon: "◆" },
  ]},
  { group: "MARKETING", items: [
    { href: "/admin/coupons", label: "쿠폰 관리", icon: "◇" },
    { href: "/admin/notices", label: "공지사항", icon: "◉" },
  ]},
];

export default function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <aside className="w-[220px] flex-shrink-0 bg-white border-r border-[#e5e5e5] flex flex-col shadow-sm">
      {/* 로고 */}
      <div className="px-5 py-5 border-b border-[#e5e5e5]">
        <Link href="/admin">
          <div className="font-[var(--font-display)] text-lg text-[#111] tracking-[2px]">SS MART</div>
          <div className="font-[var(--font-mono)] text-[9px] text-[#c8161d] tracking-[3px] mt-0.5">ADMIN PANEL</div>
        </Link>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {MENU.map((group) => (
          <div key={group.group} className="mb-5">
            <div className="font-[var(--font-mono)] text-[9px] text-[#aaa] tracking-[2px] px-5 mb-2">
              {group.group}
            </div>
            {group.items.map((item) => {
              const active = isActive(item.href, "exact" in item ? item.exact : false);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-all ${
                    active
                      ? "bg-[#c8161d] text-white font-bold"
                      : "text-[#555] hover:text-[#111] hover:bg-[#f5f5f5]"
                  }`}
                >
                  <span className="text-[13px] w-4 text-center flex-shrink-0">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* 하단 */}
      <div className="px-5 py-4 border-t border-[#e5e5e5]">
        <Link href="/" className="text-[11px] text-[#aaa] hover:text-[#c8161d] transition-colors font-[var(--font-mono)] flex items-center gap-2">
          ← 쇼핑몰로 돌아가기
        </Link>
      </div>
    </aside>
  );
}
