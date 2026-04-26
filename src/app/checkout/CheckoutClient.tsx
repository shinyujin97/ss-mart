"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cartStore";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";

const PAYMENT_METHODS = [
  { id: "card", label: "신용 / 체크카드", icon: "💳" },
  { id: "easy_pay", label: "간편결제", icon: "📱", sub: "카카오페이 · 네이버페이 · 토스" },
  { id: "bank", label: "계좌이체", icon: "🏦" },
  { id: "virtual", label: "무통장 입금", icon: "📋" },
  { id: "tax", label: "법인 / 세금계산서", icon: "🏢", b2bOnly: true },
];

export default function CheckoutClient() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const [payMethod, setPayMethod] = useState("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [address, setAddress] = useState({
    recipientName: "",
    recipientPhone: "",
    zipCode: "",
    address: "",
    addressDetail: "",
    deliveryMemo: "",
  });

  const total = totalPrice();

  async function handlePayment() {
    if (!address.recipientName || !address.recipientPhone || !address.address) {
      setError("배송지 정보를 모두 입력해주세요.");
      return;
    }
    if (items.length === 0) {
      setError("장바구니가 비어있습니다.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // 1. 서버에서 주문 생성
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            optionId: i.id,
            quantity: i.quantity,
            embroideryFee: i.embroideryFee ?? 0,
          })),
          address,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.error ?? "주문 생성에 실패했습니다.");
        return;
      }

      // 2. 토스페이먼츠 결제창 호출
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });

      const methodMap = {
        card: "CARD",
        easy_pay: "CARD", // 간편결제는 카드 결제창에서 선택
        bank: "TRANSFER",
        virtual: "VIRTUAL_ACCOUNT",
        tax: "CARD",
      } as const;

      const orderName =
        items.length === 1
          ? items[0].productName
          : `${items[0].productName} 외 ${items.length - 1}건`;

      await payment.requestPayment({
        method: methodMap[payMethod as keyof typeof methodMap] ?? "CARD",
        amount: { currency: "KRW", value: orderData.amount },
        orderId: orderData.orderId,
        orderName,
        successUrl: `${window.location.origin}/orders/complete/${orderData.orderId}`,
        failUrl: `${window.location.origin}/checkout?error=payment_failed`,
      } as any);

      clearCart();
    } catch (e) {
      console.error(e);
      setError("결제 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    router.replace("/cart");
    return null;
  }

  return (
    <div className="max-w-[1340px] mx-auto px-6 py-8">
      <div className="grid grid-cols-[1fr_360px] gap-6 items-start">
        {/* 좌측 */}
        <div className="space-y-4">
          {/* 배송지 */}
          <div className="border border-[var(--line)]">
            <div className="flex items-center gap-3 px-5 py-3.5 bg-[var(--gray-50)] border-b border-[var(--line)]">
              <span className="font-[var(--font-mono)] text-[10px] text-[var(--red)] border border-[var(--red)] px-2 py-0.5 font-bold tracking-[1.5px]">
                SECTION / 01
              </span>
              <span className="text-sm font-black">배송지</span>
            </div>
            <div className="p-6 space-y-4">
              {[
                { key: "recipientName", label: "받는 분", placeholder: "이름" },
                { key: "recipientPhone", label: "연락처", placeholder: "010-0000-0000" },
                { key: "zipCode", label: "우편번호", placeholder: "12345" },
                { key: "address", label: "주소", placeholder: "기본 주소" },
                { key: "addressDetail", label: "상세 주소", placeholder: "상세 주소 (선택)" },
                { key: "deliveryMemo", label: "배송 메모", placeholder: "배송 요청사항 (선택)" },
              ].map((f) => (
                <div key={f.key} className="grid grid-cols-[120px_1fr] gap-3 items-center">
                  <label className="text-xs font-semibold text-[var(--gray-700)]">
                    {f.label}
                  </label>
                  <input
                    type="text"
                    placeholder={f.placeholder}
                    value={address[f.key as keyof typeof address]}
                    onChange={(e) => setAddress((a) => ({ ...a, [f.key]: e.target.value }))}
                    className="px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 결제 수단 */}
          <div className="border border-[var(--line)]">
            <div className="flex items-center gap-3 px-5 py-3.5 bg-[var(--gray-50)] border-b border-[var(--line)]">
              <span className="font-[var(--font-mono)] text-[10px] text-[var(--red)] border border-[var(--red)] px-2 py-0.5 font-bold tracking-[1.5px]">
                SECTION / 02
              </span>
              <span className="text-sm font-black">결제 수단</span>
            </div>
            <div className="p-4 grid grid-cols-5 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPayMethod(m.id)}
                  className={`flex flex-col items-center gap-2 py-4 border-2 text-xs font-bold transition-all ${
                    payMethod === m.id
                      ? "border-[var(--black)] bg-[var(--black)] text-white"
                      : "border-[var(--line)] hover:border-[var(--gray-300)]"
                  }`}
                >
                  <span className="text-xl">{m.icon}</span>
                  <span className="text-[10px] text-center leading-tight">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 주문 상품 */}
          <div className="border border-[var(--line)]">
            <div className="flex items-center gap-3 px-5 py-3.5 bg-[var(--gray-50)] border-b border-[var(--line)]">
              <span className="font-[var(--font-mono)] text-[10px] text-[var(--red)] border border-[var(--red)] px-2 py-0.5 font-bold tracking-[1.5px]">
                SECTION / 03
              </span>
              <span className="text-sm font-black">주문 상품 ({items.length}개)</span>
            </div>
            <div className="divide-y divide-[var(--line)]">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4">
                  <div className="w-14 h-14 bg-[var(--gray-100)] flex-shrink-0 overflow-hidden">
                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] mb-0.5">{item.brandName}</div>
                    <div className="text-sm font-semibold truncate">{item.productName}</div>
                    <div className="text-[11px] text-[var(--gray-500)] mt-0.5">
                      {item.color} / {item.size} / {item.quantity}개
                    </div>
                  </div>
                  <div className="text-sm font-black flex-shrink-0">
                    {(item.unitPrice * item.quantity).toLocaleString()}원
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 우측: 결제 요약 */}
        <div className="sticky top-6 space-y-0">
          <div className="border border-[var(--line)]">
            <div className="bg-[var(--black)] text-white px-5 py-4">
              <div className="font-[var(--font-mono)] text-[10px] text-white/60 tracking-[1.5px] mb-1">
                PAYMENT SUMMARY
              </div>
              <div className="text-lg font-black">최종 결제 금액</div>
            </div>
            <div className="px-5 py-4 space-y-3 border-b border-[var(--line)]">
              {[
                { label: "상품 금액", value: `${total.toLocaleString()}원` },
                { label: "배송비", value: "무료", green: true },
                { label: "적립금 사용", value: "0원" },
                { label: "쿠폰 할인", value: "0원" },
              ].map((r) => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-[var(--gray-600)]">{r.label}</span>
                  <span className={`font-semibold ${r.green ? "text-[var(--red)]" : ""}`}>{r.value}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-b border-[var(--line)]">
              <div className="flex justify-between items-baseline">
                <span className="font-bold">결제 금액</span>
                <span className="text-2xl font-black text-[var(--red)]">
                  {total.toLocaleString()}<span className="text-sm font-normal text-[var(--black)]">원</span>
                </span>
              </div>
            </div>
            <div className="p-5">
              {error && (
                <p className="text-[11px] text-[var(--red)] font-[var(--font-mono)] mb-3">✕ {error}</p>
              )}
              {/* 약관 동의 */}
              <label className="flex items-start gap-2 mb-4 cursor-pointer">
                <span className="w-4 h-4 border-2 border-[var(--black)] flex items-center justify-center text-[9px] font-bold mt-0.5 flex-shrink-0">✓</span>
                <span className="text-[11px] text-[var(--gray-600)] leading-relaxed">
                  주문 내용을 확인하였으며 이용약관, 개인정보 처리방침에 동의합니다.
                </span>
              </label>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-[var(--red)] text-white py-4 font-black text-sm tracking-[0.5px] hover:bg-[var(--red-dark)] transition-colors disabled:opacity-60"
              >
                {loading ? "처리 중..." : `${total.toLocaleString()}원 결제하기 →`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
