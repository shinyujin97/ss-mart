"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { EMBROIDERY_TYPES, SIZE_LABELS, POSITION_LABELS } from "@/constants/embroidery";
import type { EmbroideryTypeKey, EmbroiderySizeKey, EmbroideryPositionKey } from "@/constants/embroidery";
import { validateCopyright } from "@/lib/embroidery/copyright";
import { calculateUnitPrice } from "@/lib/embroidery/pricing";
import TshirtCanvas from "./TshirtCanvas";

const SHIRT_COLORS = [
  { key: "white", hex: "#f5f5f5", label: "화이트" },
  { key: "gray",  hex: "#888888", label: "그레이" },
  { key: "black", hex: "#1a1a1a", label: "블랙" },
  { key: "navy",  hex: "#1e3a5f", label: "네이비" },
  { key: "red",   hex: "#c8161d", label: "레드" },
];

const CANVAS_VIEWS = ["정면", "뒷면", "왼팔", "오른팔"] as const;

export default function EmbroiderySimulator() {
  const [view, setView] = useState<typeof CANVAS_VIEWS[number]>("정면");
  const [shirtColor, setShirtColor] = useState("navy");
  const [type, setType] = useState<EmbroideryTypeKey>("COMPUTER");
  const [size, setSize] = useState<EmbroiderySizeKey>("MEDIUM");
  const [position, setPosition] = useState<EmbroideryPositionKey>("LEFT_CHEST");
  const [text, setText] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [copyrightError, setCopyrightError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const unitPrice = calculateUnitPrice({ type, size, positions: [position] });
  const totalPrice = unitPrice * quantity;
  const isBulkFree = quantity >= 100 && EMBROIDERY_TYPES[type].bulkFree;

  function handleTextChange(value: string) {
    setText(value);
    if (value) {
      const check = validateCopyright(value);
      setCopyrightError(check.passed ? "" : check.reason ?? "");
    } else {
      setCopyrightError("");
    }
  }

  async function handleSave() {
    if (copyrightError) return;
    setSaving(true);
    try {
      await fetch("/api/embroidery/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, size, position, textContent: text, quantity }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-[1340px] mx-auto px-6 py-6 mb-12">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16 }}>
        {/* 좌측: 캔버스 */}
        <div className="border border-[var(--line)] bg-[var(--gray-50)] relative" style={{ height: 660 }}>
          {/* 뷰 탭 */}
          <div className="absolute top-4 left-4 flex gap-px z-10">
            {CANVAS_VIEWS.map((v, i) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 border transition-all ${
                  view === v
                    ? "bg-[var(--black)] text-white border-[var(--black)]"
                    : "bg-white text-[var(--gray-700)] border-[var(--line)] hover:bg-[var(--gray-100)]"
                }`}
              >
                <span className={`font-[var(--font-mono)] text-[10px] ${view === v ? "text-[var(--yellow)]" : "opacity-60"}`}>
                  /{String(i + 1).padStart(2, "0")}
                </span>
                {v}
              </button>
            ))}
          </div>

          {/* 뷰 라벨 */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 font-[var(--font-mono)] text-[10px] text-[var(--gray-400)] tracking-[2px] z-10">
            {view.toUpperCase()} VIEW
          </div>

          {/* 티셔츠 캔버스 */}
          <div className="absolute inset-0 flex items-center justify-center pt-16 pb-14 px-8">
            <TshirtCanvas
              view={view}
              shirtColor={SHIRT_COLORS.find((c) => c.key === shirtColor)?.hex ?? "#1e3a5f"}
              position={position}
              text={text}
              embroideryType={type}
            />
          </div>

          {/* 하단 색상 선택 */}
          <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-white border border-[var(--line)] px-3 py-2">
            <span className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] pr-3 border-r border-[var(--line)] tracking-[1px]">
              COLOR
            </span>
            {SHIRT_COLORS.map((c) => (
              <button
                key={c.key}
                onClick={() => setShirtColor(c.key)}
                title={c.label}
                className={`w-5 h-5 border-[1.5px] transition-all ${
                  shirtColor === c.key ? "border-[var(--red)] scale-125" : "border-[var(--gray-300)]"
                }`}
                style={{ background: c.hex }}
              />
            ))}
          </div>

          {/* 하단 우측: 자수 위치 설명 */}
          <div className="absolute bottom-4 right-4 font-[var(--font-mono)] text-[10px] text-[var(--gray-400)] tracking-[1px]">
            POSITION: {POSITION_LABELS[position]}
          </div>
        </div>

        {/* 우측: 옵션 패널 */}
        <div className="border border-[var(--line)] bg-white flex flex-col overflow-y-auto" style={{ maxHeight: 660 }}>
          {/* 자수 종류 */}
          <div className="p-5 border-b border-[var(--line)]">
            <div className="font-[var(--font-mono)] text-[10px] text-[var(--red)] tracking-[1.5px] mb-2">
              STEP / 01 ─ 자수 종류
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(EMBROIDERY_TYPES).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => setType(key as EmbroideryTypeKey)}
                  className={`px-3 py-2.5 text-left border text-xs transition-all ${
                    type === key
                      ? "border-[var(--black)] bg-[var(--black)] text-white"
                      : "border-[var(--line)] hover:border-[var(--gray-400)]"
                  }`}
                >
                  <div className="font-bold">{t.name}</div>
                  <div className={`font-[var(--font-mono)] text-[10px] mt-0.5 ${type === key ? "text-white/60" : "text-[var(--gray-500)]"}`}>
                    {t.basePrice.toLocaleString()}원~
                    {t.bulkFree && <span className="ml-1 text-[var(--yellow)]">단체무료</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 자수 위치 */}
          <div className="p-5 border-b border-[var(--line)]">
            <div className="font-[var(--font-mono)] text-[10px] text-[var(--red)] tracking-[1.5px] mb-2">
              STEP / 02 ─ 자수 위치
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(POSITION_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPosition(key as EmbroideryPositionKey)}
                  className={`px-3 py-2 text-xs font-semibold border transition-all ${
                    position === key
                      ? "border-[var(--black)] bg-[var(--black)] text-white"
                      : "border-[var(--line)] hover:border-[var(--gray-400)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 자수 크기 */}
          <div className="p-5 border-b border-[var(--line)]">
            <div className="font-[var(--font-mono)] text-[10px] text-[var(--red)] tracking-[1.5px] mb-2">
              STEP / 03 ─ 자수 크기
            </div>
            <div className="space-y-1.5">
              {Object.entries(SIZE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSize(key as EmbroiderySizeKey)}
                  className={`w-full px-3 py-2 text-left text-xs font-semibold border transition-all flex items-center justify-between ${
                    size === key
                      ? "border-[var(--black)] bg-[var(--black)] text-white"
                      : "border-[var(--line)] hover:border-[var(--gray-400)]"
                  }`}
                >
                  <span>{label}</span>
                  <span className={`font-[var(--font-mono)] text-[10px] ${size === key ? "text-[var(--yellow)]" : "text-[var(--gray-500)]"}`}>
                    {key}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 텍스트 입력 */}
          <div className="p-5 border-b border-[var(--line)]">
            <div className="font-[var(--font-mono)] text-[10px] text-[var(--red)] tracking-[1.5px] mb-2">
              STEP / 04 ─ 텍스트 (선택)
            </div>
            <input
              type="text"
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="회사명, 이름, 슬로건 등"
              className="w-full px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)]"
            />
            {copyrightError && (
              <div className="mt-2 text-[11px] text-[var(--red)] font-[var(--font-mono)] leading-relaxed bg-red-50 p-2">
                ⚠ {copyrightError}
              </div>
            )}
            <p className="text-[10px] text-[var(--gray-400)] mt-2 font-[var(--font-mono)]">
              저작권 보호 캐릭터·로고는 사용 불가
            </p>
          </div>

          {/* 수량 + 가격 */}
          <div className="p-5">
            <div className="font-[var(--font-mono)] text-[10px] text-[var(--red)] tracking-[1.5px] mb-3">
              STEP / 05 ─ 수량 및 가격
            </div>
            <div className="flex items-center border border-[var(--line)] mb-4">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-10 h-10 border-r border-[var(--line)] hover:bg-[var(--gray-50)] flex items-center justify-center text-lg">−</button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="flex-1 text-center font-[var(--font-mono)] font-bold text-sm outline-none"
              />
              <button onClick={() => setQuantity((q) => q + 1)} className="w-10 h-10 border-l border-[var(--line)] hover:bg-[var(--gray-50)] flex items-center justify-center text-lg">+</button>
            </div>

            <div className="border border-[var(--line)] p-4 mb-4">
              <div className="flex justify-between text-xs text-[var(--gray-600)] mb-1.5">
                <span>단가</span>
                <span>{unitPrice.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between text-xs text-[var(--gray-600)] mb-3">
                <span>수량</span>
                <span>{quantity}벌</span>
              </div>
              <div className="flex justify-between items-baseline border-t border-[var(--line)] pt-3">
                <span className="font-bold text-sm">총 자수 비용</span>
                {isBulkFree ? (
                  <div className="text-right">
                    <div className="line-through text-xs text-[var(--gray-500)]">{totalPrice.toLocaleString()}원</div>
                    <div className="font-black text-xl text-[var(--red)]">무료</div>
                    <div className="font-[var(--font-mono)] text-[10px] text-[var(--yellow)]">단체 100벌+ 혜택</div>
                  </div>
                ) : (
                  <span className="font-black text-xl text-[var(--red)]">{totalPrice.toLocaleString()}원</span>
                )}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="space-y-2">
              <button
                onClick={handleSave}
                disabled={!!copyrightError || saving}
                className="w-full bg-[var(--black)] text-white py-3.5 font-bold text-sm tracking-[0.5px] hover:bg-[var(--gray-900)] transition-colors disabled:opacity-40"
              >
                {saving ? "저장 중..." : saved ? "시안 저장 완료 ✓" : "시안 임시 저장"}
              </button>
              <button
                disabled={!!copyrightError}
                className="w-full bg-[var(--red)] text-white py-3.5 font-bold text-sm tracking-[0.5px] hover:bg-[var(--red-dark)] transition-colors disabled:opacity-40"
              >
                이 시안으로 견적 요청 →
              </button>
              <Link
                href="/bulk-order"
                className="block w-full text-center py-3 border border-[var(--line)] text-sm font-semibold hover:border-[var(--black)] transition-colors"
              >
                단체주문 견적
              </Link>
            </div>

            <div className="mt-4 text-[11px] text-[var(--gray-500)] text-center font-[var(--font-mono)] leading-relaxed">
              시안 확정 전 무제한 무료 수정
              <br />
              자수 추가 상품 단순 변심 환불 불가
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
