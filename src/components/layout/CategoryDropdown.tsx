"use client";

import Link from "next/link";
import { useState } from "react";

interface Category {
  slug: string;
  name: string;
  _count: { products: number };
  children: { slug: string; name: string; _count: { products: number } }[];
}

export default function CategoryDropdown({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative h-full"
      onMouseLeave={() => setOpen(false)}
    >
      {/* 버튼 */}
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
        <div
          className="absolute top-full left-0 z-50 bg-white border border-[var(--line)] shadow-2xl"
          style={{ width: 1200 }}
        >
          {/* 헤더 */}
          <div className="bg-[var(--black)] px-6 py-2.5 flex items-center justify-between">
            <span className="font-[var(--font-mono)] text-[10px] text-[var(--yellow)] tracking-[2px] font-semibold">
              ▣ ALL CATEGORIES
            </span>
            <span className="font-[var(--font-mono)] text-[10px] text-white/40">
              {categories.length}개 카테고리
            </span>
          </div>

          {/* 메가메뉴 — 가로 그리드 */}
          <div
            className="grid divide-x divide-[var(--line)]"
            style={{ gridTemplateColumns: `repeat(${Math.min(categories.length, 5)}, 1fr)` }}
          >
            {categories.map((cat) => (
              <div key={cat.slug} className="py-4 min-w-0">
                {/* 대분류 헤더 */}
                <Link
                  href={`/categories/${cat.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-1.5 px-4 pb-2 mb-2 border-b border-[var(--line)] group"
                >
                  <span className="font-[var(--font-mono)] text-[9px] text-[var(--red)] font-bold flex-shrink-0">▶</span>
                  <span className="text-[15px] font-black text-[var(--black)] group-hover:text-[var(--red)] transition-colors truncate">
                    {cat.name}
                  </span>
                </Link>

                {/* 소분류 */}
                <div className="px-4 space-y-0">
                  {cat.children.map((child) => (
                    <Link
                      key={child.slug}
                      href={`/categories/${child.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-1.5 py-1.5 text-[13px] text-[var(--gray-600)] hover:text-[var(--red)] transition-colors group"
                    >
                      <span className="w-1 h-1 bg-[var(--gray-300)] group-hover:bg-[var(--red)] transition-colors flex-shrink-0 rounded-full" />
                      <span className="truncate">{child.name}</span>
                    </Link>
                  ))}
                  {cat.children.length === 0 && (
                    <Link
                      href={`/categories/${cat.slug}`}
                      onClick={() => setOpen(false)}
                      className="text-[11px] text-[var(--gray-400)] hover:text-[var(--red)] transition-colors"
                    >
                      전체 보기 →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 하단 퀵링크 */}
          <div className="border-t border-[var(--line)] px-6 py-2.5 flex items-center gap-6 bg-[var(--gray-50)]">
            <span className="font-[var(--font-mono)] text-[10px] text-[var(--gray-400)] tracking-[1px]">QUICK LINK</span>
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
      )}
    </div>
  );
}
