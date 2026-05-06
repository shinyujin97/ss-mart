"use client";

import { useState } from "react";

const POSITIONS = [
  { key: "LEFT_CHEST",   num: 1, label: "왼가슴",   side: "front" as const, x: 148, y: 165, note: "왼쪽 가슴 · 포켓 주변 소형 로고" },
  { key: "RIGHT_CHEST",  num: 2, label: "오른가슴",  side: "front" as const, x: 252, y: 165, note: "오른쪽 가슴 · 브랜드·사번 표기" },
  { key: "LEFT_SLEEVE",  num: 3, label: "왼팔",      side: "front" as const, x: 64,  y: 210, note: "왼쪽 소매 · 팀명·부서 표기" },
  { key: "RIGHT_SLEEVE", num: 4, label: "오른팔",    side: "front" as const, x: 336, y: 210, note: "오른쪽 소매 · 국기·워드마크" },
  { key: "BACK_TOP",     num: 5, label: "등 상단",   side: "back"  as const, x: 200, y: 140, note: "등판 상단 넥라인 바로 아래" },
  { key: "BACK_CENTER",  num: 6, label: "등판 중앙", side: "back"  as const, x: 200, y: 290, note: "가장 넓은 영역 · 대형 로고·단체명" },
  { key: "MULTIPLE",     num: 7, label: "여러 곳",   side: "both"  as const, x: 0,   y: 0,   note: "복수 위치 동시 작업 · 위치마다 단가 적용" },
];

const SIZE_DIMS = { w: 88, h: 60 }; // LARGE 기준

// 셔츠 SVG 경로 (공통)
const SHIRT_PATHS = {
  sleveLeft:  "M 88 88 L 18 145 L 22 155 L 45 165 L 90 165 Z",
  sleveRight: "M 312 88 L 382 145 L 378 155 L 355 165 L 310 165 Z",
  body:       "M 88 88 L 45 165 L 45 440 L 355 440 L 355 165 L 312 88 L 260 66 C 248 110 152 110 140 66 Z",
  collar:     "M 140 66 C 152 110 248 110 260 66",
};

