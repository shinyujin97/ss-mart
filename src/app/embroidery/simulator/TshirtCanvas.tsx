"use client";

import { useRef } from "react";
import { POSITION_LABELS } from "@/constants/embroidery";
import type { EmbroideryPositionKey, EmbroiderySizeKey } from "@/constants/embroidery";

export type DesignSource =
  | { type: "text"; text: string }
  | { type: "image"; url: string }
  | { type: "sample"; key: string };

export interface DesignPos { x: number; y: number; }

export type GarmentType = "top" | "bottom" | "other";

// ── 상의 위치 좌표 ──────────────────────────────────────────────
export const POSITION_COORDS: Record<string, DesignPos> = {
  LEFT_CHEST:   { x: 148, y: 168 },
  RIGHT_CHEST:  { x: 252, y: 168 },
  BACK_CENTER:  { x: 200, y: 295 },
  BACK_TOP:     { x: 200, y: 145 },
  LEFT_SLEEVE:  { x: 64,  y: 215 },
  RIGHT_SLEEVE: { x: 336, y: 215 },
};

// ── 하의 위치 좌표 ──────────────────────────────────────────────
export const POSITION_COORDS_BOTTOM: Record<string, DesignPos> = {
  LEFT_CHEST:   { x: 138, y: 305 },  // 왼쪽 허벅지
  RIGHT_CHEST:  { x: 262, y: 305 },  // 오른쪽 허벅지
  BACK_CENTER:  { x: 200, y: 330 },  // 뒷면 허벅지
  BACK_TOP:     { x: 200, y: 115 },  // 뒷면 허리
  LEFT_SLEEVE:  { x: 120, y: 410 },  // 왼쪽 하단 다리
  RIGHT_SLEEVE: { x: 280, y: 410 },  // 오른쪽 하단 다리
};

export const VIEW_POSITIONS: Record<string, EmbroideryPositionKey[]> = {
  "정면":   ["LEFT_CHEST", "RIGHT_CHEST", "LEFT_SLEEVE", "RIGHT_SLEEVE"],
  "뒷면":   ["BACK_CENTER", "BACK_TOP"],
  "왼팔":   ["LEFT_SLEEVE"],
  "오른팔": ["RIGHT_SLEEVE"],
};

export const VIEW_POSITIONS_BOTTOM: Record<string, EmbroideryPositionKey[]> = {
  "정면":    ["LEFT_CHEST", "RIGHT_CHEST"],
  "뒷면":    ["BACK_CENTER", "BACK_TOP"],
  "왼다리":  ["LEFT_SLEEVE"],
  "오른다리": ["RIGHT_SLEEVE"],
};

export const POSITION_VIEW: Partial<Record<EmbroideryPositionKey, string>> = {
  LEFT_CHEST:   "정면",
  RIGHT_CHEST:  "정면",
  BACK_CENTER:  "뒷면",
  BACK_TOP:     "뒷면",
  LEFT_SLEEVE:  "왼팔",
  RIGHT_SLEEVE: "오른팔",
};

export const POSITION_VIEW_BOTTOM: Partial<Record<EmbroideryPositionKey, string>> = {
  LEFT_CHEST:   "정면",
  RIGHT_CHEST:  "정면",
  BACK_CENTER:  "뒷면",
  BACK_TOP:     "뒷면",
  LEFT_SLEEVE:  "왼다리",
  RIGHT_SLEEVE: "오른다리",
};

const SIZE_DIMS: Record<string, { w: number; h: number }> = {
  SMALL:   { w: 44,  h: 30  },
  MEDIUM:  { w: 70,  h: 48  },
  LARGE:   { w: 88,  h: 60  },
  XLARGE:  { w: 130, h: 88  },
  XXLARGE: { w: 172, h: 116 },
};

interface Props {
  view: string;
  design: DesignSource;
  embroiderySize: EmbroiderySizeKey;
  selectedPositions: EmbroideryPositionKey[];
  designPositions: Record<string, DesignPos>;
  onDesignPosChange: (key: EmbroideryPositionKey, pos: DesignPos) => void;
  garmentType?: GarmentType;
}

