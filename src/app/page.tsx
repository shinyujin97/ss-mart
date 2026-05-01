import { Suspense } from "react";
import HeroSection from "@/components/home/HeroSection";
import BestSection from "@/components/home/BestSection";
import EmbroideryBanner from "@/components/home/EmbroideryBanner";
import BrandSection from "@/components/home/BrandSection";

const INFO_BAR = [
  { num: "CONTACT / 01", label: "CUSTOMER CENTER", value: "031-430-0497", big: true },
  { num: "CONTACT / 02", label: "LOCATION", value: "인천광역시 ○○구" },
  { num: "CONTACT / 03", label: "BUSINESS HOURS", value: "평일 09:00 - 18:00" },
  { num: "CONTACT / 04", label: "KAKAO TALK", value: "@ssmart" },
];

export default function HomePage() {
  return (
    <>
      <HeroSection />

      {/* INFO BAR */}
      <div className="bg-[var(--black)] border-t border-[#333] mt-2">
        <div className="max-w-[1340px] mx-auto px-6 grid grid-cols-4 divide-x divide-[#333]">
          {INFO_BAR.map((item) => (
            <div key={item.num} className="px-6 py-5">
              <div className="font-[var(--font-mono)] text-[10px] text-white/40 tracking-[1px] mb-0.5">
                {item.num}
              </div>
              <div className="font-[var(--font-mono)] text-[10px] text-white/60 tracking-[1px] mb-1">
                {item.label}
              </div>
              {item.big ? (
                <div className="font-[var(--font-display)] text-[26px] text-[var(--yellow)] tracking-wide">
                  {item.value}
                </div>
              ) : (
                <div className="text-sm font-bold text-white">{item.value}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* BEST 상품 */}
      <Suspense fallback={<div className="h-64 flex items-center justify-center text-[var(--gray-300)]">상품 불러오는 중...</div>}>
        <BestSection />
      </Suspense>

      {/* 자수 배너 */}
      <EmbroideryBanner />

      {/* 브랜드 */}
      <Suspense fallback={<div className="h-32" />}>
        <BrandSection />
      </Suspense>

      {/* 하단 여백 */}
      <div className="h-16" />
    </>
  );
}
