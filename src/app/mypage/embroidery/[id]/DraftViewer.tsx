"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ── 디테일 탭: 자수위치 시안을 확대/드래그로 보기 ──
function DetailViewer({ children }: { children: React.ReactNode }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(2);
  const dragging = useRef(false);
  const lastPt = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // passive: false 로 wheel 이벤트 직접 등록 — React onWheel은 passive라 preventDefault 불가
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setScale((s) => Math.min(5, Math.max(0.5, s - e.deltaY * 0.001)));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  function onMouseDown(e: React.MouseEvent) {
    dragging.current = true;
    lastPt.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return;
    const dx = e.clientX - lastPt.current.x;
    const dy = e.clientY - lastPt.current.y;
    lastPt.current = { x: e.clientX, y: e.clientY };
    setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
  }
  function onMouseUp() { dragging.current = false; }

  const reset = useCallback(() => { setPos({ x: 0, y: 0 }); setScale(2); }, []);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!touchStart.current) return;
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = { x: t.clientX, y: t.clientY };
    setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
  }
  function onTouchEnd() { touchStart.current = null; }

  return (
    <div ref={containerRef}
      className="relative bg-[#f8f8f8] border border-[#e0e0e0] overflow-hidden select-none"
      style={{ height: 360, cursor: dragging.current ? "grabbing" : "grab" }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* 시안 콘텐츠 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div style={{
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
          transformOrigin: "center",
          width: "60%",
        }}>
          {children}
        </div>
      </div>

      {/* 컨트롤 버튼 */}
      <div className="absolute bottom-3 right-3 flex gap-1.5 pointer-events-auto">
        <button onClick={(e) => { e.stopPropagation(); setScale(s => Math.min(5, s + 0.5)); }}
          className="w-8 h-8 bg-white border border-[#ddd] text-sm font-bold hover:bg-[#f0f0f0] shadow-sm">+</button>
        <button onClick={(e) => { e.stopPropagation(); setScale(s => Math.max(0.5, s - 0.5)); }}
          className="w-8 h-8 bg-white border border-[#ddd] text-sm font-bold hover:bg-[#f0f0f0] shadow-sm">−</button>
        <button onClick={(e) => { e.stopPropagation(); reset(); }}
          className="h-8 px-2.5 bg-white border border-[#ddd] text-[10px] font-bold hover:bg-[#f0f0f0] shadow-sm font-[var(--font-mono)]">초기화</button>
      </div>

      <div className="absolute top-2 left-3 font-[var(--font-mono)] text-[9px] text-[#bbb] pointer-events-none">
        드래그하여 이동 · 휠로 확대/축소
      </div>
    </div>
  );
}

// ── 메인 탭 전환 컴포넌트 ──
interface Props {
  shirtPreview: React.ReactNode;
}

export default function DraftViewer({ shirtPreview }: Props) {
  const [tab, setTab] = useState<"position" | "detail">("position");

  return (
    <div>
      {/* 탭 */}
      <div className="grid grid-cols-2">
        <button
          onClick={() => setTab("position")}
          className={`py-2.5 text-sm font-bold transition-colors ${
            tab === "position" ? "bg-[#ffd400] text-[#111]" : "bg-[#e8e8e8] text-[#888] hover:bg-[#ddd]"
          }`}
        >
          자수위치 확인하기!!
        </button>
        <button
          onClick={() => setTab("detail")}
          className={`py-2.5 text-sm font-bold transition-colors ${
            tab === "detail" ? "bg-[#ffd400] text-[#111]" : "bg-[#e8e8e8] text-[#888] hover:bg-[#ddd]"
          }`}
        >
          디테일 확인하기!!
        </button>
      </div>

      {/* 경고 */}
      <div className="bg-[#c8161d] text-white text-center py-2 text-xs font-bold tracking-wide">
        옷칼라 및 자수 색상은 실제품과 다소 차이가 있을 수 있습니다.
      </div>

      {/* 탭 콘텐츠 */}
      {tab === "position" ? (
        <div className="p-5">{shirtPreview}</div>
      ) : (
        <div className="p-4">
          <DetailViewer>{shirtPreview}</DetailViewer>
        </div>
      )}
    </div>
  );
}