// ── 작업복 상의 SVG ─────────────────────────────────────────────
function WorkJacketShape({ view }: { view: string }) {
  const isFront = view === "정면";
  const isBack  = view === "뒷면";
  const isSleeve = view === "왼팔" || view === "오른팔";

  const base = "url(#jacketGrad)";
  const stroke = "rgba(255,255,255,0.18)";
  const sw = "1.2";
  const detail = "rgba(255,255,255,0.08)";

  if (isSleeve) {
    return (
      <g>
        <rect x="40" y="55" width="320" height="395" rx="4" fill={base} stroke={stroke} strokeWidth={sw} />
        <rect x="40" y="55" width="320" height="395" fill="url(#shadowGrad)" />
        <text x="200" y="42" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="11"
          fontFamily="monospace" letterSpacing="2">
          {view === "왼팔" ? "LEFT SLEEVE" : "RIGHT SLEEVE"}
        </text>
        {/* 소매 솔기선 */}
        <line x1="200" y1="55" x2="200" y2="450" stroke={detail} strokeWidth="1" strokeDasharray="6 8" />
      </g>
    );
  }

  return (
    <g>
      {/* 왼쪽 소매 */}
      <path
        d="M 88,90 L 18,148 L 22,160 L 48,170 L 90,172 Z"
        fill={base} stroke={stroke} strokeWidth={sw}
      />
      {/* 오른쪽 소매 */}
      <path
        d="M 312,90 L 382,148 L 378,160 L 352,170 L 310,172 Z"
        fill={base} stroke={stroke} strokeWidth={sw}
      />
      {/* 몸통 — 라펠 V 칼라 */}
      <path
        d={isFront
          ? "M 90,172 L 48,172 L 48,445 L 352,445 L 352,172 L 310,172 L 312,90 L 252,78 L 218,152 L 200,168 L 182,152 L 148,78 L 88,90 Z"
          : "M 90,172 L 48,172 L 48,445 L 352,445 L 352,172 L 310,172 L 312,90 L 252,78 L 200,66 L 148,78 L 88,90 Z"
        }
        fill={base} stroke={stroke} strokeWidth={sw}
      />
      <path
        d={isFront
          ? "M 90,172 L 48,172 L 48,445 L 352,445 L 352,172 L 310,172 L 312,90 L 252,78 L 218,152 L 200,168 L 182,152 L 148,78 L 88,90 Z"
          : "M 90,172 L 48,172 L 48,445 L 352,445 L 352,172 L 310,172 L 312,90 L 252,78 L 200,66 L 148,78 L 88,90 Z"
        }
        fill="url(#shadowGrad)"
      />

      {isFront && (
        <>
          {/* 왼쪽 라펠 */}
          <path d="M 148,78 L 165,82 L 196,160 L 200,168" fill="rgba(255,255,255,0.06)" stroke={stroke} strokeWidth="1" />
          {/* 오른쪽 라펠 */}
          <path d="M 252,78 L 235,82 L 204,160 L 200,168" fill="rgba(255,255,255,0.06)" stroke={stroke} strokeWidth="1" />
          {/* 칼라 스탠드 */}
          <path d="M 148,78 L 166,66 L 200,62 L 234,66 L 252,78" fill="none" stroke={stroke} strokeWidth="1" />
          {/* 단추 플래킷 */}
          <line x1="200" y1="168" x2="200" y2="445" stroke={detail} strokeWidth="1" strokeDasharray="2 10" />
          {/* 왼쪽 가슴 주머니 */}
          <rect x="112" y="198" width="46" height="38" rx="1" fill="none" stroke={detail} strokeWidth="1.2" />
          <line x1="112" y1="210" x2="158" y2="210" stroke={detail} strokeWidth="1" />
          {/* 어깨 솔기 */}
          <line x1="88" y1="90" x2="90" y2="172" stroke={detail} strokeWidth="1" />
          <line x1="312" y1="90" x2="310" y2="172" stroke={detail} strokeWidth="1" />
        </>
      )}

      {isBack && (
        <>
          {/* 칼라 뒷면 */}
          <path d="M 148,78 L 166,66 L 200,62 L 234,66 L 252,78" fill="rgba(255,255,255,0.06)" stroke={stroke} strokeWidth="1" />
          {/* 센터 백 솔기 */}
          <line x1="200" y1="62" x2="200" y2="445" stroke={detail} strokeWidth="1" strokeDasharray="6 8" />
          {/* 요크 라인 */}
          <line x1="88" y1="130" x2="312" y2="130" stroke={detail} strokeWidth="1" />
          <text x="200" y="462" textAnchor="middle" fill="rgba(255,255,255,0.1)"
            fontSize="11" fontFamily="monospace" letterSpacing="3">BACK</text>
        </>
      )}
    </g>
  );
}

