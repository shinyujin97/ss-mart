"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EMBROIDERY_TYPES, SIZE_LABELS, SIZE_MULTIPLIERS, POSITION_LABELS } from "@/constants/embroidery";
import type { EmbroideryTypeKey, EmbroiderySizeKey, EmbroideryPositionKey } from "@/constants/embroidery";
import TshirtCanvas, {
  POSITION_COORDS, POSITION_VIEW, VIEW_POSITIONS,
  POSITION_COORDS_BOTTOM, POSITION_VIEW_BOTTOM, VIEW_POSITIONS_BOTTOM,
  type DesignPos, type GarmentType,
} from "./TshirtCanvas";

const CANVAS_VIEWS = ["정면", "뒷면", "왼팔", "오른팔"] as const;

const TYPE_ICONS: Record<EmbroideryTypeKey, string> = {
  COMPUTER:   "◈",
  PATCH:      "◆",
  APPLIQUE:   "◉",
  REAL_PATCH: "▣",
  VELCRO:     "⊞",
  CHARACTER:  "★",
  SILK_PRINT: "▤",
};

type PositionConfig = {
  key: EmbroideryPositionKey;
  num: number;
  label: string;
  dot?: { cx: number; cy: number };
};

const POSITION_CONFIG: PositionConfig[] = [
  { key: "LEFT_CHEST",   num: 1, label: "왼가슴",   dot: { cx: 59,  cy: 73  } },
  { key: "RIGHT_CHEST",  num: 2, label: "오른가슴",  dot: { cx: 95,  cy: 73  } },
  { key: "LEFT_SLEEVE",  num: 3, label: "왼팔",      dot: { cx: 29,  cy: 89  } },
  { key: "RIGHT_SLEEVE", num: 4, label: "오른팔",    dot: { cx: 125, cy: 89  } },
  { key: "BACK_TOP",     num: 5, label: "등 상단",   dot: { cx: 237, cy: 73  } },
  { key: "BACK_CENTER",  num: 6, label: "등판 중앙", dot: { cx: 237, cy: 117 } },
  { key: "MULTIPLE",     num: 7, label: "여러 곳" },
];

const POSITION_CONFIG_BOTTOM: PositionConfig[] = [
  { key: "LEFT_CHEST",   num: 1, label: "왼허벅지",  dot: { cx: 57,  cy: 105 } },
  { key: "RIGHT_CHEST",  num: 2, label: "오른허벅지", dot: { cx: 97,  cy: 105 } },
  { key: "LEFT_SLEEVE",  num: 3, label: "왼다리",    dot: { cx: 50,  cy: 145 } },
  { key: "RIGHT_SLEEVE", num: 4, label: "오른다리",   dot: { cx: 104, cy: 145 } },
  { key: "BACK_TOP",     num: 5, label: "뒷면 허리",  dot: { cx: 237, cy: 60  } },
  { key: "BACK_CENTER",  num: 6, label: "뒷면 허벅지", dot: { cx: 237, cy: 110 } },
  { key: "MULTIPLE",     num: 7, label: "여러 곳" },
];

