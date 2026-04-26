"use client";

import { useCartStore } from "@/lib/cartStore";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CartClient() {
  const { items, removeItem, updateQuantity, totalPrice } = useCartStore();
  const router = useRouter();

  // 브랜드별 그룹
  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.brandName]) acc[item.brandName] = [];
    acc[item.brandName].push(item);
    return acc;
  }, {});

  const shipping = 0;
  const total = totalPrice();
  const pointsEarned = Math.floor(total * 0.01);

  if (items.length === 0) {
    return (
      <div className="max-w-[1340px] mx-auto px-6 py-24 text-center">
        <div className="font-[var(--font-display)] text-[80px] text-[var(--gray-100)] leading-none mb-6">
          EMPTY
        </div>
        <div className="font-[var(--font-mono)] text-[11px] text-[var(--gray-400)] tracking-[3px] mb-4">
          ─ CART IS EMPTY
        </div>
        <p className="text-sm text-[var(--gray-500)] mb-8">
          장바구니에 담긴 상품이 없습니다.
        </p>
        <Link
          href="/"
          className="inline-block bg-[var(--black)] text-white px-8 py-4 font-bold text-sm tracking-[0.5px] hover:bg-[var(--gray-900)] transition-colors"
        >
          쇼핑 계속하기 →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1340px] mx-auto px-6 py-8">
      <div className="grid grid-cols-[1fr_340px] gap-6 items-start">
        {/* 좌측: 상품 목록 */}
        <div>
          {Object.entries(grouped).map(([brand, brandItems]) => (
            <div key={brand} className="border border-[var(--line)] mb-3">
              {/* 브랜드 헤더 */}
              <div className="flex items-center gap-3 px-5 py-3 bg-[var(--gray-50)] border-b border-[var(--line)]">
                <span className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[1.5px] font-bold">
                  {brand}
                </span>
                <span className="text-xs text-[var(--gray-500)]">
                  {brandItems.length}개 상품
                </span>
              </div>

              {/* 상품 목록 */}
              {brandItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="grid items-start gap-[18px] p-[18px] border-b border-[var(--line)] last:border-b-0"
                  style={{ gridTemplateColumns: "100px 1fr auto" }}
                >
                  {/* 이미지 */}
                  <div className="relative w-[100px] h-[100px] bg-[var(--gray-100)] flex-shrink-0">
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <span className="absolute top-1.5 left-1.5 bg-black/70 text-white font-[var(--font-mono)] text-[9px] px-1.5 py-0.5">
                      / {String(idx + 1).padStart(3, "0")}
                    </span>
                  </div>

                  {/* 상품 정보 */}
                  <div>
                    <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] tracking-[1px] mb-1">
                      {item.brandName}
                    </div>
                    <div className="text-sm font-semibold leading-snug mb-2">
                      <Link
                        href={`/products/${item.productSlug}`}
                        className="hover:text-[var(--red)] transition-colors"
                      >
                        {item.productName}
                      </Link>
                    </div>
                    <div className="text-[11px] text-[var(--gray-500)] mb-3">
                      <span>색상: <strong className="text-[var(--gray-700)]">{item.color}</strong></span>
                      <span className="mx-2 text-[var(--gray-300)]">|</span>
                      <span>사이즈: <strong className="text-[var(--gray-700)]">{item.size}</strong></span>
                    </div>

                    {/* 수량 조절 */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-[var(--line)]">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 text-base hover:bg-[var(--gray-50)] transition-colors border-r border-[var(--line)] flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="w-10 text-center font-[var(--font-mono)] text-xs font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 text-base hover:bg-[var(--gray-50)] transition-colors border-l border-[var(--line)] flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex gap-1">
                        <button className="px-2.5 py-1.5 text-[10px] font-semibold border border-[var(--line)] hover:border-[var(--black)] transition-colors font-[var(--font-mono)] tracking-[0.3px]">
                          옵션변경
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="px-2.5 py-1.5 text-[10px] font-semibold border border-[var(--line)] hover:border-[var(--red)] hover:text-[var(--red)] transition-colors font-[var(--font-mono)] tracking-[0.3px]"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 가격 */}
                  <div className="text-right min-w-[120px]">
                    {item.unitPrice !== item.unitPrice && (
                      <div className="text-[11px] text-[var(--gray-500)] line-through mb-0.5">
                        {(item.unitPrice * item.quantity).toLocaleString()}원
                      </div>
                    )}
                    <div className="text-lg font-black text-[var(--black)]">
                      {(item.unitPrice * item.quantity).toLocaleString()}
                      <span className="text-sm font-normal">원</span>
                    </div>
                    {item.embroideryFee ? (
                      <div className="text-[10px] text-[var(--red)] font-[var(--font-mono)] mt-1">
                        + 자수 {item.embroideryFee.toLocaleString()}원
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* 단체주문 배너 */}
          <Link
            href="/bulk-order"
            className="flex items-center justify-between p-5 border border-[var(--yellow)] bg-[var(--yellow)]/5 hover:bg-[var(--yellow)]/10 transition-colors"
          >
            <div>
              <div className="font-[var(--font-mono)] text-[10px] text-[var(--black)] tracking-[1px] font-bold mb-1">
                ▶ BULK ORDER / 100벌 이상
              </div>
              <div className="text-sm font-bold">
                단체주문은 최대 30% 추가 할인 + 자수 무료
              </div>
            </div>
            <span className="font-[var(--font-mono)] text-xs font-bold whitespace-nowrap ml-4">
              견적 신청 →
            </span>
          </Link>
        </div>

        {/* 우측: 결제 요약 (sticky) */}
        <div className="sticky top-6">
          <div className="border border-[var(--line)]">
            {/* 헤더 */}
            <div className="bg-[var(--black)] text-white px-5 py-4">
              <div className="font-[var(--font-mono)] text-[10px] tracking-[1.5px] text-white/60 mb-1">
                ORDER SUMMARY
              </div>
              <div className="text-lg font-black">결제 예정 금액</div>
            </div>

            {/* 금액 내역 */}
            <div className="px-5 py-4 space-y-3 border-b border-[var(--line)]">
              {[
                { label: "상품 금액", value: `${total.toLocaleString()}원` },
                { label: "배송비", value: "무료", red: false, green: true },
                { label: "할인 금액", value: "0원" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-[var(--gray-600)]">{row.label}</span>
                  <span className={`font-semibold ${row.green ? "text-[var(--red)]" : ""}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* 총합 */}
            <div className="px-5 py-4 border-b border-[var(--line)]">
              <div className="flex justify-between items-baseline">
                <span className="font-bold">총 결제 금액</span>
                <span className="text-2xl font-black text-[var(--red)]">
                  {(total + shipping).toLocaleString()}
                  <span className="text-sm font-normal text-[var(--black)]">원</span>
                </span>
              </div>
              <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] mt-1 text-right">
                예상 적립: {pointsEarned.toLocaleString()}P
              </div>
            </div>

            {/* 결제 버튼 */}
            <div className="p-5 space-y-2">
              <button
                onClick={() => router.push("/checkout")}
                className="w-full bg-[var(--red)] text-white py-4 font-black text-sm tracking-[0.5px] hover:bg-[var(--red-dark)] transition-colors"
              >
                주문하기 ({items.length}개) →
              </button>
              <Link
                href="/"
                className="block w-full text-center py-3 border border-[var(--line)] text-sm font-semibold hover:border-[var(--black)] transition-colors"
              >
                쇼핑 계속하기
              </Link>
            </div>
          </div>

          {/* 혜택 안내 */}
          <div className="border border-[var(--line)] border-t-0 px-5 py-4 bg-[var(--gray-50)]">
            {[
              "전 상품 무료 배송 (제주 포함)",
              "평일 14시 이전 주문 당일 출고",
              "7일 이내 무료 반품 (자수 제외)",
            ].map((text) => (
              <div key={text} className="flex items-center gap-2 text-xs text-[var(--gray-600)] py-1">
                <span className="text-[var(--red)] text-[10px]">✓</span>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