// ── 작업복 하의 SVG ─────────────────────────────────────────────
function WorkPantsShape({ view }: { view: string }) {
  const isFront = view === "정면";
  const isBack  = view === "뒷면";

  const base   = "url(#jacketGrad)";
  const stroke = "rgba(255,255,255,0.18)";
  const sw     = "1.2";
  const detail = "rgba(255,255,255,0.08)";

  if (view === "왼다리" || view === "오른다리") {
    return (
      <g>
        <rect x="55" y="55" width="290" height="400" rx="4" fill={base} stroke={stroke} strokeWidth={sw} />
        <rect x="55" y="55" width="290" height="400" fill="url(#shadowGrad)" />
        <text x="200" y="42" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="11"
          fontFamily="monospace" letterSpacing="2">
          {view === "왼다리" ? "LEFT LEG" : "RIGHT LEG"}
        </text>
        {/* 무릎 보강 표시 */}
        <rect x="75" y="220" width="250" height="85" rx="2" fill="none" stroke={detail} strokeWidth="1.5" strokeDasharray="4 6" />
        <text x="200" y="270" textAnchor="middle" fill={detail} fontSize="9" fontFamily="monospace">KNEE REINFORCE</text>
      </g>
    );
  }

  return (
    <g>
      {/* 허리띠 */}
      <rect x="80" y="52" width="240" height="42" rx="2" fill={base} stroke={stroke} strokeWidth={sw} />
      {/* 벨트 루프 */}
      {[110, 150, 200, 250, 290].map((x) => (
        <rect key={x} x={x - 5} y="48" width="10" height="10" rx="1"
          fill="rgba(255,255,255,0.12)" stroke={stroke} strokeWidth="1" />
      ))}

      {/* 왼쪽 다리 */}
      <path
        d="M 80,94 Q 92,178 200,192 L 190,462 L 75,462 L 75,94 Z"
        fill={base} stroke={stroke} strokeWidth={sw}
      />
      {/* 오른쪽 다리 */}
      <path
        d="M 320,94 Q 308,178 200,192 L 210,462 L 325,462 L 325,94 Z"
        fill={base} stroke={stroke} strokeWidth={sw}
      />
      {/* 그라데이션 그림자 */}
      <path d="M 80,94 Q 92,178 200,192 L 190,462 L 75,462 L 75,94 Z" fill="url(#shadowGrad)" />
      <path d="M 320,94 Q 308,178 200,192 L 210,462 L 325,462 L 325,94 Z" fill="url(#shadowGrad)" />

      {/* 밑위 솔기 */}
      <path d="M 200,94 Q 200,144 200,192" fill="none" stroke={detail} strokeWidth="1" />

      {isFront && (
        <>
          {/* 왼쪽 주머니 입구 사선 */}
          <path d="M 80,94 L 118,148" fill="none" stroke={detail} strokeWidth="1.5" />
          {/* 오른쪽 주머니 입구 사선 */}
          <path d="M 320,94 L 282,148" fill="none" stroke={detail} strokeWidth="1.5" />
          {/* 무릎 보강선 */}
          <line x1="78" y1="310" x2="188" y2="310" stroke={detail} strokeWidth="1" strokeDasharray="4 6" />
          <line x1="212" y1="310" x2="322" y2="310" stroke={detail} strokeWidth="1" strokeDasharray="4 6" />
        </>
      )}
      {isBack && (
        <>
          {/* 뒷주머니 */}
          <rect x="100" y="120" width="65" height="55" rx="1" fill="none" stroke={detail} strokeWidth="1.2" />
          <rect x="235" y="120" width="65" height="55" rx="1" fill="none" stroke={detail} strokeWidth="1.2" />
          {/* 센터 솔기 */}
          <line x1="200" y1="94" x2="200" y2="462" stroke={detail} strokeWidth="1" strokeDasharray="6 8" />
          <text x="200" y="478" textAnchor="middle" fill="rgba(255,255,255,0.1)"
            fontSize="11" fontFamily="monospace" letterSpacing="3">BACK</text>
        </>
      )}
    </g>
  );
}

