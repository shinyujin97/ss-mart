"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { calculateQuotePrice } from "@/lib/embroidery/pricing";
import type { EmbroideryTypeKey, EmbroiderySizeKey, EmbroideryPositionKey } from "@/constants/embroidery";

const STATUS_LABELS: Record<string, string> = {
  DRAFT:               "임시 저장",
  REVIEW_PENDING:      "관리자 검토 대기",
  QUOTE_SENT:          "견적 확인 대기",
  QUOTE_APPROVED:      "견적 승인 완료",
  QUOTE_REJECTED:      "견적 거절",
  REVIEW_IN_PROGRESS:  "시안 제작 중",
  CUSTOMER_REVIEW:     "시안 확인 대기",
  REVISION_REQUESTED:  "수정 요청",
  CONFIRMED:           "시안 확정",
  IN_PRODUCTION:       "자수 작업 중",
  COMPLETED:           "작업 완료",
  CANCELLED:           "취소",
  REJECTED:            "반려",
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT:               "text-[#555] bg-[#222]",
  REVIEW_PENDING:      "text-[#ffd400] bg-yellow-900/30",
  QUOTE_SENT:          "text-cyan-300 bg-cyan-900/30",
  QUOTE_APPROVED:      "text-green-300 bg-green-900/30",
  QUOTE_REJECTED:      "text-[#c8161d] bg-[#c8161d]/10",
  REVIEW_IN_PROGRESS:  "text-orange-300 bg-orange-900/30",
  CUSTOMER_REVIEW:     "text-blue-300 bg-blue-900/30",
  REVISION_REQUESTED:  "text-orange-300 bg-orange-900/30",
  CONFIRMED:           "text-green-300 bg-green-900/30",
  IN_PRODUCTION:       "text-purple-300 bg-purple-900/30",
  COMPLETED:           "text-green-400 bg-green-900/20",
  CANCELLED:           "text-[#444] bg-[#1a1a1a]",
  REJECTED:            "text-[#c8161d] bg-[#c8161d]/10",
};

interface Action {
  label: string;
  nextStatus: string;
  style: string;
  desc: string;
  requiresDraft?: boolean;
  requiresQuote?: boolean;
}

const ACTIONS: Record<string, Action[]> = {
  REVIEW_PENDING: [
    { label: "견적서 작성 후 발송", nextStatus: "QUOTE_SENT", style: "bg-cyan-900/40 text-cyan-300 border border-cyan-700/40 hover:bg-cyan-900/60", desc: "견적 금액과 안내 메시지를 작성해 고객에게 발송합니다.", requiresQuote: true },
    { label: "저작권 문제로 반려", nextStatus: "REJECTED", style: "bg-[#c8161d]/10 text-[#c8161d] border border-[#c8161d]/30 hover:bg-[#c8161d]/20", desc: "저작권 등 문제로 접수를 반려합니다." },
  ],
  QUOTE_APPROVED: [
    { label: "시안 제작 시작", nextStatus: "REVIEW_IN_PROGRESS", style: "bg-[#222] text-white border border-[#3a3a3a] hover:bg-[#2a2a2a] hover:border-[#555]", desc: "고객 견적이 승인되었습니다. 시안 제작을 시작합니다." },
  ],
  QUOTE_REJECTED: [
    { label: "재견적 발송", nextStatus: "REVIEW_PENDING", style: "bg-cyan-900/40 text-cyan-300 border border-cyan-700/40 hover:bg-cyan-900/60", desc: "견적을 재조정해 다시 발송합니다." },
    { label: "접수 취소", nextStatus: "CANCELLED", style: "bg-[#222] text-[#555] border border-[#2a2a2a] hover:border-[#3a3a3a] hover:text-[#888]", desc: "해당 시안 접수를 취소합니다." },
  ],
  REVIEW_IN_PROGRESS: [
    { label: "시안 이미지 업로드 후 고객 전달", nextStatus: "CUSTOMER_REVIEW", style: "bg-blue-900/40 text-blue-300 border border-blue-700/40 hover:bg-blue-900/60", desc: "완성된 시안 이미지를 업로드하고 고객에게 전달합니다.", requiresDraft: true },
    { label: "저작권 문제로 반려", nextStatus: "REJECTED", style: "bg-[#c8161d]/10 text-[#c8161d] border border-[#c8161d]/30 hover:bg-[#c8161d]/20", desc: "저작권 등 문제로 작업을 반려합니다." },
  ],
  CUSTOMER_REVIEW: [],
  REVISION_REQUESTED: [
    { label: "수정 시안 이미지 업로드 후 재전달", nextStatus: "CUSTOMER_REVIEW", style: "bg-blue-900/40 text-blue-300 border border-blue-700/40 hover:bg-blue-900/60", desc: "수정된 시안 이미지를 업로드하고 재전달합니다.", requiresDraft: true },
  ],
  CONFIRMED: [
    { label: "제작 시작", nextStatus: "IN_PRODUCTION", style: "bg-purple-900/40 text-purple-300 border border-purple-700/40 hover:bg-purple-900/60", desc: "자수 제작 작업을 시작합니다." },
  ],
  IN_PRODUCTION: [
    { label: "작업 완료 처리", nextStatus: "COMPLETED", style: "bg-green-900/40 text-green-300 border border-green-700/40 hover:bg-green-900/60", desc: "자수 제작이 완료되었습니다." },
    { label: "취소 처리", nextStatus: "CANCELLED", style: "bg-[#222] text-[#555] border border-[#2a2a2a] hover:border-[#3a3a3a] hover:text-[#888]", desc: "주문을 취소합니다." },
  ],
};

