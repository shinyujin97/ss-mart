import Link from "next/link";
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
  { label: "조끼", href: "/categories/workwear-vest", slug: "workwear-vest" },
  { label: "F&B 유니폼", href: "/categories/fnb-uniform", slug: "fnb-uniform" },
  { label: "의료 / 위생", href: "/categories/medical-uniform", slug: "medical-uniform" },
  { label: "방한 / 동절기", href: "/categories/workwear-winter", slug: "workwear-winter" },
];

export default async function HeroSection() {

  return (
    <section className="max-w-[1340px] mx-auto px-4 md:pl-6 md:pr-0 md:grid md:h-[480px] flex flex-col gap-4 md:gap-0 md:[grid-template-columns:200px_1fr_214px]">
      {/* 좌측: 카테고리 리스트 (데스크톱 전용) */}
      <div className="hidden md:block bg-white border-r border-[var(--line)] overflow-y-auto">
        <div className="bg-[var(--black)] text-white px-4 py-3 font-[var(--font-mono)] text-[11px] tracking-[1px] font-semibold flex items-center gap-2">
          ▣ CATEGORY
        </div>
        {CATEGORY_LIST.map((cat) => (
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
            {cat.special && <span className="text-xs">→</span>}
          </Link>
        ))}
      </div>

      {/* 메인 배너 슬라이더 */}
      <HeroSlider />

      {/* 우측 사이드 배너 */}
      <div className="flex flex-col gap-4 md:gap-0 md:h-full">
        <Link
          href="/embroidery"
          className="min-h-[160px] flex-1 flex flex-col justify-end p-6 text-white relative overflow-hidden hover:-translate-y-0.5 transition-transform"
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
            고객 디자인 기반 시안 무료 제작
            <br />
            저작권 안전 보장
          </div>
          <div className="font-[var(--font-mono)] text-sm tracking-[1px] text-white/70">━ MORE</div>
        </Link>
        <Link
          href="/bulk-order"
          className="min-h-[160px] flex-1 flex flex-col justify-end p-6 text-white relative overflow-hidden hover:-translate-y-0.5 transition-transform"
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
