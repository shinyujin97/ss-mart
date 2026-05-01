import Link from "next/link";
import { prisma } from "@/lib/prisma";
import HeroSlider from "./HeroSlider";

const CATEGORY_LIST = [
  { label: "자수 / 마킹 주문", href: "/embroidery", slug: null, special: true },
  { label: "작업복 상의", href: "/categories/workwear-top", slug: "workwear-top" },
  { label: "작업복 하의", href: "/categories/workwear-bottom", slug: "workwear-bottom" },
  { label: "작업복 세트", href: "/categories/workwear-set", slug: "workwear-set" },
  { label: "안전화", href: "/categories/safety-shoes", slug: "safety-shoes" },
  { label: "안전모", href: "/categories/safety-helmet", slug: "safety-helmet" },
  { label: "안전장갑", href: "/categories/gloves", slug: "gloves" },
  { label: "마스크 / 보호구", href: "/categories/mask", slug: "mask" },
  { label: "안전조끼", href: "/categories/safety-vest", slug: "safety-vest" },
  { label: "F&B 유니폼", href: "/categories/fnb-uniform", slug: "fnb-uniform" },
  { label: "의료 / 위생", href: "/categories/medical-uniform", slug: "medical-uniform" },
  { label: "방한 / 동절기", href: "/categories/workwear-winter", slug: "workwear-winter" },
];

export default async function HeroSection() {
  const slugs = CATEGORY_LIST.map((c) => c.slug).filter(Boolean) as string[];

  const categories = await prisma.category.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, _count: { select: { products: true } } },
  });

  const countMap = new Map(categories.map((c) => [c.slug, c._count.products]));

  return (
    <section
      className="max-w-[1340px] mx-auto pl-6"
      style={{ display: "grid", gridTemplateColumns: "200px 1fr 214px", gap: 0, height: 480 }}
    >
      {/* 좌측: 카테고리 리스트 */}
      <div className="bg-white border-r border-[var(--line)] overflow-y-auto">
        <div className="bg-[var(--black)] text-white px-4 py-3 font-[var(--font-mono)] text-[11px] tracking-[1px] font-semibold flex items-center gap-2">
          ▣ CATEGORY
        </div>
        {CATEGORY_LIST.map((cat) => {
          const count = cat.slug ? countMap.get(cat.slug) ?? 0 : null;
          return (
            <Link
              key={cat.href}
              href={cat.href}
              className={`flex items-center justify-between px-4 py-[11px] text-[13px] border-b border-[var(--line)] transition-colors ${
                cat.special
                  ? "text-[var(--red)] font-bold hover:bg-[var(--red)] hover:text-white"
                  : "text-[var(--gray-700)] hover:bg-[var(--gray-50)] hover:text-[var(--red)]"
              }`}
            >
              <span>{cat.label}</span>
              {cat.special ? (
                <span className="text-xs">→</span>
              ) : (
                <span className="font-[var(--font-mono)] text-[11px] text-[var(--gray-500)]">
                  {count != null && count > 0 ? count.toLocaleString() : ""}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* 메인 배너 슬라이더 */}
      <HeroSlider />

      {/* 우측 사이드 배너 */}
      <div className="flex flex-col h-full">
        <Link
          href="/embroidery"
          className="flex-1 flex flex-col justify-end p-6 text-white relative overflow-hidden hover:-translate-y-0.5 transition-transform"
          style={{ background: "linear-gradient(135deg, rgba(200,22,29,0.9), rgba(156,14,21,0.98))" }}
        >
          <div className="font-[var(--font-mono)] text-[10px] text-white/70 tracking-[1.5px] mb-2.5 font-semibold">
            ▶ EMBROIDERY
          </div>
          <div className="text-[22px] font-black leading-tight tracking-tight mb-1.5">
            우리 회사
            <br />
            로고 자수
          </div>
          <div className="text-xs text-white/75 leading-relaxed mb-4">
            전문 디자이너 시안 무료 제작
            <br />
            저작권 안전 보장
          </div>
          <div className="font-[var(--font-mono)] text-sm tracking-[1px] text-white/70">━ MORE</div>
        </Link>
        <Link
          href="/bulk-order"
          className="flex-1 flex flex-col justify-end p-6 text-white relative overflow-hidden hover:-translate-y-0.5 transition-transform"
          style={{ background: "linear-gradient(135deg, rgba(26,26,26,0.95), rgba(0,0,0,0.98))" }}
        >
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--yellow)] tracking-[1.5px] mb-2.5 font-semibold">
            ▶ BULK ORDER
          </div>
          <div className="text-[22px] font-black leading-tight tracking-tight mb-1.5">
            단체주문
            <br />
            최대 30%
          </div>
          <div className="text-xs text-white/75 leading-relaxed mb-4">
            100벌 이상 견적 상담
            <br />
            전담 매니저 1:1 배정
          </div>
          <div className="font-[var(--font-mono)] text-sm tracking-[1px] text-white/70">━ MORE</div>
        </Link>
      </div>
    </section>
  );
}
