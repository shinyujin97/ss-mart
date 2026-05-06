"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

interface Brand { slug: string; name: string; }

interface Props {
  brands: Brand[];
  currentBrands: string[];
  sizes: string[];
  currentSizes: string[];
  certs: string[];
  currentCerts: string[];
  seasons: string[];
  currentSeasons: string[];
}

const CERT_LABELS: Record<string, string> = {
  KCS: "KCs 인증",
  KS: "KS 인증",
  FLAME_RETARDANT: "방염",
  ANTI_STATIC: "정전기방지",
  KF94: "KF94",
  KF80: "KF80",
  OTHER: "기타인증",
};

const SEASON_LABELS: Record<string, string> = {
  ALL_SEASON: "사계절",
  SPRING_FALL: "춘추",
  SUMMER: "하절기",
  WINTER: "동절기",
};

const CLOTHING_ORDER = ["XS","S","M","L","XL","2XL","3XL","4XL","5XL","FREE"];

function categorizeSizes(sizes: string[]) {
  const clothing: string[] = [];
  const pants: string[] = [];
  const shoes: string[] = [];

  for (const s of sizes) {
    if (/^(XS|[2-9]?XL|[SML]|FREE)$/i.test(s)) {
      clothing.push(s);
    } else {
      const n = Number(s.replace(/mm$/i, ""));
      if (!isNaN(n) && n >= 220 && n <= 320) shoes.push(s);
      else if (!isNaN(n) && n >= 26 && n <= 50) pants.push(s);
      else clothing.push(s);
    }
  }

  const sortClothing = (a: string, b: string) => {
    const ai = CLOTHING_ORDER.indexOf(a.toUpperCase());
    const bi = CLOTHING_ORDER.indexOf(b.toUpperCase());
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b, undefined, { numeric: true });
  };
  const sortNum = (a: string, b: string) => Number(a.replace(/mm$/i,"")) - Number(b.replace(/mm$/i,""));

  return {
    clothing: clothing.sort(sortClothing),
    pants: pants.sort(sortNum),
    shoes: shoes.sort(sortNum),
  };
}

function Section({ num, title, children, defaultOpen = true }: {
  num: string; title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-[var(--line)] border-t-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 border-b border-[var(--line)] flex items-center justify-between hover:bg-[var(--gray-50)] transition-colors"
      >
        <span className="text-[13px] font-bold flex items-center gap-2">
          <span className="font-[var(--font-mono)] text-[9px] text-[var(--red)]">{num}</span>
          {title}
        </span>
        <span className="font-[var(--font-mono)] text-xs text-[var(--gray-500)]">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-4 py-3.5">{children}</div>}
    </div>
  );
}

