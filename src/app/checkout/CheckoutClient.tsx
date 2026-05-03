"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cartStore";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { COMPANY_BANK_ACCOUNT } from "@/constants/bank-account";

interface SavedAddress {
  id: string;
  label: string;
  isDefault: boolean;
  recipientName: string;
  recipientPhone: string;
  zipCode: string;
  address: string;
  addressDetail: string | null;
}

interface Props {
  savedAddresses: SavedAddress[];
}

const EASY_PAY_OPTIONS = [
  { id: "NAVERPAY", label: "네이버페이", icon: "/icons/pay-naver.svg" },
  { id: "KAKAOPAY", label: "카카오페이", icon: "/icons/pay-kakao.svg" },
];

const VIRTUAL_BANKS = [
  "신한은행", "국민은행", "하나은행", "우리은행", "기업은행",
  "농협은행", "카카오뱅크", "토스뱅크", "SC제일은행",
];

export default function CheckoutClient({ savedAddresses }: Props) {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const [payMethod, setPayMethod] = useState<"easy_pay" | "virtual">("virtual");
  const [easyPayProvider, setEasyPayProvider] = useState("NAVERPAY");
  const [virtualBank, setVirtualBank] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [bankTransferResult, setBankTransferResult] = useState<{ bank: string; accountNumber: string; holder: string; deadline: string; amount: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [agreeAll, setAgreeAll] = useState(false);

  // 주문자 정보
  const [orderer, setOrderer] = useState({ name: "", phone: "", email: "" });

  // 배송지
  const defaultAddr = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">(defaultAddr ? defaultAddr.id : "new");
  const [address, setAddress] = useState({
    recipientName: defaultAddr?.recipientName ?? "",
    recipientPhone: defaultAddr?.recipientPhone ?? "",
    zipCode: defaultAddr?.zipCode ?? "",
    address: defaultAddr?.address ?? "",
    addressDetail: defaultAddr?.addressDetail ?? "",
    deliveryMemo: "",
  });


  // 카카오 주소 검색
  const scriptLoaded = useRef(false);
  const [postcodeResult, setPostcodeResult] = useState<{ zipCode: string; address: string } | null>(null);

  useEffect(() => {
    if (scriptLoaded.current || window.daum?.Postcode) { scriptLoaded.current = true; return; }
    const script = document.createElement("script");
    script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.onload = () => { scriptLoaded.current = true; };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!postcodeResult) return;
    setAddress((a) => ({ ...a, zipCode: postcodeResult.zipCode, address: postcodeResult.address, addressDetail: "" }));
    setSelectedAddressId("new");
    setPostcodeResult(null);
  }, [postcodeResult]);

  function openPostcode() {
    if (!window.daum?.Postcode) { alert("주소 검색 서비스를 불러오는 중입니다."); return; }
    new window.daum.Postcode({
      oncomplete: (data) => setPostcodeResult({ zipCode: data.zonecode, address: data.roadAddress || data.jibunAddress }),
    }).open();
  }

  function handleAddressSelect(id: string) {
    setSelectedAddressId(id);
    if (id === "new") {
      setAddress((a) => ({ ...a, recipientName: "", recipientPhone: "", zipCode: "", address: "", addressDetail: "" }));
    } else {
      const addr = savedAddresses.find((a) => a.id === id);
      if (addr) setAddress((a) => ({
        ...a,
        recipientName: addr.recipientName, recipientPhone: addr.recipientPhone,
        zipCode: addr.zipCode, address: addr.address, addressDetail: addr.addressDetail ?? "",
      }));
    }
  }

  function handleAgreeAll(v: boolean) {
    setAgreeAll(v);
    setAgreed(v);
  }

  const total = totalPrice();

  async function handlePayment() {
    if (!agreed) { setError("구매조건 확인 및 결제진행에 동의해 주세요."); return; }
    if (!address.recipientName || !address.recipientPhone || !address.address) {
      setError("배송 정보를 모두 입력해 주세요."); return;
    }
    if (payMethod === "virtual" && !virtualBank) { setError("입금 은행을 선택해 주세요."); return; }
    if (items.length === 0) { setError("장바구니가 비어있습니다."); return; }

    setError("");
    setLoading(true);
    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ optionId: i.id, quantity: i.quantity, embroideryFee: i.embroideryFee ?? 0 })),
          address: { ...address, bankTransferHolder: bankHolder || undefined },
          paymentMethod: payMethod === "virtual" ? "BANK_TRANSFER" : undefined,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) { setError(orderData.error ?? "주문 생성에 실패했습니다."); return; }

      // 무통장 입금 — 계좌 안내 표시
      if (payMethod === "virtual") {
        clearCart();
        setBankTransferResult(orderData.bankTransfer);
        return;
      }


      const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });
      const orderName = items.length === 1 ? items[0].productName : `${items[0].productName} 외 ${items.length - 1}건`;
      const baseParams = {
        amount: { currency: "KRW", value: orderData.amount },
        orderId: orderData.orderId,
        orderName,
        successUrl: `${window.location.origin}/orders/complete/${orderData.orderId}`,
        failUrl: `${window.location.origin}/checkout?error=payment_failed`,
      };

      if (payMethod === "easy_pay") {
        await (payment.requestPayment as any)({ method: "EASY_PAY", easyPay: { easyPayType: easyPayProvider }, ...baseParams });
      } else if (payMethod === "bank") {
        await (payment.requestPayment as any)({ method: "TRANSFER", ...baseParams });
      } else {
        await (payment.requestPayment as any)({ method: "CARD", ...baseParams });
      }
      clearCart();
    } catch (e) {
      console.error(e);
      setError("결제 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) { router.replace("/cart"); return null; }

  return (
    <>
    {/* 무통장 입금 완료 화면 */}
    {bankTransferResult && (
      <div className="max-w-[560px] mx-auto px-6 py-16 text-center">
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--red)] tracking-[2px] mb-2">ORDER COMPLETE</div>
        <h2 className="text-2xl font-black mb-2">주문이 접수되었습니다</h2>
        <p className="text-sm text-[var(--gray-600)] mb-8">아래 계좌로 입금해 주시면 주문이 확정됩니다.</p>

        <div className="bg-[#fffbf0] border-2 border-[#ffd400] p-6 text-left space-y-4 mb-6">
          <div className="font-[var(--font-mono)] text-[10px] text-[#888] tracking-[1.5px]">입금 계좌 정보</div>
          <div className="space-y-3">
            {[
              { label: "은행",     value: bankTransferResult.bank },
              { label: "계좌번호", value: bankTransferResult.accountNumber },
              { label: "예금주",   value: bankTransferResult.holder },
              { label: "입금금액", value: `${bankTransferResult.amount.toLocaleString()}원`, accent: true },
              { label: "입금기한", value: new Date(bankTransferResult.deadline).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }), warn: true },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center border-b border-[#f0e8c0] pb-2 last:border-b-0">
                <span className="text-sm text-[var(--gray-600)]">{row.label}</span>
                <span className={`font-bold text-sm ${row.accent ? "text-[var(--red)] text-lg" : row.warn ? "text-orange-600" : "text-[#111]"}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
          <p className="font-[var(--font-mono)] text-[10px] text-orange-600 font-bold">
            ⚠ 입금 기한 내 미입금 시 주문이 자동 취소됩니다.
          </p>
        </div>

        <button onClick={() => router.push("/mypage/orders")}
          className="w-full bg-[var(--black)] text-white py-3.5 font-bold text-sm hover:bg-[#333] transition-colors">
          주문 내역 확인하기 →
        </button>
      </div>
    )}

    {!bankTransferResult && <div className="max-w-[1340px] mx-auto px-6 py-8">
      <div className="grid grid-cols-[1fr_380px] gap-6 items-start">

        {/* ── 좌측 ── */}
        <div className="space-y-4">

          {/* 주문 상품 정보 */}
          <div className="bg-white border border-[var(--line)]">
            <div className="px-6 py-4 border-b border-[var(--line)]">
              <h2 className="text-base font-black">주문 상품 정보</h2>
            </div>
            <div className="divide-y divide-[var(--line)]">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-16 h-16 bg-[var(--gray-100)] flex-shrink-0 overflow-hidden border border-[var(--line)]">
                    {item.imageUrl && <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] mb-0.5">{item.brandName}</div>
                    <div className="text-sm font-semibold truncate">{item.productName}</div>
                    <div className="text-[11px] text-[var(--gray-500)] mt-0.5">{item.color} / {item.size} / {item.quantity}개</div>
                  </div>
                  <div className="text-sm font-black text-right flex-shrink-0">
                    {(item.unitPrice * item.quantity).toLocaleString()}원
                    {item.embroideryFee ? <div className="text-[11px] text-[var(--red)] font-normal">+자수 {item.embroideryFee.toLocaleString()}원</div> : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 bg-[var(--gray-50)] border-t border-[var(--line)] flex justify-between text-sm">
              <span className="text-[var(--gray-600)]">배송비</span>
              <span className="font-bold text-[var(--red)]">무료</span>
            </div>
          </div>

          {/* 주문자 정보 */}
          <div className="bg-white border border-[var(--line)]">
            <div className="px-6 py-4 border-b border-[var(--line)]">
              <h2 className="text-base font-black">주문자 정보</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { key: "name",  label: "이름",        placeholder: "홍길동",           type: "text"  },
                { key: "phone", label: "연락처",       placeholder: "010-0000-0000",    type: "tel"   },
                { key: "email", label: "이메일",       placeholder: "example@email.com", type: "email" },
              ].map((f) => (
                <div key={f.key} className="grid grid-cols-[110px_1fr] gap-3 items-center">
                  <label className="text-sm text-[var(--gray-700)]">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder}
                    value={orderer[f.key as keyof typeof orderer]}
                    onChange={(e) => setOrderer((o) => ({ ...o, [f.key]: e.target.value }))}
                    className="px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)]" />
                </div>
              ))}
            </div>
          </div>

          {/* 배송 정보 */}
          <div className="bg-white border border-[var(--line)]">
            <div className="px-6 py-4 border-b border-[var(--line)]">
              <h2 className="text-base font-black">배송 정보</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* 저장된 배송지 */}
              {savedAddresses.length > 0 && (
                <div className="grid grid-cols-[110px_1fr] gap-3 items-start">
                  <label className="text-sm text-[var(--gray-700)] pt-2">배송지 선택</label>
                  <div className="flex flex-wrap gap-2">
                    {savedAddresses.map((addr) => (
                      <button key={addr.id} onClick={() => handleAddressSelect(addr.id)}
                        className={`px-3 py-1.5 border text-xs font-semibold transition-colors ${
                          selectedAddressId === addr.id ? "border-[var(--black)] bg-[var(--black)] text-white" : "border-[var(--line)] hover:border-[var(--gray-400)]"
                        }`}>
                        {addr.label}{addr.isDefault ? " (기본)" : ""}
                      </button>
                    ))}
                    <button onClick={() => handleAddressSelect("new")}
                      className={`px-3 py-1.5 border text-xs font-semibold transition-colors ${
                        selectedAddressId === "new" ? "border-[var(--black)] bg-[var(--black)] text-white" : "border-[var(--line)] hover:border-[var(--gray-400)]"
                      }`}>
                      새 배송지
                    </button>
                  </div>
                </div>
              )}

              {/* 받는 분 / 연락처 */}
              {[
                { key: "recipientName",  label: "받는 분", placeholder: "이름",           type: "text" },
                { key: "recipientPhone", label: "연락처",  placeholder: "010-0000-0000",   type: "tel"  },
              ].map((f) => (
                <div key={f.key} className="grid grid-cols-[110px_1fr] gap-3 items-center">
                  <label className="text-sm text-[var(--gray-700)]">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder}
                    value={address[f.key as keyof typeof address]}
                    onChange={(e) => setAddress((a) => ({ ...a, [f.key]: e.target.value }))}
                    className="px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)]" />
                </div>
              ))}

              {/* 주소 검색 */}
              <div className="grid grid-cols-[110px_1fr] gap-3 items-start">
                <label className="text-sm text-[var(--gray-700)] pt-2.5">주소</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input type="text" readOnly placeholder="우편번호" value={address.zipCode}
                      className="w-28 px-3 py-2.5 border border-[var(--line)] text-sm bg-[var(--gray-50)] cursor-default" />
                    <button type="button" onClick={openPostcode}
                      className="flex-1 px-4 py-2.5 bg-[var(--black)] text-white text-sm font-bold hover:bg-[#333] transition-colors">
                      주소 검색
                    </button>
                  </div>
                  <input type="text" readOnly placeholder="도로명 주소" value={address.address}
                    className="w-full px-3 py-2.5 border border-[var(--line)] text-sm bg-[var(--gray-50)] cursor-default" />
                  <input type="text" placeholder="상세 주소" value={address.addressDetail}
                    onChange={(e) => setAddress((a) => ({ ...a, addressDetail: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)]" />
                </div>
              </div>

              {/* 배송 메모 */}
              <div className="grid grid-cols-[110px_1fr] gap-3 items-center">
                <label className="text-sm text-[var(--gray-700)]">배송메모</label>
                <select value={address.deliveryMemo}
                  onChange={(e) => setAddress((a) => ({ ...a, deliveryMemo: e.target.value }))}
                  className="px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)] bg-white">
                  <option value="">배송메모를 선택해 주세요.</option>
                  <option>문 앞에 놓아주세요</option>
                  <option>경비실에 맡겨주세요</option>
                  <option>부재 시 연락 부탁드립니다</option>
                  <option>배송 전 연락 부탁드립니다</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── 우측 (sticky) ── */}
        <div className="sticky top-6 space-y-4">

          {/* 주문 요약 */}
          <div className="bg-white border border-[var(--line)]">
            <div className="px-5 py-4 border-b border-[var(--line)]">
              <h2 className="text-base font-black">주문 요약</h2>
            </div>
            <div className="px-5 py-4 space-y-2.5">
              {[
                { label: "상품가격",  value: `${total.toLocaleString()}원` },
                { label: "배송비",    value: "무료", accent: true },
                { label: "쿠폰 할인", value: "0원" },
                { label: "적립금",    value: "0원" },
              ].map((r) => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-[var(--gray-600)]">{r.label}</span>
                  <span className={`font-semibold ${r.accent ? "text-[var(--red)]" : ""}`}>{r.value}</span>
                </div>
              ))}
              <div className="border-t border-[var(--line)] pt-3 flex justify-between items-baseline">
                <span className="font-bold text-sm">총 주문금액</span>
                <span className="text-xl font-black text-[var(--red)]">
                  {total.toLocaleString()}<span className="text-xs font-normal text-[var(--black)]">원</span>
                </span>
              </div>
              <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-400)]">
                0 포인트 적립예정
              </div>
            </div>
          </div>

          {/* 결제수단 */}
          <div className="bg-white border border-[var(--line)]">
            <div className="px-5 py-4 border-b border-[var(--line)]">
              <h2 className="text-base font-black">결제수단</h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              {/* 라디오 선택 */}
              {([
                { id: "easy_pay", label: "간편결제" },
                { id: "virtual",  label: "무통장입금" },
              ] as const).map((m) => (
                <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="payMethod" value={m.id}
                    checked={payMethod === m.id}
                    onChange={() => setPayMethod(m.id)}
                    className="accent-[var(--black)] w-4 h-4" />
                  <span className="text-sm">{m.label}</span>
                </label>
              ))}

              {/* 간편결제 로고 선택 */}
              {payMethod === "easy_pay" && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {EASY_PAY_OPTIONS.map((ep) => (
                    <button key={ep.id} onClick={() => setEasyPayProvider(ep.id)}
                      className={`relative overflow-hidden border-2 transition-all ${
                        easyPayProvider === ep.id ? "border-[var(--black)]" : "border-[var(--line)] hover:border-[var(--gray-400)]"
                      }`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ep.icon} alt={ep.label} className="w-full h-12 object-cover" />
                      {easyPayProvider === ep.id && (
                        <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-[var(--black)] flex items-center justify-center">
                          <span className="text-white text-[7px] font-bold">✓</span>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* 무통장입금 안내 */}
              {payMethod === "virtual" && (
                <div className="space-y-2 pt-1">
                  <div className="bg-[#fffbf0] border border-[#ffd400]/40 px-4 py-3 text-xs space-y-1.5">
                    <div className="font-bold text-[#111]">입금 계좌 정보</div>
                    <div className="flex justify-between">
                      <span className="text-[var(--gray-600)]">은행</span>
                      <span className="font-bold">{COMPANY_BANK_ACCOUNT.bank}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--gray-600)]">계좌번호</span>
                      <span className="font-bold">{COMPANY_BANK_ACCOUNT.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--gray-600)]">예금주</span>
                      <span className="font-bold">{COMPANY_BANK_ACCOUNT.holder}</span>
                    </div>
                  </div>
                  <input type="text" placeholder="입금자명 (미입력시 주문자명)"
                    value={bankHolder}
                    onChange={(e) => setBankHolder(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)]" />
                  <p className="text-[11px] text-orange-600 font-semibold">
                    주문 후 {COMPANY_BANK_ACCOUNT.deadlineHours}시간 내 미입금 시 자동 취소됩니다.
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* 동의 + 결제 버튼 */}
          <div className="bg-white border border-[var(--line)] px-5 py-4 space-y-3">
            {error && <p className="text-[11px] text-[var(--red)] font-[var(--font-mono)]">✕ {error}</p>}

            <label className="flex items-center gap-2 cursor-pointer" onClick={() => handleAgreeAll(!agreeAll)}>
              <span className={`w-4 h-4 border-2 flex items-center justify-center text-[9px] flex-shrink-0 transition-colors ${agreeAll ? "border-[var(--black)] bg-[var(--black)] text-white" : "border-[var(--gray-300)]"}`}>
                {agreeAll && "✓"}
              </span>
              <span className="text-sm font-bold">전체 동의</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer" onClick={() => setAgreed((v) => !v)}>
              <span className={`w-3.5 h-3.5 border-2 flex items-center justify-center text-[8px] flex-shrink-0 transition-colors ${agreed ? "border-[var(--black)] bg-[var(--black)] text-white" : "border-[var(--gray-300)]"}`}>
                {agreed && "✓"}
              </span>
              <span className="text-xs text-[var(--gray-600)]">
                구매조건 확인 및 결제진행에 동의
              </span>
            </label>

            <button onClick={handlePayment} disabled={loading || !agreed}
              className="w-full bg-[var(--red)] text-white py-4 font-black text-base hover:bg-[var(--red-dark)] transition-colors disabled:opacity-50">
              {loading ? "처리 중..." : "결제하기"}
            </button>

            <p className="font-[var(--font-mono)] text-[9px] text-[var(--gray-400)] text-center">
              전 상품 무료배송 · 평일 14시 이전 결제 시 당일 출고
            </p>
          </div>
        </div>
      </div>
    </div>}
    </>
  );
}
