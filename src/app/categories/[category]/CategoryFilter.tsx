"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Brand {
  slug: string;
  name: string;
}

interface Props {
  brands: Brand[];
  currentBrands: string[];
}

const PRICE_RANGES = [
  { label: "~3만원", max: 30000 },
  { label: "3~5만원", min: 30000, max: 50000 },
  { label: "5~10만원", min: 50000, max: 100000 },
  { label: "10만원~", min: 100000 },
];

export default function CategoryFilter({ brands, currentBrands }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const toggleBrand = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.getAll("brand");
      params.delete("brand");
      if (current.includes(slug)) {
        current.filter((b) => b !== slug).forEach((b) => params.append("brand", b));
      } else {
        [...current, slug].forEach((b) => params.append("brand", b));
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const resetAll = () => router.push(pathname);

  const hasFilters = currentBrands.length > 0 || searchParams.has("minPrice") || searchParams.has("maxPrice");

  return (
    <aside className="sticky top-6">
      {/* 필터 헤더 */}
      <div className="bg-[var(--black)] text-white px-[18px] py-3.5 flex items-center justify-between border border-[var(--black)]">
        <span className="font-[var(--font-mono)] text-xs tracking-[1.5px] font-semibold flex items-center gap-2">
          <span className="text-[var(--yellow)]">▣</span> FILTER
        </span>
        {hasFilters && (
          <button
            onClick={resetAll}
            className="text-[11px] text-white/70 hover:text-[var(--yellow)] transition-colors"
          >
            초기화
          </button>
        )}
      </div>

      {/* 적용된 필터 */}
      {hasFilters && (
        <div className="bg-[#fff5f5] border border-[var(--line)] border-t-0 px-3.5 py-3">
          <div className="font-[var(--font-mono)] text-[9px] text-[var(--red)] tracking-[1px] mb-2 font-bold">
            APPLIED
          </div>
          <div className="flex flex-wrap gap-1">
            {currentBrands.map((b) => (
              <button
                key={b}
                onClick={() => toggleBrand(b)}
                className="border border-[var(--red)] text-[var(--red)] text-[11px] px-2 py-1 flex items-center gap-1 hover:bg-[var(--red)] hover:text-white transition-colors"
              >
                {b} <span className="font-bold">×</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 브랜드 필터 */}
      <div className="bg-white border border-[var(--line)] border-t-0">
        <div className="px-4 py-3 border-b border-[var(--line)] flex items-center justify-between">
          <span className="text-[13px] font-bold flex items-center gap-2">
            <span className="font-[var(--font-mono)] text-[9px] text-[var(--red)]">01</span>
            브랜드
          </span>
          <span className="font-[var(--font-mono)] text-xs text-[var(--gray-500)]">▼</span>
        </div>
        <div className="px-4 pb-3.5 max-h-[240px] overflow-y-auto">
          <input
            type="text"
            placeholder="브랜드 검색"
            className="w-full px-2.5 py-1.5 border border-[var(--line)] text-xs outline-none mt-3 mb-2 focus:border-[var(--black)]"
          />
          {brands.map((b) => (
            <label
              key={b.slug}
              className={`flex items-center gap-2 py-1.5 cursor-pointer text-xs transition-colors ${
                currentBrands.includes(b.slug)
                  ? "text-[var(--red)]"
                  : "hover:text-[var(--red)]"
              }`}
            >
              <span
                onClick={() => toggleBrand(b.slug)}
                className={`w-3.5 h-3.5 border flex items-center justify-center flex-shrink-0 ${
                  currentBrands.includes(b.slug)
                    ? "bg-[var(--red)] border-[var(--red)] text-white text-[8px]"
                    : "border-[var(--gray-300)]"
                }`}
              >
                {currentBrands.includes(b.slug) && "✓"}
              </span>
              <span className="flex-1">{b.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 가격 필터 */}
      <div className="bg-white border border-[var(--line)] border-t-0">
        <div className="px-4 py-3 border-b border-[var(--line)] flex items-center justify-between">
          <span className="text-[13px] font-bold flex items-center gap-2">
            <span className="font-[var(--font-mono)] text-[9px] text-[var(--red)]">02</span>
            가격
          </span>
          <span className="font-[var(--font-mono)] text-xs text-[var(--gray-500)]">▼</span>
        </div>
        <div className="px-4 py-3.5">
          <div className="grid grid-cols-2 gap-1.5">
            {PRICE_RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => {
                  updateParam("minPrice", r.min ? String(r.min) : null);
                  updateParam("maxPrice", r.max ? String(r.max) : null);
                }}
                className="text-xs py-2 border border-[var(--line)] hover:border-[var(--black)] hover:bg-[var(--gray-50)] transition-colors"
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