// ── 기존 티셔츠 SVG (other) ──────────────────────────────────────
function GenericShirtShape({ view }: { view: string }) {
  const base   = "url(#jacketGrad)";
  const stroke = "rgba(255,255,255,0.18)";
  const sw     = "1.2";
  const detail = "rgba(255,255,255,0.08)";

  if (view !== "정면" && view !== "뒷면") {
    return (
      <g>
        <rect x="50" y="60" width="300" height="380" fill={base} stroke={stroke} strokeWidth={sw} />
        <rect x="50" y="60" width="300" height="380" fill="url(#shadowGrad)" />
        <text x="200" y="44" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="11"
          fontFamily="monospace" letterSpacing="2">
          {view === "왼팔" ? "LEFT SLEEVE" : "RIGHT SLEEVE"}
        </text>
      </g>
    );
  }
  return (
    <g>
      <path d="M 88 88 L 18 145 L 22 155 L 45 165 L 90 165 Z" fill={base} stroke={stroke} strokeWidth={sw} />
      <path d="M 312 88 L 382 145 L 378 155 L 355 165 L 310 165 Z" fill={base} stroke={stroke} strokeWidth={sw} />
      <path d="M 88 88 L 45 165 L 45 440 L 355 440 L 355 165 L 312 88 L 260 66 C 248 110 152 110 140 66 Z" fill={base} stroke={stroke} strokeWidth={sw} />
      <path d="M 88 88 L 45 165 L 45 440 L 355 440 L 355 165 L 312 88 L 260 66 C 248 110 152 110 140 66 Z" fill="url(#shadowGrad)" />
      <path d="M 140 66 C 152 110 248 110 260 66" fill="none" stroke={detail} strokeWidth="1.5" />
      <line x1="200" y1="110" x2="200" y2="440" stroke={detail} strokeWidth="1" strokeDasharray="5 6" />
      {view === "뒷면" && (
        <text x="200" y="460" textAnchor="middle" fill="rgba(255,255,255,0.1)" fontSize="11" fontFamily="monospace" letterSpacing="3">BACK</text>
      )}
    </g>
  );
}

