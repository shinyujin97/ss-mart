import { Metadata } from "next";
import EmbroiderySimulator from "./EmbroiderySimulator";

export const metadata: Metadata = {
  title: "자수 시뮬레이터 | 에스에스종합상사",
};

export default function SimulatorPage() {
  return (
    <div className="bg-[var(--gray-50)] min-h-screen">
      {/* 페이지 헤더 */}
      <div
        className="bg-[var(--black)] text-white py-8 relative overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      >
        <div className="max-w-[1340px] mx-auto px-6 flex items-center justify-between">
          <div>
            <div className="font-[var(--font-mono)] text-[10px] text-[var(--red)] tracking-[2px] flex items-center gap-2 mb-2">
              <span className="w-7 h-px bg-[var(--red)] inline-block" />
              EMBROIDERY SIMULATOR
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              자수 시뮬레이터
            </h1>
            <p className="text-white/50 text-xs mt-1 font-[var(--font-mono)]">
              자수 종류 · 위치 · 크기를 선택하고 실시간으로 가격을 확인하세요
            </p>
          </div>
          <div className="font-[var(--font-display)] text-[80px] text-white/5 leading-none">
            DIY
          </div>
        </div>
      </div>

      <EmbroiderySimulator />
    </div>
  );
}
