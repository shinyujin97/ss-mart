"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import SearchBar from "./SearchBar";

interface Category {
  slug: string;
  name: string;
  _count: { products: number };
  children: { slug: string; name: string; _count: { products: number } }[];
}

interface NavLink {
  href: string;
  label: string;
}

export default function MobileMenu({
  navLinks,
  categories,
}: {
  navLinks: NavLink[];
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 라우트 변경 시 자동 닫기
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 드로어 열렸을 때 body 스크롤 잠금
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <div className="md:hidden">
      {/* 모바일 바: 햄버거 + 라벨 */}
      <div className="max-w-[1340px] mx-auto px-4 flex items-center h-[52px]">
        <button
          onClick={() => setOpen(true)}
          aria-label="메뉴 열기"
          className="flex items-center gap-2.5 text-white font-bold text-[13px] tracking-[0.3px] h-full -ml-1 px-1"
        >
          <span className="flex flex-col justify-center gap-[5px] w-6">
            <span className="block h-[2px] w-6 bg-white" />
            <span className="block h-[2px] w-6 bg-white" />
            <span className="block h-[2px] w-6 bg-white" />
          </span>
          <span>MENU</span>
        </button>

        <Link
          href="/search"
          aria-label="검색"
          className="ml-auto flex items-center justify-center w-9 h-9 text-white"
        >
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </Link>

        <a
          href="tel:031-430-0497"
          className="ml-3 flex items-center gap-2 text-white h-full"
        >
          <span className="font-[var(--font-mono)] text-[9px] text-white/50 tracking-[1.5px]">
            문의
          </span>
          <span className="font-[var(--font-display)] text-[var(--yellow)] text-[17px] leading-none tracking-wide">
            031-430-0497
          </span>
        </a>
      </div>

      {/* 오버레이 + 드로어 */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="fixed top-0 left-0 bottom-0 z-[70] w-[86%] max-w-[360px] bg-white flex flex-col shadow-2xl">
            {/* 드로어 헤더 */}
            <div className="flex items-center justify-between bg-[var(--black)] px-4 h-[56px] flex-shrink-0">
              <span className="font-[var(--font-mono)] text-[10px] text-[var(--yellow)] tracking-[2px] font-semibold">
                ▣ ALL MENU
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="메뉴 닫기"
                className="text-white text-2xl leading-none w-9 h-9 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto">
              {/* 검색 */}
              <div className="p-4 border-b border-[var(--line)]">
                <SearchBar />
              </div>

              {/* 메인 네비 */}
              <nav className="border-b border-[var(--line)]">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center px-4 py-3.5 text-[14px] font-bold text-[var(--black)] hover:bg-[var(--gray-50)] hover:text-[var(--red)] transition-colors border-b border-[var(--line)] last:border-b-0"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* 카테고리 */}
              <div className="py-2">
                <div className="px-4 py-2 font-[var(--font-mono)] text-[10px] text-[var(--gray-400)] tracking-[2px]">
                  ▶ CATEGORIES
                </div>
                {categories.map((cat) => (
                  <div key={cat.slug} className="border-b border-[var(--line)] last:border-b-0">
                    <Link
                      href={`/categories/${cat.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-1.5 px-4 py-3 text-[14px] font-black text-[var(--black)] hover:text-[var(--red)] transition-colors"
                    >
                      <span className="font-[var(--font-mono)] text-[9px] text-[var(--red)] font-bold flex-shrink-0">
                        ▶
                      </span>
                      {cat.name}
                    </Link>
                    {cat.children.length > 0 && (
                      <div className="pb-2">
                        {cat.children.map((child) => (
                          <Link
                            key={child.slug}
                            href={`/categories/${child.slug}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-1.5 pl-9 pr-4 py-2 text-[13px] text-[var(--gray-600)] hover:text-[var(--red)] transition-colors"
                          >
                            <span className="w-1 h-1 bg-[var(--gray-300)] flex-shrink-0 rounded-full" />
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 퀵링크 */}
              <div className="bg-[var(--gray-50)] border-t border-[var(--line)] px-4 py-4">
                <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-400)] tracking-[1px] mb-2">
                  QUICK LINK
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { href: "/embroidery", label: "자수/마킹 서비스" },
                    { href: "/bulk-order", label: "단체주문 견적" },
                    { href: "/brands", label: "브랜드관" },
                    { href: "/embroidery/gallery", label: "자수 갤러리" },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="text-[13px] text-[var(--gray-600)] hover:text-[var(--red)] transition-colors font-medium"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