function ShirtSVG({
  side,
  activeKey,
  onHover,
}: {
  side: "front" | "back";
  activeKey: string | null;
  onHover: (key: string | null) => void;
}) {
  const { w: W, h: H } = SIZE_DIMS;
  const sidePositions = POSITIONS.filter((p) => p.side === side);

  return (
    <div className="relative bg-white border border-[#e5e5e5]">
      {/* 뷰 레이블 */}
      <div className="absolute top-3 left-4 font-[var(--font-mono)] text-[10px] text-[#bbb] tracking-[1.5px]">
        {side === "front" ? "FRONT" : "BACK"}
      </div>

      <svg viewBox="0 0 400 500" className="w-full" style={{ userSelect: "none" }}>
        <defs>
          <linearGradient id={`sg-${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f5f5f5" />
          </linearGradient>
        </defs>

        {/* 셔츠 */}
        <path d={SHIRT_PATHS.sleveLeft}  fill={`url(#sg-${side})`} stroke="rgba(0,0,0,0.1)" strokeWidth="1.5" />
        <path d={SHIRT_PATHS.sleveRight} fill={`url(#sg-${side})`} stroke="rgba(0,0,0,0.1)" strokeWidth="1.5" />
        <path d={SHIRT_PATHS.body}       fill={`url(#sg-${side})`} stroke="rgba(0,0,0,0.1)" strokeWidth="1.5" />
        {side === "front" ? (
          <>
            <path d={SHIRT_PATHS.collar} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1.5" />
            <line x1="200" y1="112" x2="200" y2="440" stroke="rgba(0,0,0,0.04)" strokeWidth="1" strokeDasharray="5 6" />
          </>
        ) : (
          <text x="200" y="460" textAnchor="middle" fill="rgba(0,0,0,0.06)" fontSize="14" fontFamily="monospace" letterSpacing="4">BACK</text>
        )}

        {/* 위치 마커 */}
        {sidePositions.map((pos) => {
          const isActive = activeKey === pos.key;
          const { x, y } = pos;
          return (
            <g
              key={pos.key}
              onMouseEnter={() => onHover(pos.key)}
              onMouseLeave={() => onHover(null)}
              style={{ cursor: "pointer" }}
            >
              {/* 호버 시 자수 영역 프레임 */}
              {isActive && (
                <g>
                  <rect
                    x={x - W/2} y={y - H/2} width={W} height={H}
                    fill="rgba(200,22,29,0.07)" stroke="#c8161d" strokeWidth="2"
                  />
                  {([[x-W/2,y-H/2],[x+W/2,y-H/2],[x-W/2,y+H/2],[x+W/2,y+H/2]] as [number,number][]).map(([hx,hy],i) => (
                    <rect key={i} x={hx-4} y={hy-4} width={8} height={8} fill="#c8161d" />
                  ))}
                </g>
              )}

              {/* 펄스 링 (active) */}
              {isActive && (
                <circle cx={x} cy={y} r={22}
                  fill="none" stroke="#c8161d" strokeWidth="1.5" opacity={0.4}
                  style={{ animation: "ping 1s ease-out infinite" }}
                />
              )}

              {/* 번호 원 */}
              <circle
                cx={x} cy={y} r={14}
                fill={isActive ? "#c8161d" : "#111"}
                stroke="white"
                strokeWidth="2"
                style={{ transition: "fill 0.2s ease, r 0.2s ease" }}
              />
              <text x={x} y={y + 4.5} textAnchor="middle"
                fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace"
                style={{ pointerEvents: "none" }}>
                {pos.num}
              </text>

              {/* 라벨 */}
              <text
                x={x}
                y={y + (pos.key === "BACK_TOP" ? -22 : pos.y < 200 ? -22 : 30)}
                textAnchor="middle"
                fill={isActive ? "#c8161d" : "#999"}
                fontSize="10" fontFamily="monospace" fontWeight={isActive ? "bold" : "normal"}
                style={{ pointerEvents: "none", transition: "fill 0.2s" }}>
                {pos.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* ping 애니메이션 정의 */}
      <style>{`
        @keyframes ping {
          0%   { r: 16; opacity: 0.5; }
          100% { r: 32; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function PositionShowcase() {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const activePos = POSITIONS.find((p) => p.key === activeKey);

  return (
    <section className="bg-[#f4f4f4] py-16">
      <div className="max-w-[1340px] mx-auto px-6">

        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="font-[var(--font-mono)] text-[11px] text-[#c8161d] tracking-[2px] mb-3">
            SECTION / 04 ─ POSITIONS
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-2">
            7가지 자수 <span className="text-[#c8161d]">위치</span>
          </h2>
          <p className="text-sm text-[#888]">
            마커에 마우스를 올려 자수 영역을 확인하세요
          </p>
        </div>

        {/* 셔츠 + 선택 정보 */}
        <div className="grid grid-cols-[1fr_260px_1fr] gap-5 items-start mb-8">

          {/* 앞면 */}
          <ShirtSVG side="front" activeKey={activeKey} onHover={setActiveKey} />

          {/* 중앙: 선택 정보 + 위치 목록 */}
          <div className="space-y-3">
            {/* 선택된 위치 정보 */}
            <div className="bg-white border border-[#e5e5e5] p-5 min-h-[100px] flex flex-col justify-center">
              {activePos ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-[#c8161d] text-white font-[var(--font-mono)] text-[10px] flex items-center justify-center font-bold">
                      {activePos.num}
                    </span>
                    <span className="text-sm font-black text-[#111]">{activePos.label}</span>
                  </div>
                  <p className="font-[var(--font-mono)] text-[10px] text-[#888] leading-relaxed">{activePos.note}</p>
                  {activePos.side === "front" && (
                    <div className="mt-2 font-[var(--font-mono)] text-[9px] text-[#bbb]">← 왼쪽 셔츠에서 확인</div>
                  )}
                  {activePos.side === "back" && (
                    <div className="mt-2 font-[var(--font-mono)] text-[9px] text-[#bbb]">오른쪽 셔츠에서 확인 →</div>
                  )}
                  {activePos.side === "both" && (
                    <div className="mt-2 font-[var(--font-mono)] text-[9px] text-[#bbb]">양면 동시 작업 가능</div>
                  )}
                </div>
              ) : (
                <p className="font-[var(--font-mono)] text-[10px] text-[#ccc] text-center">
                  셔츠의 번호를<br />클릭·호버해보세요
                </p>
              )}
            </div>

            {/* 위치 목록 */}
            <div className="space-y-1">
              {POSITIONS.map((pos) => {
                const isActive = activeKey === pos.key;
                return (
                  <button
                    key={pos.key}
                    onMouseEnter={() => setActiveKey(pos.key)}
                    onMouseLeave={() => setActiveKey(null)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left border transition-all duration-150 ${
                      isActive
                        ? "border-[#c8161d] bg-[#c8161d] text-white"
                        : "border-[#e5e5e5] bg-white text-[#555] hover:border-[#c8161d]/50"
                    }`}
                  >
                    <span className={`font-[var(--font-mono)] text-[10px] font-bold ${isActive ? "text-white/70" : "text-[#c8161d]"}`}>
                      {String(pos.num).padStart(2, "0")}
                    </span>
                    <span className="text-xs font-bold">{pos.label}</span>
                    {pos.side === "both" && (
                      <span className={`ml-auto font-[var(--font-mono)] text-[8px] ${isActive ? "text-white/50" : "text-[#bbb]"}`}>
                        복수
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 뒷면 */}
          <ShirtSVG side="back" activeKey={activeKey} onHover={setActiveKey} />
        </div>

        {/* CTA */}
        <div className="text-center">
          <a href="tel:031-430-0497"
            className="inline-block border-2 border-[#111] text-[#111] px-8 py-3.5 font-black text-sm hover:bg-[#111] hover:text-white transition-colors">
            자수 위치 · 종류 문의 031-430-0497 →
          </a>
        </div>
      </div>
    </section>
  );
}
