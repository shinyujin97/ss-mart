"use client";

import { useRef } from "react";
import { POSITION_LABELS } from "@/constants/embroidery";
import type { EmbroideryPositionKey, EmbroiderySizeKey } from "@/constants/embroidery";

export type DesignSource =
  | { type: "text"; text: string }
  | { type: "image"; url: string }
  | { type: "sample"; key: string };

export interface DesignPos { x: number; y: number; }

export const POSITION_COORDS: Record<string, DesignPos> = {
  LEFT_CHEST:   { x: 148, y: 165 },
  RIGHT_CHEST:  { x: 252, y: 165 },
  BACK_CENTER:  { x: 200, y: 290 },
  BACK_TOP:     { x: 200, y: 140 },
  LEFT_SLEEVE:  { x: 64,  y: 210 },
  RIGHT_SLEEVE: { x: 336, y: 210 },
};

export const VIEW_POSITIONS: Record<string, EmbroideryPositionKey[]> = {
  "정면":   ["LEFT_CHEST", "RIGHT_CHEST", "LEFT_SLEEVE", "RIGHT_SLEEVE"],
  "뒷면":   ["BACK_CENTER", "BACK_TOP"],
  "왼팔":   ["LEFT_SLEEVE"],
  "오른팔": ["RIGHT_SLEEVE"],
};

export const POSITION_VIEW: Partial<Record<EmbroideryPositionKey, string>> = {
  LEFT_CHEST:   "정면",
  RIGHT_CHEST:  "정면",
  BACK_CENTER:  "뒷면",
  BACK_TOP:     "뒷면",
  LEFT_SLEEVE:  "왼팔",
  RIGHT_SLEEVE: "오른팔",
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
}

export default function TshirtCanvas({
  view, design, embroiderySize,
  selectedPositions, designPositions, onDesignPosChange,
}: Props) {
  const visiblePositions = VIEW_POSITIONS[view] ?? [];
  const { w: W, h: H } = SIZE_DIMS[embroiderySize] ?? SIZE_DIMS.MEDIUM;

  const svgRef = useRef<SVGSVGElement>(null);
  const draggingKey = useRef<EmbroideryPositionKey | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const hasImage = design.type === "image" && !!design.url;

  function toSVG(clientX: number, clientY: number) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: ((clientX - rect.left) / rect.width) * 400,
      y: ((clientY - rect.top) / rect.height) * 500,
    };
  }

  function onMarkerPointerDown(e: React.PointerEvent, key: EmbroideryPositionKey) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingKey.current = key;
    const svg = toSVG(e.clientX, e.clientY);
    const cur = designPositions[key] ?? POSITION_COORDS[key];
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

  function onSVGPointerUp() {
    draggingKey.current = null;
  }

  return (
    <div className="w-full h-full" style={{ filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.18))" }}>
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
          <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0f0f0" />
          </linearGradient>
          <linearGradient id="shadowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.06)" />
          </linearGradient>
        </defs>

        {/* 셔츠 */}
        {view === "정면" || view === "뒷면" ? (
          <g>
            <path d="M 88 88 L 18 145 L 22 155 L 45 165 L 90 165 Z" fill="url(#shirtGrad)" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
            <path d="M 312 88 L 382 145 L 378 155 L 355 165 L 310 165 Z" fill="url(#shirtGrad)" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
            <path d="M 88 88 L 45 165 L 45 440 L 355 440 L 355 165 L 312 88 L 260 66 C 248 110 152 110 140 66 Z" fill="url(#shirtGrad)" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
            <path d="M 88 88 L 45 165 L 45 440 L 355 440 L 355 165 L 312 88 L 260 66 C 248 110 152 110 140 66 Z" fill="url(#shadowGrad)" />
            <path d="M 140 66 C 152 110 248 110 260 66" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1.5" />
            <line x1="200" y1="110" x2="200" y2="440" stroke="rgba(0,0,0,0.04)" strokeWidth="1" strokeDasharray="5 6" />
            {view === "뒷면" && (
              <text x="200" y="460" textAnchor="middle" fill="rgba(0,0,0,0.07)" fontSize="11" fontFamily="monospace" letterSpacing="3">BACK</text>
            )}
          </g>
        ) : (
          <g>
            <rect x="50" y="60" width="300" height="380" fill="url(#shirtGrad)" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
            <rect x="50" y="60" width="300" height="380" fill="url(#shadowGrad)" />
            <text x="200" y="44" textAnchor="middle" fill="rgba(0,0,0,0.12)" fontSize="11" fontFamily="monospace" letterSpacing="2">
              {view === "왼팔" ? "LEFT SLEEVE" : "RIGHT SLEEVE"}
            </text>
          </g>
        )}

        {/* 선택된 위치 마커 */}
        {visiblePositions.map((key) => {
          if (!selectedPositions.includes(key)) return null;
          const pos = designPositions[key] ?? POSITION_COORDS[key];
          const { x, y } = pos;

          return (
            <g key={key}
              onPointerDown={(e) => onMarkerPointerDown(e, key)}
              style={{ cursor: "grab" }}>
              {/* 드래그 히트 영역 */}
              <rect x={x-W/2-10} y={y-H/2-10} width={W+20} height={H+20} fill="transparent" />
              {/* 자수 프레임 */}
              <rect x={x-W/2} y={y-H/2} width={W} height={H}
                fill="rgba(200,22,29,0.06)" stroke="#c8161d" strokeWidth="2" />
              {/* 모서리 핸들 */}
              {([[x-W/2,y-H/2],[x+W/2,y-H/2],[x-W/2,y+H/2],[x+W/2,y+H/2]] as [number,number][]).map(([hx,hy],i) => (
                <rect key={i} x={hx-3} y={hy-3} width={6} height={6} fill="#c8161d" />
              ))}

              {/* 이미지가 있으면 프레임 안에 표시 */}
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
                  fontSize="8" fontFamily="monospace" opacity={0.6}
                  style={{ pointerEvents: "none" }}>
                  {POSITION_LABELS[key]}
                </text>
              )}

              {/* 위치 라벨 */}
              <text x={x} y={y+H/2+13} textAnchor="middle"
                fill="#c8161d" fontSize="8" fontFamily="monospace" fontWeight="bold"
                style={{ pointerEvents: "none" }}>
                {POSITION_LABELS[key]}
              </text>
            </g>
          );
        })}

        {/* 이 면에 선택된 위치 없을 때 */}
        {selectedPositions.length > 0 && !visiblePositions.some((k) => selectedPositions.includes(k)) && (
          <text x="200" y="470" textAnchor="middle" fill="rgba(0,0,0,0.15)"
            fontSize="10" fontFamily="monospace" letterSpacing="1">
            이 면에는 선택된 위치가 없습니다
          </text>
        )}
      </svg>
    </div>
  );
}
