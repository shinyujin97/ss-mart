"use client";

import { useState } from "react";
import Link from "next/link";

interface Option {
  id: string;
  color: string;
  colorHex: string | null;
  size: string;
  stockQuantity: number;
  reservedQuantity: number;
  priceAdjust: number;
}

interface ColorInfo {
  color: string;
  colorHex: string | null;
}

interface Props {
  productId: string;
  options: Option[];
  colors: ColorInfo[];
  sizes: string[];
  embroideryAvailable: boolean;
  salePrice: number;
}

export default function ProductOptions({
  options,
  colors,
  sizes,
  embroideryAvailable,
  salePrice,
}: Props) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const selectedOption = options.find(
    (o) => o.color === selectedColor && o.size === selectedSize
  );
  const stock = selectedOption
    ? selectedOption.stockQuantity - selectedOption.reservedQuantity
    : null;
  const totalPrice = (salePrice + (selectedOption?.priceAdjust ?? 0)) * quantity;

  const isSizeAvailable = (size: string) => {
    if (!selectedColor) return true;
    const opt = options.find((o) => o.color === selectedColor && o.size === size);
    return opt ? opt.stockQuantity - opt.reservedQuantity > 0 : false;
  };

  return (
    <div>
      {/* 색상 선택 */}
      <div className="mb-5">
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] tracking-[1.5px] mb-2.5 font-semibold">
          ─ COLOR {selectedColor && <span className="text-[var(--black)]">/ {selectedColor}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <button
              key={c.color}
              onClick={() => { setSelectedColor(c.color); setSelectedSize(null); }}
              className={`group flex items-center gap-2 px-3 py-2 border text-xs font-semibold transition-all ${
                selectedColor === c.color
                  ? "border-[var(--black)] bg-[var(--black)] text-white"
                  : "border-[var(--line)] hover:border-[var(--black)]"
              }`}
            >
              {c.colorHex && (
                <span
                  className="w-3 h-3 flex-shrink-0"
                  style={{ background: c.colorHex, border: "1px solid rgba(0,0,0,0.1)" }}
                />
              )}
              {c.color}
            </button>
          ))}
        </div>
      </div>

      {/* 사이즈 선택 */}
      <div className="mb-5">
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] tracking-[1.5px] mb-2.5 font-semibold">
          ─ SIZE {selectedSize && <span className="text-[var(--black)]">/ {selectedSize}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => {
            const available = isSizeAvailable(size);
            return (
              <button
                key={size}
                onClick={() => available && setSelectedSize(size)}
                disabled={!available}
                className={`w-12 h-10 border text-xs font-bold transition-all ${
                  selectedSize === size
                    ? "border-[var(--black)] bg-[var(--black)] text-white"
                    : available
                    ? "border-[var(--line)] hover:border-[var(--black)]"
                    : "border-[var(--gray-100)] text-[var(--gray-300)] cursor-not-allowed line-through"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
        {stock !== null && stock <= 5 && stock > 0 && (
          <p className="font-[var(--font-mono)] text-[11px] text-[var(--red)] mt-2">
            ⚠ 잔여 {stock}개
          </p>
        )}
        {stock === 0 && (
          <p className="font-[var(--font-mono)] text-[11px] text-[var(--gray-500)] mt-2">
            품절
          </p>
        )}
      </div>

      {/* 수량 */}
      <div className="mb-6">
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] tracking-[1.5px] mb-2.5 font-semibold">
          ─ QUANTITY
        </div>
        <div className="flex items-center border border-[var(--line)] w-fit">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-10 h-10 text-lg hover:bg-[var(--gray-50)] transition-colors border-r border-[var(--line)]"
          >
            −
          </button>
          <span className="w-12 text-center font-[var(--font-mono)] text-sm font-bold">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => Math.min(stock ?? 99, q + 1))}
            className="w-10 h-10 text-lg hover:bg-[var(--gray-50)] transition-colors border-l border-[var(--line)]"
          >
            +
          </button>
        </div>
      </div>

      {/* 총 금액 */}
      {selectedColor && selectedSize && (
        <div className="flex items-center justify-between py-4 border-t border-b border-[var(--line)] mb-5">
          <span className="font-[var(--font-mono)] text-xs text-[var(--gray-500)] tracking-[1px]">
            TOTAL
          </span>
          <span className="text-2xl font-black text-[var(--red)]">
            {totalPrice.toLocaleString()}원
          </span>
        </div>
      )}

      {/* 버튼 */}
      <div className="flex gap-2">
        <button
          disabled={!selectedColor || !selectedSize || stock === 0}
          className="flex-1 bg-[var(--black)] text-white py-4 font-bold text-sm tracking-[0.5px] hover:bg-[var(--gray-900)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          장바구니 담기
        </button>
        <button
          disabled={!selectedColor || !selectedSize || stock === 0}
          className="flex-1 bg-[var(--red)] text-white py-4 font-bold text-sm tracking-[0.5px] hover:bg-[var(--red-dark)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          바로 구매
        </button>
      </div>

      {/* 자수 토글 */}
      {embroideryAvailable && (
        <Link
          href="/embroidery/simulator"
          className="flex items-center justify-between mt-3 px-4 py-3.5 border border-[var(--yellow)] bg-[var(--yellow)]/10 hover:bg-[var(--yellow)]/20 transition-colors"
        >
          <div>
            <div className="font-[var(--font-mono)] text-[10px] text-[var(--black)] tracking-[1px] font-bold mb-0.5">
              ▶ 자수 / 마킹 추가
            </div>
            <div className="text-xs text-[var(--gray-700)]">
              회사 로고, 이름 자수 추가 가능
            </div>
          </div>
          <span className="font-[var(--font-mono)] text-xs text-[var(--black)] font-bold">
            견적보기 →
          </span>
        </Link>
      )}
    </div>
  );
}
