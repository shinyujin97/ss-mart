"use client";

import Link from "next/link";
import { useState } from "react";

interface Category {
  slug: string;
  name: string;
  children: { slug: string; name: string }[];
}

export default function CategoryDropdown({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);

  return (
    // 버튼 + 드롭다운을 하나의 wrapper로 묶어 영역 이탈 시에만 닫힘
    <div
      className="relative h-full"
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        className="bg-[var(--red)] text-white px-6 font-bold flex items-center gap-3 text-[13px] min-w-[200px] tracking-[0.3px] hover:bg-[var(--red-dark)] transition-colors h-full w-full"
      >
        <span>▣</span>
        ALL CATEGORIES
        <span className="ml-auto text-[11px] opacity-70">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <>
          {/* 드롭다운 외부 클릭 닫기 (배경) */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* 드롭다운 패널 — z-50으로 배경 위에 */}
          <div
            className="absolute top-full left-0 z-50 bg-white border border-[var(--line)] shadow-2xl"
            style={{ width: 680 }}
          >
            {/* 헤더 */}
            <div className="bg-[var(--black)] px-5 py-3 flex items-center justify-between">
              <span className="font-[var(--font-mono)] text-[10px] text-[var(--yellow)] tracking-[2px] font-semibold">
                ▣ ALL CATEGORIES
              </span>
              <span className="font-[var(--font-mono)] text-[10px] text-white/40">{categories.length}개 카테고리</span>
            </div>

            {/* 카테고리 그리드 */}
            <div className="grid grid-cols-3 gap-0 divide-x divide-[var(--line)]">
              {categories.map((cat) => (
                <div key={cat.slug} className="py-4">
                  {/* 대분류 */}
                  <Link
                    href={`/categories/${cat.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-5 pb-2 mb-2 border-b border-[var(--line)] group"
                  >
                    <span className="font-[var(--font-mono)] text-[9px] text-[var(--red)] font-bold">▶</span>
                    <span className="text-sm font-black text-[var(--black)] group-hover:text-[var(--red)] transition-colors">
                      {cat.name}
                    </span>
                  </Link>

                  {/* 소분류 */}
                  <div className="px-5 space-y-0.5">
                    {cat.children.map((child) => (
                      <Link
                        key={child.slug}
                        href={`/categories/${child.slug}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 py-1.5 text-xs text-[var(--gray-700)] hover:text-[var(--red)] transition-colors group"
                      >
                        <span className="w-1 h-1 bg-[var(--gray-300)] group-hover:bg-[var(--red)] transition-colors flex-shrink-0" />
                        {child.name}
                      </Link>
                    ))}

                    {cat.children.length === 0 && (
                      <Link
                        href={`/categories/${cat.slug}`}
                        onClick={() => setOpen(false)}
                        className="text-xs text-[var(--gray-500)] hover:text-[var(--red)] transition-colors"
                      >
                        전체 보기 →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 하단 빠른 링크 */}
            <div className="border-t border-[var(--line)] px-5 py-3 flex items-center gap-4 bg-[var(--gray-50)]">
              <span className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] tracking-[1px]">QUICK LINK</span>
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
                  className="text-xs text-[var(--gray-600)] hover:text-[var(--red)] transition-colors font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
