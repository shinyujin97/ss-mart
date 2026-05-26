"use client";

import { useRouter } from "next/navigation";

interface SiblingProduct {
  slug: string;
  name: string;
  shortDescription: string | null;
  options: { color: string }[];
}

interface Props {
  currentSlug: string;
  siblings: SiblingProduct[];
  catalogPage: string;
}

export default function CatalogPageSelector({ currentSlug, siblings, catalogPage }: Props) {
  const router = useRouter();

  if (siblings.length <= 1) return null;

  function getLabel(p: SiblingProduct) {
    // "일터루 IT-616 바지" → "IT-616 바지"
    const displayName = p.name.replace(/^일터루\s*/i, "").trim();
    const colors = [...new Set(p.options.map((o) => o.color))];
    const colorStr = colors.length > 0 ? ` (${colors.slice(0, 2).join(", ")})` : "";
    return `${displayName}${colorStr}`;
  }

  return (
    <div className="mb-5 border border-[var(--line)] bg-[var(--gray-50)]">
      <div className="px-4 py-2 border-b border-[var(--line)] flex items-center justify-between">
        <span className="font-[var(--font-mono)] text-[10px] text-[var(--red)] tracking-[1.5px] font-semibold">
          ─ 같은 카탈로그 페이지 상품 (총 {siblings.length}종)
        </span>
        <span className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)]">
          PAGE / {catalogPage}
        </span>
      </div>
      <div className="p-3">
        <select
          value={currentSlug}
          onChange={(e) => {
            if (e.target.value !== currentSlug) {
              router.push(`/products/${e.target.value}`);
            }
          }}
          className="w-full border border-[var(--line)] bg-white px-3 py-2.5 text-sm font-semibold text-[var(--black)] appearance-none cursor-pointer focus:outline-none focus:border-[var(--black)] transition-colors"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23111' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
        >
          {siblings.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.slug === currentSlug ? "▶ " : ""}
              {getLabel(p)}
            </option>
          ))}
        </select>
        {/* 현재 상품 색상 칩 미리보기 */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {siblings.map((p) => {
            const isCurrent = p.slug === currentSlug;
            const colors = [...new Set(p.options.map((o) => o.color))];
            const codePart = p.name.replace(/^일터루\s*/i, "").split(" ")[0];
            return (
              <button
                key={p.slug}
                onClick={() => { if (!isCurrent) router.push(`/products/${p.slug}`); }}
                className={`px-2.5 py-1 text-[11px] font-[var(--font-mono)] font-semibold transition-all ${
                  isCurrent
                    ? "bg-[var(--black)] text-white"
                    : "bg-white border border-[var(--line)] text-[var(--gray-700)] hover:border-[var(--black)] hover:text-[var(--black)]"
                }`}
                title={`${p.name} — ${colors.join(", ")}`}
              >
                {codePart}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
