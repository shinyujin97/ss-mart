"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface SavedAddress {
  id: string;
  label: string;
  recipientName: string;
  recipientPhone: string;
  zipCode: string;
  address: string;
  addressDetail: string | null;
  isDefault: boolean;
}

interface ShippingForm {
  name: string;
  phone: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  request: string;
}

interface Props {
  designId: string;
  quotePrice: number;
  quoteColorCount: number | null;
  quoteDeliveryDays: number | null;
  quoteMessage: string | null;
  originalPrice: number;
  typeName: string;
  posLabel: string;
  sizeLabel: string;
  sizeCm: string;
  quantity: number;
  savedAddresses: SavedAddress[];
}


export default function QuoteActions({
  designId, quotePrice, quoteColorCount, quoteDeliveryDays,
  quoteMessage, originalPrice,
  typeName, posLabel, sizeLabel, sizeCm, quantity,
  savedAddresses,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<null | "approve" | "reject">(null);
  const [loading, setLoading] = useState(false);
  const scriptLoaded = useRef(false);
  const [postcodeResult, setPostcodeResult] = useState<{ zipCode: string; address: string } | null>(null);

  // 주소 검색 결과를 React 사이클 안에서 처리
  useEffect(() => {
    if (!postcodeResult) return;
    setForm((f) => ({ ...f, zipCode: postcodeResult.zipCode, address: postcodeResult.address, addressDetail: "" }));
    setSelectedAddressId("new");
    setPostcodeResult(null);
  }, [postcodeResult]);

  const defaultAddr = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">(
    defaultAddr ? defaultAddr.id : "new"
  );
  const [form, setForm] = useState<ShippingForm>({
    name: defaultAddr?.recipientName ?? "",
    phone: defaultAddr?.recipientPhone ?? "",
    zipCode: defaultAddr?.zipCode ?? "",
    address: defaultAddr?.address ?? "",
    addressDetail: defaultAddr?.addressDetail ?? "",
    request: "",
  });

  // 카카오 우편번호 스크립트 로드
  useEffect(() => {
    if (scriptLoaded.current || typeof window === "undefined") return;
    if (window.daum?.Postcode) { scriptLoaded.current = true; return; }
    const script = document.createElement("script");
    script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.onload = () => { scriptLoaded.current = true; };
    document.head.appendChild(script);
  }, []);

  function openPostcode() {
    if (!window.daum?.Postcode) { alert("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해 주세요."); return; }
    new window.daum.Postcode({
      oncomplete: (data) => {
        setPostcodeResult({
          zipCode: data.zonecode,
          address: data.roadAddress || data.jibunAddress,
        });
      },
    }).open();
  }

  function handleAddressSelect(id: string) {
    setSelectedAddressId(id);
    if (id === "new") {
      setForm((f) => ({ ...f, name: "", phone: "", zipCode: "", address: "", addressDetail: "" }));
    } else {
      const addr = savedAddresses.find((a) => a.id === id);
      if (addr) {
        setForm((f) => ({
          ...f,
          name: addr.recipientName,
          phone: addr.recipientPhone,
          zipCode: addr.zipCode,
          address: addr.address,
          addressDetail: addr.addressDetail ?? "",
        }));
      }
    }
  }

  async function handleApprove() {
    if (!form.name.trim() || !form.phone.trim() || !form.zipCode.trim() || !form.address.trim()) {
      alert("받는 분, 연락처, 주소는 필수 항목입니다.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/embroidery/designs/${designId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE_QUOTE",
          shipping: {
            name: form.name,
            phone: form.phone,
            zipCode: form.zipCode,
            address: form.address,
            addressDetail: form.addressDetail || undefined,
            request: form.request || undefined,
          },
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? "처리 실패"); return; }
      router.refresh();
    } finally { setLoading(false); }
  }

  async function handleReject() {
    setLoading(true);
    try {
      const res = await fetch(`/api/embroidery/designs/${designId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT_QUOTE" }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? "처리 실패"); return; }
      router.refresh();
    } finally { setLoading(false); }
  }

  return (
    <div className="border-b border-[#e0e0e0]">
      {/* 견적서 */}
      <div className="px-5 py-4 bg-[#fffbf0] border-b border-[#ffd400]/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-[var(--font-mono)] text-[10px] text-[#888] tracking-[1.5px]">견적서</div>
          <span className="font-[var(--font-mono)] text-[10px] text-[#92400e] bg-yellow-100 border border-yellow-200 px-2 py-0.5">
            확인 대기
          </span>
        </div>

        <div className="border border-[#e5e5e5] bg-white divide-y divide-[#f0f0f0]">
          {[
            { label: "자수 종류", val: typeName },
            { label: "자수 위치", val: posLabel },
            { label: "자수 크기", val: `${sizeLabel}${sizeCm ? ` (${sizeCm})` : ""}` },
            { label: "수량",      val: `${quantity}벌` },
            ...(quoteDeliveryDays ? [{ label: "예상 납기", val: `${quoteDeliveryDays}일` }] : []),
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between px-3 py-2">
              <span className="font-[var(--font-mono)] text-[10px] text-[#999]">{item.label}</span>
              <span className="text-[12px] font-bold text-[#333]">{item.val}</span>
            </div>
          ))}
          {quoteColorCount && (
            <div className="flex items-center justify-between px-3 py-2">
              <span className="font-[var(--font-mono)] text-[10px] text-[#999]">도수 (컬러수)</span>
              <span className="text-[12px] font-bold text-[#333]">{quoteColorCount}도</span>
            </div>
          )}
        </div>

        <div className="border border-[#c8161d]/20 bg-white px-4 py-3">
          <div className="font-[var(--font-mono)] text-[10px] text-[#888] mb-1">
            견적 금액{quoteColorCount ? ` (${quoteColorCount}도 기준)` : ""}
          </div>
          <div className="flex items-end gap-3">
            <div className="font-[var(--font-display)] text-3xl text-[#c8161d]">
              {quotePrice.toLocaleString()}원
            </div>
            {quotePrice !== originalPrice && (
              <div className="font-[var(--font-mono)] text-[11px] text-[#bbb] line-through pb-1">
                예상 {originalPrice.toLocaleString()}원
              </div>
            )}
          </div>
        </div>

        {quoteMessage && (
          <div className="bg-white border border-[#e5e5e5] px-4 py-3">
            <div className="font-[var(--font-mono)] text-[10px] text-[#aaa] mb-1.5">담당자 안내</div>
            <p className="text-sm text-[#333] leading-relaxed whitespace-pre-wrap">{quoteMessage}</p>
          </div>
        )}
      </div>

      {/* 버튼 */}
      {mode === null && (
        <div className="grid grid-cols-2 divide-x divide-[#e0e0e0]">
          <button onClick={() => setMode("reject")}
            className="py-4 text-sm font-bold text-[#888] hover:bg-[#f4f4f4] transition-colors">
            견적 거절하기
          </button>
          <button onClick={() => setMode("approve")}
            className="py-4 text-sm font-bold text-white bg-[#c8161d] hover:bg-[#9c0e15] transition-colors">
            견적 승인하기 ✓
          </button>
        </div>
      )}

      {/* 배송지 입력 */}
      {mode === "approve" && (
        <div className="p-5 space-y-4">
          <div className="font-[var(--font-mono)] text-[11px] text-[#111] font-bold tracking-[1px]">배송지 입력</div>

          {/* 저장된 주소 선택 */}
          {savedAddresses.length > 0 && (
            <div className="space-y-1.5">
              {savedAddresses.map((addr) => (
                <label key={addr.id}
                  className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                    selectedAddressId === addr.id ? "border-[#c8161d] bg-red-50" : "border-[#e0e0e0] hover:border-[#aaa]"
                  }`}>
                  <input type="radio" name="addr" value={addr.id}
                    checked={selectedAddressId === addr.id}
                    onChange={() => handleAddressSelect(addr.id)}
                    className="mt-0.5 accent-[#c8161d]" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[12px] font-bold text-[#111]">{addr.label}</span>
                      {addr.isDefault && <span className="font-[var(--font-mono)] text-[9px] bg-[#111] text-white px-1.5 py-0.5">기본</span>}
                    </div>
                    <div className="text-[12px] text-[#555]">{addr.recipientName} · {addr.recipientPhone}</div>
                    <div className="text-[11px] text-[#888] truncate">[{addr.zipCode}] {addr.address}</div>
                  </div>
                </label>
              ))}
              <label className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                selectedAddressId === "new" ? "border-[#c8161d] bg-red-50" : "border-[#e0e0e0] hover:border-[#aaa]"
              }`}>
                <input type="radio" name="addr" value="new"
                  checked={selectedAddressId === "new"}
                  onChange={() => handleAddressSelect("new")}
                  className="accent-[#c8161d]" />
                <span className="text-[12px] font-bold text-[#555]">새 배송지 직접 입력</span>
              </label>
            </div>
          )}

          {/* 주소 입력 폼 */}
          {(savedAddresses.length === 0 || selectedAddressId === "new") && (
            <div className="space-y-3">
              {/* 받는 분 */}
              <div>
                <label className="font-[var(--font-mono)] text-[10px] text-[#888] block mb-1">받는 분 *</label>
                <input type="text" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="홍길동"
                  className="w-full border border-[#e0e0e0] px-3 py-2.5 text-sm outline-none focus:border-[#c8161d] placeholder:text-[#ccc]" />
              </div>
              {/* 연락처 */}
              <div>
                <label className="font-[var(--font-mono)] text-[10px] text-[#888] block mb-1">연락처 *</label>
                <input type="tel" value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="010-0000-0000"
                  className="w-full border border-[#e0e0e0] px-3 py-2.5 text-sm outline-none focus:border-[#c8161d] placeholder:text-[#ccc]" />
              </div>
              {/* 주소 검색 */}
              <div>
                <label className="font-[var(--font-mono)] text-[10px] text-[#888] block mb-1">주소 *</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={form.zipCode} readOnly
                    placeholder="우편번호"
                    className="w-28 border border-[#e0e0e0] px-3 py-2.5 text-sm bg-[#f8f8f8] text-[#555] placeholder:text-[#ccc] cursor-default" />
                  <button type="button" onClick={openPostcode}
                    className="flex-1 border border-[#111] bg-[#111] text-white text-sm font-bold hover:bg-[#333] transition-colors py-2.5">
                    주소 검색
                  </button>
                </div>
                <input type="text" value={form.address} readOnly
                  placeholder="도로명 주소"
                  className="w-full border border-[#e0e0e0] px-3 py-2.5 text-sm mb-2 bg-[#f8f8f8] text-[#555] placeholder:text-[#ccc] cursor-default" />
                <input type="text" value={form.addressDetail}
                  onChange={(e) => setForm((f) => ({ ...f, addressDetail: e.target.value }))}
                  placeholder="상세주소 (동/호수 등)"
                  className="w-full border border-[#e0e0e0] px-3 py-2.5 text-sm outline-none focus:border-[#c8161d] placeholder:text-[#ccc]" />
              </div>
            </div>
          )}

          {/* 저장 주소 선택 시 이름·연락처 입력 */}
          {savedAddresses.length > 0 && selectedAddressId !== "new" && (
            <div className="space-y-3">
              <div>
                <label className="font-[var(--font-mono)] text-[10px] text-[#888] block mb-1">받는 분 *</label>
                <input type="text" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-[#e0e0e0] px-3 py-2.5 text-sm outline-none focus:border-[#c8161d]" />
              </div>
              <div>
                <label className="font-[var(--font-mono)] text-[10px] text-[#888] block mb-1">연락처 *</label>
                <input type="tel" value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-[#e0e0e0] px-3 py-2.5 text-sm outline-none focus:border-[#c8161d]" />
              </div>
              <div className="bg-[#f8f8f8] border border-[#e0e0e0] px-3 py-2.5 text-sm text-[#555]">
                [{form.zipCode}] {form.address} {form.addressDetail}
              </div>
            </div>
          )}

          {/* 배송 요청사항 */}
          <div>
            <label className="font-[var(--font-mono)] text-[10px] text-[#888] block mb-1">배송 요청사항 (선택)</label>
            <textarea value={form.request}
              onChange={(e) => setForm((f) => ({ ...f, request: e.target.value }))}
              rows={2}
              placeholder="문 앞에 놓아주세요 / 부재 시 연락 부탁드립니다 등"
              className="w-full border border-[#e0e0e0] px-3 py-2.5 text-sm outline-none focus:border-[#c8161d] resize-none placeholder:text-[#ccc]" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setMode(null)}
              className="py-3 text-sm text-[#888] border border-[#e0e0e0] hover:border-[#999] transition-colors">
              취소
            </button>
            <button onClick={handleApprove} disabled={loading}
              className="py-3 text-sm font-bold text-white bg-[#c8161d] hover:bg-[#9c0e15] transition-colors disabled:opacity-50">
              {loading ? "처리 중..." : "견적 승인 완료"}
            </button>
          </div>
          <p className="font-[var(--font-mono)] text-[10px] text-[#bbb] text-center">
            승인 후 제작이 시작되며 완료 시 입력한 주소로 발송됩니다.
          </p>
        </div>
      )}

      {/* 거절 */}
      {mode === "reject" && (
        <div className="p-5 space-y-3">
          <p className="text-sm text-[#333]">견적을 거절하시겠습니까?<br />
            <span className="text-xs text-[#888]">거절 시 담당자가 재견적을 검토합니다.</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setMode(null)}
              className="py-3 text-sm text-[#888] border border-[#e0e0e0] hover:border-[#999] transition-colors">
              취소
            </button>
            <button onClick={handleReject} disabled={loading}
              className="py-3 text-sm font-bold text-[#333] border border-[#333] hover:bg-[#333] hover:text-white transition-colors disabled:opacity-50">
              {loading ? "처리 중..." : "거절"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
