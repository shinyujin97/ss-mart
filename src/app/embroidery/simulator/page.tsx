import { Metadata } from "next";
import { Suspense } from "react";
import EmbroiderySimulator from "./EmbroiderySimulator";

export const metadata: Metadata = {
  title: "자수 시뮬레이터 | 에스에스종합상사",
};

export default function SimulatorPage() {
  return (
    <div className="bg-[#0d0d0d] flex flex-col" style={{ minHeight: "calc(100vh - 120px)" }}>
      {/* 심플 헤더 바 */}
      <div className="border-b border-white/5 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="font-[var(--font-mono)] text-[10px] text-white/30 tracking-[2px]">
            EMBROIDERY / SIMULATOR
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="text-white/60 text-xs">
            자수 종류 · 위치 · 크기를 선택하고 실시간 가격을 확인하세요
          </div>
        </div>
        <div className="font-[var(--font-display)] text-2xl text-white/5 leading-none">MARKING</div>
      </div>
      <Suspense fallback={<div className="flex-1 bg-[#0d0d0d]" />}>
        <EmbroiderySimulator />
      </Suspense>
    </div>
  );
}