export default function EmbroiderySimulator() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const fromProductId   = searchParams.get("productId") ?? undefined;
  const fromProductName = searchParams.get("productName") ?? undefined;
  const fromProductSlug = searchParams.get("productSlug") ?? undefined;
  const fromColor       = searchParams.get("color") ?? undefined;
  const fromSize        = searchParams.get("size") ?? undefined;
  const fromQty         = Number(searchParams.get("qty") ?? "1");
  const garmentType     = (searchParams.get("garmentType") ?? "other") as GarmentType;

  const isBottom = garmentType === "bottom";
  const CANVAS_VIEWS = isBottom
    ? ["정면", "뒷면", "왼다리", "오른다리"] as const
    : ["정면", "뒷면", "왼팔", "오른팔"] as const;
  const posCoords  = isBottom ? POSITION_COORDS_BOTTOM : POSITION_COORDS;
  const posView    = isBottom ? POSITION_VIEW_BOTTOM   : POSITION_VIEW;
  const viewPos    = isBottom ? VIEW_POSITIONS_BOTTOM  : VIEW_POSITIONS;

  const [view, setView] = useState<string>("뒷면");
  const [type, setType] = useState<EmbroideryTypeKey>("COMPUTER");
  const [size, setSize] = useState<EmbroiderySizeKey>("MEDIUM");
  const [selectedPositions, setSelectedPositions] = useState<EmbroideryPositionKey[]>([]);
  const [designPositions, setDesignPositions] = useState<Record<string, DesignPos>>({});
  const [quantity, setQuantity] = useState(fromQty > 0 ? fromQty : 1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [designImage, setDesignImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const design = { type: "image" as const, url: designImage ?? "" };

  function togglePosition(key: EmbroideryPositionKey) {
    setSelectedPositions((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      const targetView = posView[key];
      if (targetView) setView(targetView as string);
      setDesignPositions((d) => ({ ...d, [key]: d[key] ?? posCoords[key] ?? { x: 200, y: 220 } }));
      return [...prev, key];
    });
  }

  function updateDesignPos(key: EmbroideryPositionKey, pos: DesignPos) {
    setDesignPositions((d) => ({ ...d, [key]: pos }));
  }

  const isBulkFree = quantity >= 100 && EMBROIDERY_TYPES[type].bulkFree;

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert("이미지 파일은 3MB 이하만 가능합니다."); return; }
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setDesignImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  // 이미지 + 위치 모두 선택해야 저장 가능
  const canSave = !!designImage && selectedPositions.length > 0;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await fetch("/api/embroidery/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type, size,
          positions: selectedPositions,
          designImageUrl: designImage,
          quantity,
          designPositions,
          productId:    fromProductId,
          productName:  fromProductName,
          selectedColor: fromColor,
          selectedSize:  fromSize,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => router.push("/mypage/embroidery"), 1500);
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "저장에 실패했습니다.");
      }
    } finally {
      setSaving(false);
    }
  }

  const missingHint = !designImage
    ? "이미지를 업로드해 주세요"
    : selectedPositions.length === 0
    ? "자수 위치를 선택해 주세요"
    : null;

  return (
    <div className="flex" style={{ height: "calc(100vh - 120px)", minHeight: 640 }}>

      {/* ── 좌측: 다크 캔버스 ── */}
      <div className="flex-1 bg-[#0d0d0d] flex flex-col relative overflow-hidden">
        <div className="flex items-center gap-1 px-6 pt-5 pb-3 z-10">
          {CANVAS_VIEWS.map((v, i) => (
            <button key={v} onClick={() => setView(v)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all ${
                view === v ? "bg-white text-[#111]" : "text-white/40 hover:text-white/80"
              }`}>
              <span className={`font-[var(--font-mono)] text-[9px] ${view === v ? "text-[#c8161d]" : "opacity-50"}`}>
                /{String(i + 1).padStart(2, "0")}
              </span>
              {v}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#c8161d] rounded-full animate-pulse" />
            <span className="font-[var(--font-mono)] text-[10px] text-white/30 tracking-[1px]">
              {selectedPositions.length === 0 ? "위치 미선택" : selectedPositions.map((k) => POSITION_LABELS[k]).join(" · ")}
            </span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-4">
          <div className="w-full max-w-[440px] h-full">
            <TshirtCanvas
              view={view}
              design={design}
              embroiderySize={size}
              selectedPositions={selectedPositions}
              designPositions={designPositions}
              onDesignPosChange={updateDesignPos}
              garmentType={garmentType}
            />
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
      </div>

      {/* ── 우측: 옵션 패널 ── */}
      <div className="w-[380px] flex-shrink-0 bg-white flex flex-col border-l border-[#e5e5e5]">

        <div className="px-5 py-3.5 border-b border-[#f0f0f0] flex-shrink-0">
          <div className="font-[var(--font-mono)] text-[9px] text-[#c8161d] tracking-[2px] mb-0.5">CUSTOMIZE</div>
          <div className="text-sm font-black text-[#111]">자수 옵션 설정</div>
          {fromProductName && (
            <div className="mt-2 px-3 py-2 bg-[#fffbe6] border border-[#ffd400]">
              <div className="font-[var(--font-mono)] text-[9px] text-[#888] tracking-[1px] mb-0.5">대상 상품</div>
              <div className="text-xs font-bold text-[#111] truncate">{fromProductName}</div>
              {(fromColor || fromSize) && (
                <div className="font-[var(--font-mono)] text-[10px] text-[#666] mt-0.5">
                  {[fromColor, fromSize].filter(Boolean).join(" / ")}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* STEP 01: 자수 종류 */}
          <div className="px-5 py-4 border-b border-[#f0f0f0]">
            <StepLabel num={1} title="자수 종류" required />
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(EMBROIDERY_TYPES).map(([key, t]) => (
                <button key={key} onClick={() => setType(key as EmbroideryTypeKey)}
                  className={`px-3 py-2.5 text-left border transition-all relative ${
                    type === key ? "border-[#111] bg-[#111] text-white" : "border-[#e8e8e8] hover:border-[#999] bg-white"
                  }`}>
                  <div className={`font-[var(--font-mono)] text-base mb-1 ${type === key ? "text-[#ffd400]" : "text-[#ccc]"}`}>
                    {TYPE_ICONS[key as EmbroideryTypeKey]}
                  </div>
                  <div className="text-[11px] font-bold leading-tight">{t.name}</div>
                  {t.bulkFree && (
                    <span className={`absolute top-1.5 right-1.5 text-[8px] font-bold px-1 py-0.5 ${type === key ? "bg-[#ffd400] text-[#111]" : "bg-[#f4f4f4] text-[#aaa]"}`}>
                      단체무료
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 02: 자수 위치 */}
          <div className="px-5 py-4 border-b border-[#f0f0f0]">
            <div className="flex items-center mb-3">
              <StepLabel num={2} title="자수 위치" required />
              {selectedPositions.length > 0 && (
                <span className="ml-auto font-[var(--font-mono)] text-[10px] text-[#c8161d] font-bold">
                  {selectedPositions.length}곳 선택
                </span>
              )}
            </div>

            {/* 의류 다이어그램 */}
            <div className="mb-3 border border-[#f0f0f0] bg-[#fafafa] px-2 py-3">
              {isBottom ? (
                <svg viewBox="0 0 340 175" className="w-full">
                  <text x="77"  y="12" textAnchor="middle" fill="#ccc" fontSize="9" fontFamily="monospace">앞면</text>
                  <text x="237" y="12" textAnchor="middle" fill="#ccc" fontSize="9" fontFamily="monospace">뒷면</text>
                  {/* 앞면 바지 */}
                  <g transform="translate(14,14) scale(0.35)" fill="#efefef" stroke="#d8d8d8" strokeWidth="1.5">
                    <rect x="82" y="52" width="236" height="38" />
                    <path d="M 82,90 Q 94,170 200,182 L 192,420 L 78,420 L 78,90 Z" />
                    <path d="M 318,90 Q 306,170 200,182 L 208,420 L 322,420 L 322,90 Z" />
                    <line x1="200" y1="90" x2="200" y2="182" stroke="#ccc" strokeWidth="1" />
                    <path d="M 82,90 L 118,140" stroke="#ccc" strokeWidth="1.2" fill="none" />
                    <path d="M 318,90 L 282,140" stroke="#ccc" strokeWidth="1.2" fill="none" />
                  </g>
                  {/* 뒷면 바지 */}
                  <g transform="translate(174,14) scale(0.35)" fill="#efefef" stroke="#d8d8d8" strokeWidth="1.5">
                    <rect x="82" y="52" width="236" height="38" />
                    <path d="M 82,90 Q 94,170 200,182 L 192,420 L 78,420 L 78,90 Z" />
                    <path d="M 318,90 Q 306,170 200,182 L 208,420 L 322,420 L 322,90 Z" />
                    <rect x="100" y="112" width="65" height="48" fill="none" stroke="#ccc" strokeWidth="1" />
                    <rect x="235" y="112" width="65" height="48" fill="none" stroke="#ccc" strokeWidth="1" />
                  </g>
                  {/* 위치 점 */}
                  {POSITION_CONFIG_BOTTOM.filter((p) => p.dot).map((p) => {
                    const selected = selectedPositions.includes(p.key);
                    const { cx, cy } = p.dot!;
                    return (
                      <g key={p.key} onClick={() => togglePosition(p.key)} style={{ cursor: "pointer" }}>
                        <circle cx={cx} cy={cy} r={11} fill={selected ? "#c8161d" : "#111"} />
                        <text x={cx} y={cy + 4} textAnchor="middle" fill="white"
                          fontSize="8" fontWeight="bold" fontFamily="monospace"
                          style={{ pointerEvents: "none" }}>{p.num}</text>
                      </g>
                    );
                  })}
                </svg>
              ) : (
                <svg viewBox="0 0 340 175" className="w-full">
                  <text x="77"  y="12" textAnchor="middle" fill="#ccc" fontSize="9" fontFamily="monospace">앞면</text>
                  <text x="237" y="12" textAnchor="middle" fill="#ccc" fontSize="9" fontFamily="monospace">뒷면</text>
                  {/* 앞면 작업복 상의 */}
                  <g transform="translate(7,15) scale(0.35)" fill="#efefef" stroke="#d8d8d8" strokeWidth="1.5">
                    <path d="M 88 88 L 18 145 L 22 155 L 45 165 L 90 165 Z" />
                    <path d="M 312 88 L 382 145 L 378 155 L 355 165 L 310 165 Z" />
                    <path d="M 90,165 L 48,165 L 48,420 L 352,420 L 352,165 L 310,165 L 312,88 L 252,78 L 218,148 L 200,165 L 182,148 L 148,78 L 88,88 Z" />
                    <path d="M 148,78 L 165,82 L 196,155 L 200,165" fill="none" stroke="#ccc" strokeWidth="1.2" />
                    <path d="M 252,78 L 235,82 L 204,155 L 200,165" fill="none" stroke="#ccc" strokeWidth="1.2" />
                  </g>
                  {/* 뒷면 작업복 상의 */}
                  <g transform="translate(167,15) scale(0.35)" fill="#efefef" stroke="#d8d8d8" strokeWidth="1.5">
                    <path d="M 88 88 L 18 145 L 22 155 L 45 165 L 90 165 Z" />
                    <path d="M 312 88 L 382 145 L 378 155 L 355 165 L 310 165 Z" />
                    <path d="M 90,165 L 48,165 L 48,420 L 352,420 L 352,165 L 310,165 L 312,88 L 252,78 L 200,66 L 148,78 L 88,88 Z" />
                  </g>
                  {/* 위치 점 */}
                  {POSITION_CONFIG.filter((p) => p.dot).map((p) => {
                    const selected = selectedPositions.includes(p.key);
                    const { cx, cy } = p.dot!;
                    return (
                      <g key={p.key} onClick={() => togglePosition(p.key)} style={{ cursor: "pointer" }}>
                        <circle cx={cx} cy={cy} r={11} fill={selected ? "#c8161d" : "#111"} />
                        <text x={cx} y={cy + 4} textAnchor="middle" fill="white"
                          fontSize="8" fontWeight="bold" fontFamily="monospace"
                          style={{ pointerEvents: "none" }}>{p.num}</text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>

            {/* 버튼 그리드 */}
            <div className="grid grid-cols-3 gap-1.5">
              {(isBottom ? POSITION_CONFIG_BOTTOM : POSITION_CONFIG).map((p) => {
                const selected = selectedPositions.includes(p.key);
                return (
                  <button key={p.key} onClick={() => togglePosition(p.key)}
                    className={`py-2 text-[11px] font-bold border transition-all ${
                      selected
                        ? "border-[#c8161d] bg-[#c8161d] text-white"
                        : "border-[#e8e8e8] text-[#666] hover:border-[#c8161d] hover:text-[#c8161d]"
                    }`}>
                    {p.num}.{p.label}
                  </button>
                );
              })}
            </div>
            <p className="font-[var(--font-mono)] text-[10px] text-[#bbb] mt-2">
              재클릭으로 취소 · 복수 선택 가능
            </p>
          </div>

          {/* STEP 03: 자수 크기 */}
          <div className="px-5 py-4 border-b border-[#f0f0f0]">
            <StepLabel num={3} title="자수 크기" required />
            <div className="flex gap-1.5">
              {Object.entries(SIZE_LABELS).map(([key, label]) => {
                const mult = SIZE_MULTIPLIERS[key as EmbroiderySizeKey];
                const sizeCode = label.split(" ")[0].trim();
                const dimension = label.match(/\((.+)\)/)?.[1] ?? "";
                return (
                  <button key={key} onClick={() => setSize(key as EmbroiderySizeKey)}
                    className={`flex-1 py-2.5 flex flex-col items-center border transition-all ${
                      size === key ? "border-[#111] bg-[#111] text-white" : "border-[#e8e8e8] hover:border-[#999]"
                    }`}>
                    <span className="font-[var(--font-mono)] text-[11px] font-black">{sizeCode}</span>
                    <span className={`font-[var(--font-mono)] text-[9px] mt-0.5 ${size === key ? "text-white/50" : "text-[#bbb]"}`}>
                      {dimension}
                    </span>
                    <span className={`font-[var(--font-mono)] text-[9px] mt-1 ${size === key ? "text-[#ffd400]" : "text-[#ddd]"}`}>
                      ×{mult.toFixed(1)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 04: 디자인 이미지 */}
          <div className="px-5 py-4 border-b border-[#f0f0f0]">
            <StepLabel num={4} title="디자인 이미지" required />
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleImageUpload} className="hidden" />

            {designImage ? (
              <div className="border border-[#e5e5e5] p-3">
                <div className="flex items-center gap-3 mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={designImage} alt="업로드 이미지" className="w-16 h-16 object-contain border border-[#f0f0f0]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#111] truncate">{imageName}</div>
                    <div className="font-[var(--font-mono)] text-[10px] text-[#888] mt-0.5">선택한 위치에 적용됨</div>
                  </div>
                </div>
                <button
                  onClick={() => { setDesignImage(null); setImageName(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="w-full py-2 border border-[#e5e5e5] text-xs text-[#888] hover:border-[#999] transition-colors">
                  다른 이미지로 교체
                </button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[#e0e0e0] py-8 flex flex-col items-center gap-2 hover:border-[#111] transition-colors group">
                <span className="font-[var(--font-mono)] text-2xl text-[#d0d0d0] group-hover:text-[#999]">↑</span>
                <span className="text-sm font-bold text-[#888] group-hover:text-[#111]">이미지 업로드</span>
                <span className="font-[var(--font-mono)] text-[10px] text-[#bbb]">PNG / JPG / SVG · 최대 3MB</span>
              </button>
            )}
            <p className="text-[10px] text-[#bbb] mt-2 font-[var(--font-mono)]">
              투명 배경 PNG 권장 · 저작권 없는 이미지만 사용
            </p>
          </div>

          {/* STEP 05: 수량 */}
          <div className="px-5 py-4">
            <div className="flex items-center mb-3">
              <StepLabel num={5} title="수량" />
              {quantity >= 100 && EMBROIDERY_TYPES[type].bulkFree && (
                <span className="ml-auto bg-[#ffd400] text-[#111] text-[9px] font-black px-2 py-0.5">
                  100벌+ 자수 무료
                </span>
              )}
            </div>
            <div className="flex items-center border border-[#e5e5e5]">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 border-r border-[#e5e5e5] hover:bg-[#f4f4f4] flex items-center justify-center text-lg font-bold">−</button>
              <input type="number" min={1} value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="flex-1 text-center font-[var(--font-mono)] font-black text-sm outline-none h-10" />
              <button onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 border-l border-[#e5e5e5] hover:bg-[#f4f4f4] flex items-center justify-center text-lg font-bold">+</button>
            </div>
            <div className="flex gap-1.5 mt-2">
              {[10, 30, 50, 100].map((q) => (
                <button key={q} onClick={() => setQuantity(q)}
                  className={`flex-1 py-1.5 text-[11px] font-[var(--font-mono)] font-bold border transition-colors ${
                    quantity === q ? "bg-[#111] text-white border-[#111]" : "border-[#e8e8e8] text-[#888] hover:border-[#999]"
                  }`}>
                  {q}벌
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 고정 하단 */}
        <div className="flex-shrink-0 border-t border-[#e5e5e5]">
          <div className="px-5 py-3 space-y-1.5">
            {missingHint && (
              <p className="text-center font-[var(--font-mono)] text-[10px] text-[#aaa] pb-0.5">
                {missingHint}
              </p>
            )}
            <button onClick={handleSave} disabled={!canSave || saving}
              className="w-full bg-[#c8161d] text-white py-3.5 font-bold text-sm tracking-[0.5px] hover:bg-[#9c0e15] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
              {saved
                ? <><span className="text-[#ffd400]">✓</span> 저장 완료 — 보관함으로 이동 중...</>
                : saving ? "저장 중..."
                : "시안 저장하기 →"}
            </button>
            <Link href="/bulk-order"
              className="block w-full text-center py-2.5 border border-[#e5e5e5] text-xs font-semibold text-[#888] hover:border-[#111] hover:text-[#111] transition-colors">
              단체주문 (100벌+) 별도 견적
            </Link>
          </div>
          <div className="px-5 pb-4 text-center">
            <p className="font-[var(--font-mono)] text-[10px] text-[#ccc] leading-relaxed">
              저장 후 보관함에서 시안 확인 → 견적 요청 순서로 진행됩니다
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepLabel({ num, title, required }: { num: number; title: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-5 h-5 bg-[#111] text-white font-[var(--font-mono)] text-[10px] flex items-center justify-center font-bold flex-shrink-0">
        {num}
      </span>
      <span className="text-xs font-black text-[#111] tracking-wide">{title}</span>
      {required && <span className="text-[#c8161d] text-[10px] font-bold">*</span>}
    </div>
  );
}