export default function TshirtCanvas({
  view, design, embroiderySize,
  selectedPositions, designPositions, onDesignPosChange,
  garmentType = "other",
}: Props) {
  const posCoords = garmentType === "bottom" ? POSITION_COORDS_BOTTOM : POSITION_COORDS;
  const viewPos   = garmentType === "bottom" ? VIEW_POSITIONS_BOTTOM : VIEW_POSITIONS;

  const visiblePositions = viewPos[view] ?? [];
  const { w: W, h: H } = SIZE_DIMS[embroiderySize] ?? SIZE_DIMS.MEDIUM;

  const svgRef = useRef<SVGSVGElement>(null);
  const draggingKey = useRef<EmbroideryPositionKey | null>(null);
  const dragOffset  = useRef({ x: 0, y: 0 });

  const hasImage = design.type === "image" && !!design.url;

  function toSVG(clientX: number, clientY: number) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: ((clientX - rect.left)  / rect.width)  * 400,
      y: ((clientY - rect.top)   / rect.height) * 500,
    };
  }

  function onMarkerPointerDown(e: React.PointerEvent, key: EmbroideryPositionKey) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingKey.current = key;
    const svg = toSVG(e.clientX, e.clientY);
    const cur = designPositions[key] ?? posCoords[key];
    dragOffset.current = { x: svg.x - cur.x, y: svg.y - cur.y };
  }

  function onSVGPointerMove(e: React.PointerEvent) {
    const key = draggingKey.current;
    if (!key) return;
    const svg = toSVG(e.clientX, e.clientY);
    onDesignPosChange(key, {
      x: Math.max(40, Math.min(360, svg.x - dragOffset.current.x)),
      y: Math.max(80, Math.min(460, svg.y - dragOffset.current.y)),
    });
  }

  function onSVGPointerUp() { draggingKey.current = null; }

  return (
    <div className="w-full h-full" style={{ filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.25))" }}>
      <svg
        ref={svgRef}
        viewBox="0 0 400 500"
        className="w-full h-full"
        style={{ userSelect: "none" }}
        onPointerMove={onSVGPointerMove}
        onPointerUp={onSVGPointerUp}
        onPointerLeave={onSVGPointerUp}
      >
        <defs>
          <linearGradient id="jacketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2a2a2a" />
            <stop offset="100%" stopColor="#1a1a1a" />
          </linearGradient>
          <linearGradient id="shadowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
          </linearGradient>
        </defs>

        {/* 의류 실루엣 */}
        {garmentType === "top"    && <WorkJacketShape view={view} />}
        {garmentType === "bottom" && <WorkPantsShape  view={view} />}
        {garmentType === "other"  && <GenericShirtShape view={view} />}

        {/* 자수 마커 */}
        {visiblePositions.map((key) => {
          if (!selectedPositions.includes(key)) return null;
          const pos = designPositions[key] ?? posCoords[key];
          const { x, y } = pos;

          return (
            <g key={key} onPointerDown={(e) => onMarkerPointerDown(e, key)} style={{ cursor: "grab" }}>
              <rect x={x-W/2-10} y={y-H/2-10} width={W+20} height={H+20} fill="transparent" />
              <rect x={x-W/2} y={y-H/2} width={W} height={H}
                fill="rgba(200,22,29,0.12)" stroke="#c8161d" strokeWidth="2" />
              {([[x-W/2,y-H/2],[x+W/2,y-H/2],[x-W/2,y+H/2],[x+W/2,y+H/2]] as [number,number][]).map(([hx,hy],i) => (
                <rect key={i} x={hx-3} y={hy-3} width={6} height={6} fill="#c8161d" />
              ))}
              {hasImage ? (
                <image
                  href={(design as { type: "image"; url: string }).url}
                  x={x-W/2+3} y={y-H/2+3}
                  width={W-6} height={H-6}
                  preserveAspectRatio="xMidYMid meet"
                  style={{ pointerEvents: "none" }}
                />
              ) : (
                <text x={x} y={y+4} textAnchor="middle" fill="#c8161d"
                  fontSize="8" fontFamily="monospace" opacity={0.8}
                  style={{ pointerEvents: "none" }}>
                  {POSITION_LABELS[key]}
                </text>
              )}
              <text x={x} y={y+H/2+14} textAnchor="middle"
                fill="#c8161d" fontSize="8" fontFamily="monospace" fontWeight="bold"
                style={{ pointerEvents: "none" }}>
                {POSITION_LABELS[key]}
              </text>
            </g>
          );
        })}

        {selectedPositions.length > 0 && !visiblePositions.some((k) => selectedPositions.includes(k)) && (
          <text x="200" y="480" textAnchor="middle" fill="rgba(255,255,255,0.2)"
            fontSize="10" fontFamily="monospace" letterSpacing="1">
            이 면에는 선택된 위치가 없습니다
          </text>
        )}
      </svg>
    </div>
  );
}
