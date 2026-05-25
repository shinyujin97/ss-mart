"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Option {
  id: string;
  color: string;
  colorHex: string | null;
  size: string;
  sku: string;
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
  productSlug: string;
  productName: string;
  brandName: string;
  imageUrl: string;
  options: Option[];
  colors: ColorInfo[];
  sizes: string[];
  embroideryAvailable: boolean;
  salePrice?: number;
  initialWishlisted?: boolean;
  garmentType?: "top" | "bottom" | "other";
}

export default function ProductOptions({
  productId,
  productName,
  options,
  colors,
  sizes,
  initialWishlisted = false,
}: Props) {
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  async function toggleWishlist() {
    setWishlistLoading(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: wishlisted ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.status === 401) { window.location.href = "/login"; return; }
      if (res.ok) {
        setWishlisted((v) => !v);
        router.refresh();
      }
    } finally {
      setWishlistLoading(false);
    }
  }

  const hasDbOptions = options.length > 0;
  const selectedOption = options.find(
    (o) => o.color === selectedColor && o.size === selectedSize
  );
  const stock = hasDbOptions
    ? (selectedOption ? selectedOption.stockQuantity - selectedOption.reservedQuantity : null)
    : (selectedColor && selectedSize ? 99 : null);

  const inquiryText = [
    `상품: ${productName}`,
    selectedColor ? `색상: ${selectedColor}` : null,
    selectedSize ? `사이즈: ${selectedSize}` : null,
  ].filter(Boolean).join(", ");

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
              onClick={() => {
                if (selectedColor === c.color) { setSelectedColor(null); setSelectedSize(null); }
                else { setSelectedColor(c.color); setSelectedSize(null); }
              }}
              title={c.color}
              className={`relative w-9 h-9 flex-shrink-0 transition-all ${
                selectedColor === c.color
                  ? "ring-2 ring-offset-2 ring-[var(--black)]"
                  : "ring-1 ring-[var(--line)] hover:ring-[var(--gray-500)]"
              }`}
              style={{ background: c.colorHex ?? "#ccc" }}
            >
              {selectedColor === c.color && (
                <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold drop-shadow">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 사이즈 선택 */}
      <div className="mb-6">
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] tracking-[1.5px] mb-2.5 font-semibold">
          ─ SIZE {selectedSize && <span className="text-[var(--black)]">/ {selectedSize}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`w-12 h-10 border text-xs font-bold transition-all ${
                selectedSize === size
                  ? "border-[var(--black)] bg-[var(--black)] text-white"
                  : "border-[var(--line)] hover:border-[var(--black)]"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* 전화 문의 버튼 */}
      <div className="flex gap-2 mb-3">
        <a
          href={`tel:031-430-0497`}
          className="flex-1 bg-[var(--red)] text-white py-4 font-bold text-sm tracking-[0.5px] hover:bg-[var(--red-dark)] transition-colors flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.12 2.2 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.46-.46a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
          </svg>
          전화로 문의하기
        </a>
        {/* 찜하기 */}
        <button
          onClick={toggleWishlist}
          disabled={wishlistLoading}
          title={wishlisted ? "찜 해제" : "찜하기"}
          className={`w-[54px] flex-shrink-0 flex items-center justify-center border-2 transition-all disabled:opacity-50 ${
            wishlisted
              ? "border-[var(--red)] bg-[var(--red)] text-white"
              : "border-[var(--line)] text-[var(--gray-500)] hover:border-[var(--red)] hover:text-[var(--red)]"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24"
            fill={wishlisted ? "currentColor" : "none"}
            stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
        </button>
      </div>

      {/* 문의 안내 */}
      <div className="bg-[var(--gray-50)] border border-[var(--line)] px-4 py-3.5">
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] tracking-[1px] mb-1">
          INQUIRY INFO
        </div>
        <div className="font-[var(--font-display)] text-[var(--black)] text-xl tracking-wider mb-1">
          031-430-0497
        </div>
        <div className="text-xs text-[var(--gray-500)] leading-relaxed">
          {inquiryText
            ? `"${inquiryText}" 으로 문의해 주시면 빠르게 안내해 드립니다.`
            : "색상과 사이즈를 선택 후 전화 주시면 빠르게 안내해 드립니다."}
          <br />
          평일 09:00 – 18:00
        </div>
      </div>
    </div>
  );
}
