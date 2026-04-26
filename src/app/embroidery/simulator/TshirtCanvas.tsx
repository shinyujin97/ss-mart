"use client";

import { POSITION_LABELS } from "@/constants/embroidery";
import type { EmbroideryTypeKey, EmbroideryPositionKey } from "@/constants/embroidery";

interface Props {
  view: string;
  shirtColor: string;
  position: EmbroideryPositionKey;
  text: string;
  embroideryType: EmbroideryTypeKey;
}

// 위치별 SVG 좌표 (정면 기준 %)
const POSITION_COORDS: Partial<Record<EmbroideryPositionKey, { cx: number; cy: number; label: string }>> = {
  LEFT_CHEST:  { cx: 38, cy: 32, label: "왼가슴" },
  RIGHT_CHEST: { cx: 62, cy: 32, label: "오른가슴" },
  BACK_CENTER: { cx: 50, cy: 55, label: "등판 중앙" },
  BACK_TOP:    { cx: 50, cy: 28, label: "등 상단" },
  LEFT_SLEEVE: { cx: 18, cy: 40, label: "왼팔" },
  RIGHT_SLEEVE:{ cx: 82, cy: 40, label: "오른팔" },
};

const VIEW_POSITIONS: Record<string, EmbroideryPositionKey[]> = {
  "정면":  ["LEFT_CHEST", "RIGHT_CHEST", "LEFT_SLEEVE", "RIGHT_SLEEVE"],
  "뒷면":  ["BACK_CENTER", "BACK_TOP"],
  "왼팔":  ["LEFT_SLEEVE"],
  "오른팔":["RIGHT_SLEEVE"],
};

// 다크 색상인지 판별 (밝은 자수 마커 색상 결정용)
function isDark(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

export default function TshirtCanvas({ view, shirtColor, position, text, embroideryType }: Props) {
  const markerColor = isDark(shirtColor) ? "#fff" : "#111";
  const activePositions = VIEW_POSITIONS[view] ?? [];
  const isActiveInView = activePositions.includes(position);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 400 480"
        className="w-full h-full"
        style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.12))" }}
      >
        {/* 티셔츠 본체 SVG */}
        {view === "정면" || view === "뒷면" ? (
          <g>
            {/* 몸통 */}
            <path
              d="M 80 80 L 40 160 L 80 170 L 80 420 L 320 420 L 320 170 L 360 160 L 320 80 L 260 60 C 250 100 150 100 140 60 Z"
              fill={shirtColor}
              stroke={isDark(shirtColor) ? "#333" : "#ccc"}
              strokeWidth="1.5"
            />
            {/* 왼쪽 소매 */}
            <path
              d="M 80 80 L 20 130 L 40 160 L 80 150 Z"
              fill={shirtColor}
              stroke={isDark(shirtColor) ? "#333" : "#ccc"}
              strokeWidth="1.5"
            />
            {/* 오른쪽 소매 */}
            <path
              d="M 320 80 L 380 130 L 360 160 L 320 150 Z"
              fill={shirtColor}
              stroke={isDark(shirtColor) ? "#333" : "#ccc"}
              strokeWidth="1.5"
            />
            {/* 목 라인 */}
            <path
              d="M 140 60 C 150 100 250 100 260 60"
              fill="none"
              stroke={isDark(shirtColor) ? "#444" : "#bbb"}
              strokeWidth="1"
            />
            {/* 솔기 라인 */}
            <line x1="200" y1="100" x2="200" y2="420" stroke={isDark(shirtColor) ? "#333" : "#ddd"} strokeWidth="0.5" strokeDasharray="4 4" />
          </g>
        ) : (
          // 소매 뷰
          <g>
            <rect
              x="60" y="80" width="280" height="320"
              rx="20"
              fill={shirtColor}
              stroke={isDark(shirtColor) ? "#333" : "#ccc"}
              strokeWidth="1.5"
            />
            <text x="200" y="50" textAnchor="middle" fill={isDark(shirtColor) ? "#555" : "#aaa"} fontSize="12" fontFamily="monospace">
              {view === "왼팔" ? "LEFT SLEEVE" : "RIGHT SLEEVE"}
            </text>
          </g>
        )}

        {/* 자수 위치 마커들 */}
        {Object.entries(POSITION_COORDS).map(([key, coords]) => {
          if (!activePositions.includes(key as EmbroideryPositionKey)) return null;

          const x = (coords.cx / 100) * 400;
          const y = (coords.cy / 100) * 480;
          const isSelected = position === key;

          return (
            <g key={key}>
              {isSelected ? (
                // 선택된 위치 — 자수 미리보기
                <g>
                  <rect
                    x={x - 35}
                    y={y - 20}
                    width={70}
                    height={40}
                    fill="none"
                    stroke="#c8161d"
                    strokeWidth="1.5"
                    strokeDasharray="none"
                  />
                  {/* 자수 내용 표시 */}
                  {text ? (
                    <text
                      x={x}
                      y={y + 5}
                      textAnchor="middle"
                      fill="#c8161d"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {text.slice(0, 8)}
                    </text>
                  ) : (
                    <text
                      x={x}
                      y={y + 5}
                      textAnchor="middle"
                      fill="#c8161d"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {embroideryType}
                    </text>
                  )}
                  {/* 빨간 핸들 */}
                  {[[x - 35, y - 20], [x + 35, y - 20], [x - 35, y + 20], [x + 35, y + 20]].map(([hx, hy], i) => (
                    <rect key={i} x={hx - 4} y={hy - 4} width={8} height={8} fill="#c8161d" />
                  ))}
                </g>
              ) : (
                // 비선택 위치 — 점선 박스 힌트
                <g opacity={0.4}>
                  <rect
                    x={x - 25}
                    y={y - 15}
                    width={50}
                    height={30}
                    fill="none"
                    stroke={markerColor}
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <text x={x} y={y + 4} textAnchor="middle" fill={markerColor} fontSize="8" fontFamily="monospace">
                    {POSITION_LABELS[key as EmbroideryPositionKey]}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* 위치 없는 경우 안내 */}
        {!isActiveInView && (
          <text x="200" y="440" textAnchor="middle" fill="#aaa" fontSize="11" fontFamily="monospace">
            이 면에서는 선택한 위치를 볼 수 없습니다
          </text>
        )}
      </svg>
    </div>
  );
}