export default function CategoryFilter({
  brands, currentBrands,
  sizes, currentSizes,
  certs, currentCerts,
  seasons, currentSeasons,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [brandSearch, setBrandSearch] = useState("");

  const updateParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) params.delete(key);
    else params.set(key, value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  const toggleMulti = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll(key);
    params.delete(key);
    if (current.includes(value)) {
      current.filter((v) => v !== value).forEach((v) => params.append(key, v));
    } else {
      [...current, value].forEach((v) => params.append(key, v));
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  const resetAll = () => router.push(pathname);

  const hasFilters =
    currentBrands.length > 0 || currentCerts.length > 0 ||
    currentSeasons.length > 0 || currentSizes.length > 0;

  const filteredBrands = brandSearch
    ? brands.filter((b) => b.name.toLowerCase().includes(brandSearch.toLowerCase()))
    : brands;

  const { clothing, pants, shoes } = categorizeSizes(sizes);

  return (
    <aside>
      {/* 헤더 */}
      <div className="bg-[var(--black)] text-white px-[18px] py-3.5 flex items-center justify-between border border-[var(--black)]">
        <span className="font-[var(--font-mono)] text-xs tracking-[1.5px] font-semibold flex items-center gap-2">
          <span className="text-[var(--yellow)]">▣</span> FILTER
        </span>
        {hasFilters && (
          <button onClick={resetAll} className="text-[11px] text-white/70 hover:text-[var(--yellow)] transition-colors">
            전체 초기화
          </button>
        )}
      </div>

      {/* 적용된 필터 태그 */}
      {hasFilters && (
        <div className="bg-[#fff5f5] border border-[var(--line)] border-t-0 px-3.5 py-3">
          <div className="font-[var(--font-mono)] text-[9px] text-[var(--red)] tracking-[1px] mb-2 font-bold">APPLIED</div>
          <div className="flex flex-wrap gap-1">
            {currentBrands.map((b) => (
              <button key={b} onClick={() => toggleMulti("brand", b)}
                className="border border-[var(--red)] text-[var(--red)] text-[11px] px-2 py-0.5 flex items-center gap-1 hover:bg-[var(--red)] hover:text-white transition-colors">
                {b} <span>×</span>
              </button>
            ))}
            {currentCerts.map((c) => (
              <button key={c} onClick={() => toggleMulti("cert", c)}
                className="border border-[var(--red)] text-[var(--red)] text-[11px] px-2 py-0.5 flex items-center gap-1 hover:bg-[var(--red)] hover:text-white transition-colors">
                {CERT_LABELS[c] ?? c} <span>×</span>
              </button>
            ))}
            {currentSeasons.map((s) => (
              <button key={s} onClick={() => toggleMulti("season", s)}
                className="border border-[var(--red)] text-[var(--red)] text-[11px] px-2 py-0.5 flex items-center gap-1 hover:bg-[var(--red)] hover:text-white transition-colors">
                {SEASON_LABELS[s] ?? s} <span>×</span>
              </button>
            ))}
            {currentSizes.map((s) => (
              <button key={s} onClick={() => toggleMulti("size", s)}
                className="border border-[var(--red)] text-[var(--red)] text-[11px] px-2 py-0.5 flex items-center gap-1 hover:bg-[var(--red)] hover:text-white transition-colors">
                {s} <span>×</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 01 브랜드 */}
      <Section num="01" title="브랜드">
        <input
          type="text"
          placeholder="브랜드 검색"
          value={brandSearch}
          onChange={(e) => setBrandSearch(e.target.value)}
          className="w-full px-2.5 py-1.5 border border-[var(--line)] text-xs outline-none mb-2 focus:border-[var(--black)]"
        />
        <div className="max-h-[200px] overflow-y-auto space-y-0.5">
          {filteredBrands.map((b) => (
            <label key={b.slug}
              onClick={() => toggleMulti("brand", b.slug)}
              className={`flex items-center gap-2 py-1 cursor-pointer text-xs transition-colors ${
                currentBrands.includes(b.slug) ? "text-[var(--red)]" : "hover:text-[var(--red)]"
              }`}>
              <span className={`w-3.5 h-3.5 border flex items-center justify-center flex-shrink-0 text-[8px] ${
                currentBrands.includes(b.slug) ? "bg-[var(--red)] border-[var(--red)] text-white" : "border-[var(--gray-300)]"
              }`}>
                {currentBrands.includes(b.slug) && "✓"}
              </span>
              <span className="flex-1">{b.name}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* 02 사이즈 */}
      {sizes.length > 0 && (
        <Section num="03" title="사이즈">
          <div className="space-y-3">
            {clothing.length > 0 && (
              <div>
                <div className="font-[var(--font-mono)] text-[9px] text-[var(--gray-500)] tracking-[1px] mb-1.5">상의</div>
                <div className="flex flex-wrap gap-1.5">
                  {clothing.map((s) => (
                    <button key={s} onClick={() => toggleMulti("size", s)}
                      className={`px-2.5 py-1 border text-xs font-[var(--font-mono)] font-bold transition-colors ${
                        currentSizes.includes(s)
                          ? "border-[var(--black)] bg-[var(--black)] text-white"
                          : "border-[var(--line)] hover:border-[var(--black)]"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {pants.length > 0 && (
              <div>
                <div className="font-[var(--font-mono)] text-[9px] text-[var(--gray-500)] tracking-[1px] mb-1.5">하의</div>
                <div className="flex flex-wrap gap-1.5">
                  {pants.map((s) => (
                    <button key={s} onClick={() => toggleMulti("size", s)}
                      className={`px-2.5 py-1 border text-xs font-[var(--font-mono)] font-bold transition-colors ${
                        currentSizes.includes(s)
                          ? "border-[var(--black)] bg-[var(--black)] text-white"
                          : "border-[var(--line)] hover:border-[var(--black)]"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {shoes.length > 0 && (
              <div>
                <div className="font-[var(--font-mono)] text-[9px] text-[var(--gray-500)] tracking-[1px] mb-1.5">안전화 (mm)</div>
                <div className="flex flex-wrap gap-1.5">
                  {shoes.map((s) => (
                    <button key={s} onClick={() => toggleMulti("size", s)}
                      className={`px-2.5 py-1 border text-xs font-[var(--font-mono)] font-bold transition-colors ${
                        currentSizes.includes(s)
                          ? "border-[var(--black)] bg-[var(--black)] text-white"
                          : "border-[var(--line)] hover:border-[var(--black)]"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* 03 시즌 */}
      {seasons.length > 0 && (
        <Section num="03" title="시즌">
          <div className="space-y-1">
            {seasons.map((s) => (
              <label key={s}
                onClick={() => toggleMulti("season", s)}
                className={`flex items-center gap-2 py-1 cursor-pointer text-xs transition-colors ${
                  currentSeasons.includes(s) ? "text-[var(--red)]" : "hover:text-[var(--red)]"
                }`}>
                <span className={`w-3.5 h-3.5 border flex items-center justify-center flex-shrink-0 text-[8px] ${
                  currentSeasons.includes(s) ? "bg-[var(--red)] border-[var(--red)] text-white" : "border-[var(--gray-300)]"
                }`}>
                  {currentSeasons.includes(s) && "✓"}
                </span>
                {SEASON_LABELS[s] ?? s}
              </label>
            ))}
          </div>
        </Section>
      )}

      {/* 04 인증 */}
      {certs.length > 0 && (
        <Section num="04" title="인증">
          <div className="space-y-1">
            {certs.map((c) => (
              <label key={c}
                onClick={() => toggleMulti("cert", c)}
                className={`flex items-center gap-2 py-1 cursor-pointer text-xs transition-colors ${
                  currentCerts.includes(c) ? "text-[var(--red)]" : "hover:text-[var(--red)]"
                }`}>
                <span className={`w-3.5 h-3.5 border flex items-center justify-center flex-shrink-0 text-[8px] ${
                  currentCerts.includes(c) ? "bg-[var(--red)] border-[var(--red)] text-white" : "border-[var(--gray-300)]"
                }`}>
                  {currentCerts.includes(c) && "✓"}
                </span>
                {CERT_LABELS[c] ?? c}
              </label>
            ))}
          </div>
        </Section>
      )}
    </aside>
  );
}
