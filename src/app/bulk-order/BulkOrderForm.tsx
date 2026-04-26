"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORY_OPTIONS,
  PAYMENT_OPTIONS,
  SIZES,
  type QuoteRequestInput,
} from "@/lib/bulk-order/validation";
import { EMBROIDERY_TYPES, POSITION_LABELS } from "@/constants/embroidery";
import { calculateBulkDiscountRate } from "@/lib/bulk-order/discount";

const INITIAL_SIZES = Object.fromEntries(SIZES.map((s) => [s, 0]));

type EmbroideryOption = "YES" | "NO" | "CONSULT";

export default function BulkOrderForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [quoteNumber, setQuoteNumber] = useState("");
  const [error, setError] = useState("");

  // 폼 상태
  const [companyName, setCompanyName] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerPosition, setManagerPosition] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [sizeQty, setSizeQty] = useState<Record<string, number>>(INITIAL_SIZES);
  const [embOption, setEmbOption] = useState<EmbroideryOption>("CONSULT");
  const [embType, setEmbType] = useState("");
  const [embPosition, setEmbPosition] = useState("");
  const [embContent, setEmbContent] = useState("");
  const [desiredDate, setDesiredDate] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<QuoteRequestInput["paymentMethod"]>("ONE_TIME");
  const [notes, setNotes] = useState("");
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const totalQty = Object.values(sizeQty).reduce((a, b) => a + b, 0);
  const discountRate = calculateBulkDiscountRate(totalQty);

  function toggleCategory(val: string) {
    setCategories((c) => c.includes(val) ? c.filter((x) => x !== val) : [...c, val]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!privacyAgreed) { setError("개인정보 수집 동의가 필요합니다."); return; }
    if (categories.length === 0) { setError("카테고리를 1개 이상 선택하세요."); return; }
    if (totalQty < 100 && !(embOption === "YES" && totalQty >= 50)) {
      setError("단체주문은 100벌 이상이어야 합니다. (자수 추가 시 50벌 이상)");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bulk-order/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName, businessNumber, managerName, managerPosition,
          managerPhone, managerEmail, categories, sizeQuantities: sizeQty,
          embroideryRequested: embOption === "YES",
          embroideryType: embOption === "YES" ? embType || undefined : undefined,
          embroideryPosition: embOption === "YES" ? embPosition || undefined : undefined,
          embroideryContent: embOption === "YES" ? embContent || undefined : undefined,
          desiredDeliveryDate: desiredDate || undefined,
          budgetRange: budgetRange || undefined,
          paymentMethod, additionalNotes: notes || undefined,
          privacyAgreed,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "견적 신청에 실패했습니다.");
        return;
      }
      setQuoteNumber(data.requestNumber);
      setSubmitted(true);
    } catch {
      setError("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  // 접수 완료 화면
  if (submitted) {
    return (
      <div className="bg-white border border-[var(--line)] p-16 text-center">
        <div className="font-[var(--font-display)] text-[80px] text-[var(--gray-100)] leading-none mb-6">DONE</div>
        <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[3px] mb-3">
          ─ QUOTE REQUEST COMPLETE
        </div>
        <h2 className="text-2xl font-black mb-2">견적 신청이 완료되었습니다!</h2>
        <p className="text-sm text-[var(--gray-500)] mb-2">
          견적번호:{" "}
          <span className="font-[var(--font-mono)] text-[var(--black)] font-bold">{quoteNumber}</span>
        </p>
        <p className="text-sm text-[var(--gray-500)] mb-10">
          영업시간 내 <strong>2시간 이내</strong>에 담당 매니저가 연락드립니다.
        </p>
        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
          <button onClick={() => router.push("/")} className="py-4 border-2 border-[var(--black)] text-sm font-bold hover:bg-[var(--gray-50)]">홈으로</button>
          <button onClick={() => router.push("/mypage")} className="py-4 bg-[var(--black)] text-white text-sm font-bold hover:bg-[var(--gray-900)]">마이페이지</button>
        </div>
      </div>
    );
  }

  const SectionHeader = ({ num, title }: { num: string; title: string }) => (
    <div className="flex items-center gap-3 px-5 py-3.5 bg-[var(--gray-50)] border-b border-[var(--line)]">
      <span className="font-[var(--font-mono)] text-[10px] text-[var(--red)] border border-[var(--red)] px-2 py-0.5 font-bold tracking-[1.5px]">
        {num}
      </span>
      <span className="text-sm font-black">{title}</span>
    </div>
  );

  const InputRow = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="grid grid-cols-[140px_1fr] gap-3.5 items-center py-1.5">
      <label className="text-xs font-semibold text-[var(--gray-700)]">
        {label} {required && <span className="text-[var(--red)]">*</span>}
      </label>
      {children}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* SECTION 01: 회사 정보 */}
      <div className="border border-[var(--line)]">
        <SectionHeader num="01 / COMPANY" title="회사 / 담당자 정보" />
        <div className="p-6 space-y-1">
          {[
            { key: "companyName", label: "회사명", value: companyName, setter: setCompanyName, required: true, placeholder: "회사명 입력" },
            { key: "businessNumber", label: "사업자등록번호", value: businessNumber, setter: setBusinessNumber, placeholder: "000-00-00000 (선택)" },
            { key: "managerName", label: "담당자명", value: managerName, setter: setManagerName, required: true, placeholder: "이름" },
            { key: "managerPosition", label: "직책", value: managerPosition, setter: setManagerPosition, placeholder: "직책 (선택)" },
            { key: "managerPhone", label: "연락처", value: managerPhone, setter: setManagerPhone, required: true, placeholder: "010-0000-0000" },
            { key: "managerEmail", label: "이메일", value: managerEmail, setter: setManagerEmail, required: true, placeholder: "견적서 수신 이메일" },
          ].map((f) => (
            <InputRow key={f.key} label={f.label} required={f.required}>
              <input
                type="text"
                value={f.value}
                onChange={(e) => f.setter(e.target.value)}
                placeholder={f.placeholder}
                className="px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)] w-full"
              />
            </InputRow>
          ))}
        </div>
      </div>

      {/* SECTION 02: 카테고리 */}
      <div className="border border-[var(--line)]">
        <SectionHeader num="02 / CATEGORY" title="필요 카테고리 (복수 선택)" />
        <div className="p-6">
          <div className="grid grid-cols-4 gap-2">
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => toggleCategory(cat.value)}
                className={`flex items-center gap-2 px-3 py-2.5 border text-xs font-semibold transition-all ${
                  categories.includes(cat.value)
                    ? "border-[var(--red)] bg-[var(--red)] text-white"
                    : "border-[var(--line)] hover:border-[var(--gray-400)]"
                }`}
              >
                <span className={`w-3.5 h-3.5 border flex items-center justify-center text-[8px] flex-shrink-0 ${
                  categories.includes(cat.value) ? "border-white bg-white text-[var(--red)]" : "border-[var(--gray-300)]"
                }`}>
                  {categories.includes(cat.value) && "✓"}
                </span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 03: 사이즈별 수량 */}
      <div className="border border-[var(--line)]">
        <SectionHeader num="03 / QUANTITY" title="사이즈별 수량 입력" />
        <div className="p-6">
          <div className="grid grid-cols-7 gap-2">
            {SIZES.map((s) => (
              <div key={s} className="border border-[var(--line)] p-3 text-center">
                <div className="font-[var(--font-mono)] text-[11px] text-[var(--gray-700)] tracking-[0.5px] mb-2 font-bold">{s}</div>
                <input
                  type="number"
                  min={0}
                  value={sizeQty[s] || 0}
                  onChange={(e) => setSizeQty((q) => ({ ...q, [s]: Math.max(0, Number(e.target.value)) }))}
                  className="w-full py-1.5 border border-[var(--line)] text-sm text-center font-bold font-[var(--font-mono)] outline-none focus:border-[var(--red)]"
                />
              </div>
            ))}
            {/* TOTAL */}
            <div className="border border-[var(--black)] bg-[var(--black)] p-3 text-center">
              <div className="font-[var(--font-mono)] text-[11px] text-[var(--yellow)] tracking-[0.5px] mb-2 font-bold">TOTAL</div>
              <div className="text-white font-[var(--font-display)] text-xl">{totalQty}</div>
            </div>
          </div>

          {/* 할인율 표시 */}
          {totalQty > 0 && (
            <div className={`mt-3 px-4 py-3 font-[var(--font-mono)] text-sm font-bold flex items-center gap-3 ${
              discountRate > 0 ? "bg-[var(--red)]/5 border border-[var(--red)]/30 text-[var(--red)]" : "bg-[var(--gray-50)] border border-[var(--line)] text-[var(--gray-500)]"
            }`}>
              {discountRate > 0 ? (
                <>
                  <span>▶ 단체할인 적용</span>
                  <span className="text-lg">-{(discountRate * 100).toFixed(0)}%</span>
                  <span className="text-[11px] font-normal opacity-70">({totalQty}벌 기준)</span>
                </>
              ) : (
                <span>100벌 이상부터 단체할인 적용 (현재 {totalQty}벌)</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 04: 자수 옵션 */}
      <div className="border border-[var(--line)]">
        <SectionHeader num="04 / EMBROIDERY" title="자수 / 마킹 옵션" />
        <div className="p-6">
          <div className="grid grid-cols-3 gap-2 mb-5">
            {(["YES", "NO", "CONSULT"] as EmbroideryOption[]).map((opt, i) => (
              <button
                key={opt}
                type="button"
                onClick={() => setEmbOption(opt)}
                className={`py-4 border-2 text-sm font-bold transition-all ${
                  embOption === opt
                    ? "border-[var(--black)] bg-[var(--black)] text-white"
                    : "border-[var(--line)] hover:border-[var(--gray-400)]"
                }`}
              >
                <div className={`font-[var(--font-mono)] text-[10px] mb-1 ${embOption === opt ? "text-[var(--yellow)]" : "text-[var(--gray-400)]"}`}>
                  QUICK / 0{i + 1}
                </div>
                {opt === "YES" ? "자수 추가" : opt === "NO" ? "자수 없음" : "상담 후 결정"}
              </button>
            ))}
          </div>

          {embOption === "YES" && (
            <div className="space-y-3 border border-[var(--line)] p-5 bg-[var(--gray-50)]">
              <InputRow label="자수 종류">
                <select value={embType} onChange={(e) => setEmbType(e.target.value)} className="px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)] w-full bg-white">
                  <option value="">선택하세요</option>
                  {Object.entries(EMBROIDERY_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>{v.name}</option>
                  ))}
                </select>
              </InputRow>
              <InputRow label="자수 위치">
                <select value={embPosition} onChange={(e) => setEmbPosition(e.target.value)} className="px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)] w-full bg-white">
                  <option value="">선택하세요</option>
                  {Object.entries(POSITION_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </InputRow>
              <InputRow label="자수 내용">
                <input type="text" value={embContent} onChange={(e) => setEmbContent(e.target.value)} placeholder="텍스트 또는 로고 설명" className="px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)] w-full" />
              </InputRow>
              {totalQty >= 100 && embType && ["COMPUTER","PATCH","SILK_PRINT"].includes(embType) && (
                <div className="flex items-center gap-2 text-sm text-[var(--red)] font-bold font-[var(--font-mono)]">
                  <span>★</span> 100벌 이상 단체주문 — {EMBROIDERY_TYPES[embType as keyof typeof EMBROIDERY_TYPES]?.name} 무료 적용
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 05: 일정 / 예산 */}
      <div className="border border-[var(--line)]">
        <SectionHeader num="05 / SCHEDULE" title="일정 / 예산 / 결제 방식" />
        <div className="p-6 space-y-1">
          <InputRow label="희망 납기일">
            <input type="date" value={desiredDate} onChange={(e) => setDesiredDate(e.target.value)} className="px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)] w-full" />
          </InputRow>
          <InputRow label="예산 범위">
            <select value={budgetRange} onChange={(e) => setBudgetRange(e.target.value)} className="px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)] w-full bg-white">
              <option value="">선택하세요</option>
              {["100만원 미만","100~300만원","300~500만원","500~1,000만원","1,000만원 이상"].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </InputRow>
          <InputRow label="결제 방식" required>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} className="px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)] w-full bg-white">
              {PAYMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </InputRow>
        </div>
      </div>

      {/* SECTION 06: 추가 요청 */}
      <div className="border border-[var(--line)]">
        <SectionHeader num="06 / NOTES" title="추가 요청사항 (선택)" />
        <div className="p-6">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="특수 요청, 참고사항, 기존 거래 이력 등 자유롭게 입력하세요"
            rows={4}
            className="w-full px-3 py-3 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)] resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* 약관 동의 */}
      <div className="border border-[var(--line)] p-5 space-y-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <span
            onClick={() => setPrivacyAgreed((v) => !v)}
            className={`w-4 h-4 border-2 flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5 ${
              privacyAgreed ? "border-[var(--red)] bg-[var(--red)] text-white" : "border-[var(--gray-300)]"
            }`}
          >
            {privacyAgreed && "✓"}
          </span>
          <span className="text-xs text-[var(--gray-600)] leading-relaxed">
            [필수] 개인정보 수집 및 이용에 동의합니다. 수집 항목: 회사명, 담당자명, 연락처, 이메일. 이용 목적: 단체주문 견적 처리.
          </span>
        </label>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="px-4 py-3 border border-[var(--red)] bg-red-50 text-[var(--red)] text-sm font-[var(--font-mono)]">
          ✕ {error}
        </div>
      )}

      {/* 제출 */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[var(--red)] text-white py-5 font-black text-base tracking-[0.5px] hover:bg-[var(--red-dark)] transition-colors disabled:opacity-60"
      >
        {submitting ? "제출 중..." : "견적 신청하기 →"}
      </button>

      <p className="text-center text-xs text-[var(--gray-500)] font-[var(--font-mono)]">
        영업시간 내 2시간 이내 담당 매니저가 연락드립니다 · 평일 09:00~18:00
      </p>
    </form>
  );
}
