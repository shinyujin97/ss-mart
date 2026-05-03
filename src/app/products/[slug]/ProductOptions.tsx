"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cartStore";

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
  salePrice: number;
  initialWishlisted?: boolean;
}

export default function ProductOptions({
  productId,
  productSlug,
  productName,
  brandName,
  imageUrl,
  options,
  colors,
  sizes,
  embroideryAvailable,
  salePrice,
  initialWishlisted = false,
}: Props) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
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
        router.refresh(); // 헤더 배지 실시간 업데이트
      }
    } finally {
      setWishlistLoading(false);
    }
  }

  function handleAddToCart() {
    if (!canAddToCart) return;
    addItem({
      id: selectedOption?.id ?? `${productSlug}-${selectedColor}-${selectedSize}`,
      productId: selectedOption?.id ?? productSlug,
      productSlug,
      productName,
      brandName,
      imageUrl,
      color: selectedOption?.color ?? selectedColor ?? "",
      colorHex: selectedOption?.colorHex ?? null,
      size: selectedOption?.size ?? selectedSize ?? "",
      sku: selectedOption?.sku ?? `${productSlug}-${selectedColor}-${selectedSize}`.toUpperCase(),
      unitPrice: salePrice + (selectedOption?.priceAdjust ?? 0),
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    handleAddToCart();
    router.push("/cart");
  }

  const hasDbOptions = options.length > 0;
  const selectedOption = options.find(
    (o) => o.color === selectedColor && o.size === selectedSize
  );
  // DB 옵션 없으면 재고 체크 생략, 선택만 가능하게
  const stock = hasDbOptions
    ? (selectedOption ? selectedOption.stockQuantity - selectedOption.reservedQuantity : null)
    : (selectedColor && selectedSize ? 99 : null);
  const totalPrice = (salePrice + (selectedOption?.priceAdjust ?? 0)) * quantity;

  const isSizeAvailable = (_size: string) => true;

  // 선택 완료 여부 (DB 옵션 없으면 색상+사이즈만 선택돼도 OK)
  const canAddToCart = !!selectedColor && !!selectedSize && (stock === null || stock > 0);

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

      {/* 버튼: 장바구니 | 바로구매 | ♥ */}
      <div className="flex gap-2">
        <button
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          className="flex-1 bg-[var(--black)] text-white py-4 font-bold text-sm tracking-[0.5px] hover:bg-[var(--gray-900)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {added ? "담겼습니다 ✓" : "장바구니 담기"}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={!canAddToCart}
          className="flex-1 bg-[var(--red)] text-white py-4 font-bold text-sm tracking-[0.5px] hover:bg-[var(--red-dark)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          바로 구매
        </button>
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