interface Props {
  id: string;
  currentStatus: string;
  currentNotes: string | null;
  currentQuotePrice?: number | null;
  currentQuoteColorCount?: number | null;
  currentQuoteDeliveryDays?: number | null;
  // 디자인 스펙 (견적서 자동 채움)
  designSpec: {
    typeName: string;
    posLabel: string;
    sizeLabel: string;
    sizeCm: string;
    quantity: number;
    estimatedPrice: number;
    // 자동 계산용 raw 값
    type: EmbroideryTypeKey;
    size: EmbroiderySizeKey;
    positions: EmbroideryPositionKey[];
  };
}

export default function StatusUpdater({
  id, currentStatus, currentNotes,
  currentQuotePrice, currentQuoteColorCount, currentQuoteDeliveryDays,
  designSpec,
}: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState(currentNotes ?? "");
  const [loading, setLoading] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [draftSent, setDraftSent] = useState(false);
  const [quoteSent, setQuoteSent] = useState(false);

  // 시안 업로드
  const [draftUploadOpen, setDraftUploadOpen] = useState(false);
  const [draftImage, setDraftImage] = useState<string | null>(null);
  const [draftImageName, setDraftImageName] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 견적 발송
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteStep, setQuoteStep] = useState<"form" | "preview">("form");
  const [quotePrice, setQuotePrice] = useState(currentQuotePrice?.toString() ?? designSpec.estimatedPrice.toString());
  const [quoteColorCount, setQuoteColorCount] = useState(currentQuoteColorCount?.toString() ?? "");
  const [quoteDeliveryDays, setQuoteDeliveryDays] = useState(currentQuoteDeliveryDays?.toString() ?? "");
  const [quoteMessage, setQuoteMessage] = useState("");

  // 컬러수 입력 시 가격 자동 계산
  useEffect(() => {
    const colorCount = parseInt(quoteColorCount);
    if (!colorCount || colorCount <= 0) return;
    const auto = calculateQuotePrice({
      type: designSpec.type,
      size: designSpec.size,
      positions: designSpec.positions,
      quantity: designSpec.quantity,
      colorCount,
    });
    setQuotePrice(auto.toString());
  }, [quoteColorCount, designSpec]);

  const actions = ACTIONS[currentStatus] ?? [];
  const isTerminal = ["COMPLETED", "CANCELLED", "REJECTED"].includes(currentStatus);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("5MB 이하 이미지만 가능합니다."); return; }
    setDraftImageName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setDraftImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleAction(nextStatus: string) {
    setLoading(nextStatus);
    try {
      const res = await fetch(`/api/admin/embroidery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, notes: notes || undefined }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? "처리 실패"); return; }
      router.refresh();
    } finally { setLoading(null); }
  }

  async function handleQuoteSubmit() {
    const price = parseInt(quotePrice.replace(/,/g, ""));
    if (!price || price <= 0) { alert("견적 금액을 입력해 주세요."); return; }
    setLoading("QUOTE_SENT");
    try {
      const res = await fetch(`/api/admin/embroidery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "QUOTE_SENT",
          quotePrice: price,
          quoteColorCount: quoteColorCount ? parseInt(quoteColorCount) : undefined,
          quoteDeliveryDays: quoteDeliveryDays ? parseInt(quoteDeliveryDays) : undefined,
          quoteMessage: quoteMessage || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? "발송 실패"); return; }
      setQuoteOpen(false);
      setQuoteStep("form");
      setQuoteSent(true);
      // 완료 메시지 확인 후 refresh
      setTimeout(() => router.refresh(), 1500);
    } finally { setLoading(null); }
  }

  async function handleDraftSubmit() {
    if (!draftImage) return;
    setLoading("CUSTOMER_REVIEW");
    try {
      const res = await fetch(`/api/admin/embroidery/${id}/drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: draftImage, message: draftMessage || undefined }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? "업로드 실패"); return; }
      setDraftUploadOpen(false);
      setDraftImage(null);
      setDraftImageName("");
      setDraftMessage("");
      setDraftSent(true);
      setTimeout(() => router.refresh(), 1500);
    } finally { setLoading(null); }
  }

  async function handleSaveNotes() {
    setLoading("notes");
    try {
      const res = await fetch(`/api/admin/embroidery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) { alert("저장 실패"); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setLoading(null); }
  }

  return (
    <div className="space-y-5">

      {/* 현재 상태 */}
      <div>
        <div className="font-[var(--font-mono)] text-[10px] text-[#555] tracking-[1.5px] mb-2">현재 상태</div>
        <div className={`inline-block font-[var(--font-mono)] text-[11px] px-3 py-1.5 font-bold ${STATUS_BADGE[currentStatus] ?? "text-[#555] bg-[#222]"}`}>
          {STATUS_LABELS[currentStatus] ?? currentStatus}
        </div>
      </div>

      {/* 완료 메시지 */}
      {quoteSent && (
        <div className="border border-cyan-700/40 bg-cyan-900/20 px-4 py-3">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-cyan-300 font-bold">✓</span>
            <span className="font-[var(--font-mono)] text-[11px] text-cyan-300 font-bold">견적 발송 완료</span>
          </div>
          <div className="font-[var(--font-mono)] text-[10px] text-[#555]">고객 승인 대기 중</div>
        </div>
      )}
      {draftSent && (
        <div className="border border-blue-700/40 bg-blue-900/20 px-4 py-3">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-blue-300 font-bold">✓</span>
            <span className="font-[var(--font-mono)] text-[11px] text-blue-300 font-bold">전달 완료</span>
          </div>
          <div className="font-[var(--font-mono)] text-[10px] text-[#555]">고객 확인 대기 중</div>
        </div>
      )}

      {/* 액션 버튼 */}
      {actions.length > 0 && (
        <div>
          <div className="font-[var(--font-mono)] text-[10px] text-[#555] tracking-[1.5px] mb-3">처리 액션</div>
          <div className="space-y-2">
            {actions.map((action) => (
              <div key={action.nextStatus}>

                {/* 견적 발송 */}
                {action.requiresQuote ? (
                  <div>
                    <button onClick={() => setQuoteOpen((v) => !v)} disabled={loading !== null}
                      className={`w-full py-3 text-sm font-bold transition-colors disabled:opacity-50 ${action.style}`}>
                      {quoteOpen ? "▲ " : "▼ "}{action.label}
                    </button>
                    <div className="font-[var(--font-mono)] text-[10px] text-[#444] mt-1 px-1">{action.desc}</div>
                    {quoteOpen && (
                      <div className="mt-2 border border-[#2a2a2a] bg-[#111] p-4 space-y-4">
                        <div className="font-[var(--font-mono)] text-[10px] text-[#aaa] tracking-[1px]">견적서 작성</div>

                        {/* 시뮬레이터 스펙 (읽기 전용) */}
                        <div className="bg-[#0d0d0d] border border-[#222] p-3 space-y-1.5">
                          <div className="font-[var(--font-mono)] text-[9px] text-[#555] tracking-[1px] mb-2">고객 시뮬레이터 스펙</div>
                          {[
                            { label: "자수 종류", val: designSpec.typeName },
                            { label: "자수 위치", val: designSpec.posLabel },
                            { label: "자수 크기", val: `${designSpec.sizeLabel} (${designSpec.sizeCm})` },
                            { label: "수량",     val: `${designSpec.quantity}벌` },
                            { label: "예상 금액", val: `${designSpec.estimatedPrice.toLocaleString()}원` },
                          ].map((item) => (
                            <div key={item.label} className="flex justify-between items-center">
                              <span className="font-[var(--font-mono)] text-[10px] text-[#555]">{item.label}</span>
                              <span className="font-[var(--font-mono)] text-[10px] text-[#aaa] font-bold">{item.val}</span>
                            </div>
                          ))}
                        </div>

                        {/* 컬러 수 + 납기 */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="font-[var(--font-mono)] text-[10px] text-[#666] block mb-1">컬러 수 *</label>
                            <input
                              type="number" min="1" max="20"
                              value={quoteColorCount}
                              onChange={(e) => setQuoteColorCount(e.target.value)}
                              placeholder="예: 3"
                              className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-[#ddd] text-sm px-3 py-2 outline-none focus:border-[#ffd400]/50 placeholder:text-[#333]"
                            />
                          </div>
                          <div>
                            <label className="font-[var(--font-mono)] text-[10px] text-[#666] block mb-1">예상 납기 (일)</label>
                            <input
                              type="number" min="1"
                              value={quoteDeliveryDays}
                              onChange={(e) => setQuoteDeliveryDays(e.target.value)}
                              placeholder="예: 7"
                              className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-[#ddd] text-sm px-3 py-2 outline-none focus:border-[#ffd400]/50 placeholder:text-[#333]"
                            />
                          </div>
                        </div>

                        {/* 견적 금액 */}
                        <div>
                          <label className="font-[var(--font-mono)] text-[10px] text-[#666] block mb-1">견적 금액 (원) *</label>
                          <input
                            type="number"
                            value={quotePrice}
                            onChange={(e) => setQuotePrice(e.target.value)}
                            placeholder="예: 15000"
                            className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-[#ddd] text-base font-bold px-3 py-2.5 outline-none focus:border-[#ffd400]/50 placeholder:text-[#333]"
                          />
                          {quotePrice && (
                            <div className="font-[var(--font-display)] text-sm text-[#c8161d] mt-1 text-right">
                              {Number(quotePrice).toLocaleString()}원
                            </div>
                          )}
                        </div>

                        {/* 안내 메시지 */}
                        <div>
                          <label className="font-[var(--font-mono)] text-[10px] text-[#666] block mb-1">고객 안내 메시지 (선택)</label>
                          <textarea
                            value={quoteMessage}
                            onChange={(e) => setQuoteMessage(e.target.value)}
                            rows={3}
                            placeholder="작업 내용, 특이사항, 소재 등 안내..."
                            className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-[#ddd] text-sm px-3 py-2 outline-none focus:border-[#ffd400]/50 resize-none placeholder:text-[#333]"
                          />
                        </div>

                        {quoteStep === "form" ? (
                          <button
                            onClick={() => {
                              if (!quotePrice || !quoteColorCount) { alert("견적 금액과 컬러 수는 필수입니다."); return; }
                              setQuoteStep("preview");
                            }}
                            className="w-full py-3 bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 text-sm font-bold hover:bg-cyan-900/80 transition-colors"
                          >
                            미리보기 →
                          </button>
                        ) : (
                          /* 미리보기 */
                          <div className="border border-cyan-700/40 bg-[#0d0d0d] rounded-sm overflow-hidden">
                            <div className="font-[var(--font-mono)] text-[10px] text-cyan-400 tracking-[1.5px] px-4 py-2.5 border-b border-cyan-700/30 bg-cyan-900/20">
                              견적서 미리보기 — 고객에게 이렇게 전달됩니다
                            </div>
                            <div className="p-4 space-y-3">
                              {/* 스펙 요약 */}
                              <div className="bg-[#111] border border-[#222] divide-y divide-[#1e1e1e]">
                                {[
                                  { label: "자수 종류", val: designSpec.typeName },
                                  { label: "자수 위치", val: designSpec.posLabel },
                                  { label: "자수 크기", val: `${designSpec.sizeLabel}${designSpec.sizeCm ? ` (${designSpec.sizeCm})` : ""}` },
                                  { label: "수량",     val: `${designSpec.quantity}벌` },
                                  ...(quoteDeliveryDays ? [{ label: "예상 납기", val: `${quoteDeliveryDays}일` }] : []),
                                ].map((item) => (
                                  <div key={item.label} className="flex justify-between px-3 py-2">
                                    <span className="font-[var(--font-mono)] text-[10px] text-[#555]">{item.label}</span>
                                    <span className="font-[var(--font-mono)] text-[10px] text-[#aaa] font-bold">{item.val}</span>
                                  </div>
                                ))}
                                {/* 도수 강조 */}
                                <div className="flex justify-between px-3 py-2 bg-cyan-900/20 border-t border-cyan-700/20">
                                  <span className="font-[var(--font-mono)] text-[10px] text-cyan-400 font-bold">도수 (컬러수)</span>
                                  <span className="font-[var(--font-mono)] text-[10px] text-cyan-300 font-bold">{quoteColorCount}도</span>
                                </div>
                              </div>
                              {/* 금액 */}
                              <div className="flex items-center justify-between bg-[#111] border border-[#222] px-4 py-3">
                                <span className="font-[var(--font-mono)] text-[10px] text-[#555]">
                                  견적 금액 <span className="text-cyan-500">({quoteColorCount}도 기준)</span>
                                </span>
                                <span className="font-[var(--font-display)] text-xl text-[#c8161d]">{Number(quotePrice).toLocaleString()}원</span>
                              </div>
                              {/* 메시지 */}
                              {quoteMessage && (
                                <div className="bg-[#111] border border-[#222] px-3 py-2.5">
                                  <div className="font-[var(--font-mono)] text-[9px] text-[#555] mb-1">담당자 안내</div>
                                  <p className="text-[12px] text-[#aaa] leading-relaxed whitespace-pre-wrap">{quoteMessage}</p>
                                </div>
                              )}
                            </div>
                            {/* 발송 확인 */}
                            <div className="border-t border-cyan-700/30 px-4 py-3 bg-cyan-900/10">
                              <p className="font-[var(--font-mono)] text-[11px] text-cyan-300 text-center mb-3 font-bold">
                                위 내용으로 고객에게 발송할까요?
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => setQuoteStep("form")}
                                  className="py-2.5 text-sm text-[#555] border border-[#2a2a2a] hover:border-[#444] hover:text-[#888] transition-colors"
                                >
                                  ← 수정하기
                                </button>
                                <button
                                  onClick={handleQuoteSubmit}
                                  disabled={loading !== null}
                                  className="py-2.5 text-sm font-bold bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 hover:bg-cyan-900/80 disabled:opacity-50 transition-colors"
                                >
                                  {loading === "QUOTE_SENT" ? "발송 중..." : "발송하기"}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : action.requiresDraft ? (
                  // 시안 이미지 업로드
                  <div>
                    <button onClick={() => setDraftUploadOpen((v) => !v)} disabled={loading !== null}
                      className={`w-full py-3 text-sm font-bold transition-colors disabled:opacity-50 ${action.style}`}>
                      {draftUploadOpen ? "▲ " : "▼ "}{action.label}
                    </button>
                    <div className="font-[var(--font-mono)] text-[10px] text-[#444] mt-1 px-1">{action.desc}</div>
                    {draftUploadOpen && (
                      <div className="mt-2 border border-[#2a2a2a] bg-[#111] p-4 space-y-3">
                        <div className="font-[var(--font-mono)] text-[10px] text-[#aaa] tracking-[1px]">시안 이미지 업로드</div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        {draftImage ? (
                          <div className="space-y-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={draftImage} alt="시안 미리보기" className="w-full max-h-48 object-contain bg-[#1a1a1a] border border-[#333]" />
                            <div className="font-[var(--font-mono)] text-[10px] text-[#666] truncate">{draftImageName}</div>
                            <button onClick={() => { setDraftImage(null); setDraftImageName(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                              className="w-full py-1.5 text-[11px] border border-[#333] text-[#666] hover:border-[#555] hover:text-[#aaa] transition-colors">
                              다른 이미지로 교체
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-[#333] py-6 flex flex-col items-center gap-1.5 hover:border-[#555] transition-colors">
                            <span className="text-[#555] text-xl">↑</span>
                            <span className="font-[var(--font-mono)] text-[11px] text-[#555]">이미지 클릭하여 업로드</span>
                            <span className="font-[var(--font-mono)] text-[10px] text-[#333]">PNG / JPG · 최대 5MB</span>
                          </button>
                        )}
                        <textarea value={draftMessage} onChange={(e) => setDraftMessage(e.target.value)} rows={2}
                          placeholder="고객에게 전달할 메시지 (선택)..."
                          className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-[#ddd] text-sm px-3 py-2 outline-none focus:border-[#c8161d]/50 resize-none placeholder:text-[#333]" />
                        <button onClick={handleDraftSubmit} disabled={!draftImage || loading !== null}
                          className="w-full py-3 bg-blue-900/60 text-blue-300 border border-blue-700/50 text-sm font-bold hover:bg-blue-900/80 disabled:opacity-40 transition-colors">
                          {loading === "CUSTOMER_REVIEW" ? "전달 중..." : "시안 고객 전달하기 →"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // 일반 버튼
                  <div>
                    <button onClick={() => handleAction(action.nextStatus)} disabled={loading !== null}
                      className={`w-full py-3 text-sm font-bold transition-colors disabled:opacity-50 ${action.style}`}>
                      {loading === action.nextStatus ? "처리 중..." : action.label}
                    </button>
                    <div className="font-[var(--font-mono)] text-[10px] text-[#444] mt-1 px-1">{action.desc}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isTerminal && (
        <div className="bg-[#111] border border-[#2a2a2a] px-4 py-3">
          <div className="font-[var(--font-mono)] text-[10px] text-[#444]">이 시안은 더 이상 상태 변경이 불가합니다.</div>
        </div>
      )}

      {/* 메모 */}
      <div>
        <div className="font-[var(--font-mono)] text-[10px] text-[#555] tracking-[1.5px] mb-2">내부 메모</div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
          placeholder="내부 참고사항..."
          className="w-full bg-[#111] border border-[#2a2a2a] text-[#ddd] text-sm px-3 py-2.5 outline-none focus:border-[#c8161d]/50 resize-none placeholder:text-[#333]" />
        <button onClick={handleSaveNotes} disabled={loading !== null}
          className="mt-2 w-full border border-[#2a2a2a] text-[#555] py-2.5 text-sm font-bold hover:border-[#3a3a3a] hover:text-[#aaa] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {saved ? <><span className="text-[#c8161d]">✓</span> 저장 완료</> : loading === "notes" ? "저장 중..." : "메모 저장"}
        </button>
      </div>
    </div>
  );
}
