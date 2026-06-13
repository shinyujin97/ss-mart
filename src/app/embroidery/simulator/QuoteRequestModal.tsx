"use client";

import { useState, useRef } from "react";
import { EMBROIDERY_TYPES, POSITION_LABELS, SIZE_LABELS } from "@/constants/embroidery";
import type { EmbroideryTypeKey, EmbroiderySizeKey, EmbroideryPositionKey } from "@/constants/embroidery";

const COLOR_COUNT_OPTIONS = [
  "1도",
  "2도",
  "3~6도",
  "7~12도",
  "12도 이상",
];

interface Props {
  embroideryType: EmbroideryTypeKey;
  embroiderySize: EmbroiderySizeKey;
  positions: EmbroideryPositionKey[];
  prefilledText?: string;
  prefilledImageUrl?: string;
  onClose: () => void;
}

export default function QuoteRequestModal({
  embroideryType,
  embroiderySize,
  positions,
  prefilledText,
  prefilledImageUrl,
  onClose,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    patternName: "",
    colorCount: "3~6도",
    requirements: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(prefilledImageUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError("파일은 20MB 이하만 가능합니다.");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.patternName.trim()) {
      setError("자수패턴 이름을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 시안 저장 API 활용 (추후 견적 전용 API로 분리 가능)
      const body = {
        type: embroideryType,
        size: embroiderySize,
        position: positions[0] ?? "BACK_CENTER",
        positions,
        textContent: prefilledText || undefined,
        notes: [
          `패턴명: ${form.patternName}`,
          `도수: ${form.colorCount}`,
          form.requirements ? `요청사항: ${form.requirements}` : "",
        ].filter(Boolean).join("\n"),
        quantity: 1,
      };

      const res = await fetch("/api/embroidery/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "제출 실패. 다시 시도해주세요.");
        return;
      }

      setDone(true);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const typeName = EMBROIDERY_TYPES[embroideryType]?.name ?? embroideryType;
  const sizeName = SIZE_LABELS[embroiderySize] ?? embroiderySize;
  const positionNames = positions.map((p) => POSITION_LABELS[p]).join(", ");

  return (
    <div className="fixed inset-0 z-50 flex items-stretch md:items-center justify-center bg-black/60 px-0 md:px-4">
      <div className="bg-white w-full max-w-none md:max-w-[560px] h-full md:h-auto max-h-none md:max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* 헤더 */}
        <div className="bg-[#111] text-white px-6 py-4 flex items-start justify-between">
          <div>
            <div className="font-[var(--font-mono)] text-[9px] tracking-[2px] text-white/40 mb-1">
              STEP 1 — 자수패턴 제작의뢰 디자인 신청
            </div>
            <h2 className="text-base font-black">견적 요청서</h2>
            <p className="text-[11px] text-white/50 mt-0.5 font-[var(--font-mono)]">
              구체적인 내용을 작성해 주시면 더 만족스러운 결과를 드릴 수 있습니다.
            </p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none mt-1">✕</button>
        </div>

        {done ? (
          /* 제출 완료 */
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 bg-[#111] flex items-center justify-center mx-auto mb-4">
              <span className="text-[#ffd400] text-2xl font-bold">✓</span>
            </div>
            <p className="text-base font-black text-[#111] mb-1">견적 요청이 완료되었습니다!</p>
            <p className="text-sm text-[#888] mb-4">담당 매니저가 1~2 영업일 내에 연락드립니다.</p>

            <div className="bg-[#f8f8f8] border border-[#e5e5e5] px-5 py-4 mb-6 text-left space-y-1.5">
              <div className="font-[var(--font-mono)] text-[10px] text-[#aaa] tracking-[1.5px] mb-2">진행 순서</div>
              {["접수 완료 → 담당자 확인", "1차 시안 카카오 채널 전달", "수정 및 시안 확정", "자수 제작 → 출고"].map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-[#555]">
                  <span className="font-[var(--font-mono)] text-[#c8161d] font-bold">{String(i+1).padStart(2,"0")}</span>
                  {step}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={onClose}
                className="flex-1 border border-[#ddd] text-[#888] py-3 text-sm font-bold hover:border-[#111] hover:text-[#111] transition-colors">
                닫기
              </button>
              <a href="/mypage/embroidery"
                className="flex-1 bg-[#c8161d] text-white py-3 text-sm font-bold hover:bg-[#9c0e15] transition-colors text-center block">
                신청현황 확인하기 →
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

            {/* 시뮬레이터 선택값 요약 (읽기 전용) */}
            <div className="bg-[#f8f8f8] border border-[#e8e8e8] px-4 py-3">
              <div className="font-[var(--font-mono)] text-[9px] text-[#999] tracking-[1.5px] mb-2">시뮬레이터 설정값 (자동 반영)</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "자수 종류", value: typeName },
                  { label: "위치", value: positionNames },
                  { label: "크기", value: sizeName },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="font-[var(--font-mono)] text-[9px] text-[#bbb]">{item.label}</div>
                    <div className="text-xs font-bold text-[#111] mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>
              {prefilledText && (
                <div className="mt-2 pt-2 border-t border-[#e8e8e8]">
                  <div className="font-[var(--font-mono)] text-[9px] text-[#bbb]">입력한 텍스트</div>
                  <div className="text-xs font-bold text-[#111] mt-0.5 font-[var(--font-mono)]">"{prefilledText}"</div>
                </div>
              )}
            </div>

            {/* 자수패턴 이름 */}
            <div>
              <label className="block font-[var(--font-mono)] text-[11px] text-[#444] font-bold mb-1.5">
                자수패턴 이름 <span className="text-[#c8161d]">*</span>
                <span className="text-[#bbb] font-normal ml-1">입력해주신 이름으로 파일이 저장됩니다</span>
              </label>
              <input type="text" value={form.patternName}
                onChange={(e) => setForm((f) => ({ ...f, patternName: e.target.value }))}
                placeholder="예: 회사 로고, 팀 엠블럼..."
                className="w-full border border-[#ddd] px-3 py-2.5 text-sm outline-none focus:border-[#111]"
              />
            </div>

            {/* 이미지 파일 */}
            <div>
              <label className="block font-[var(--font-mono)] text-[11px] text-[#444] font-bold mb-1.5">
                이미지 파일
                <span className="text-[#bbb] font-normal ml-1">JPG, JPEG, GIF, PNG, AI, PSD, PDF 등</span>
              </label>
              <input ref={fileInputRef} type="file"
                accept="image/*,.ai,.psd,.pdf"
                onChange={handleImageChange}
                className="hidden" />
              <div className="flex gap-3 items-start">
                <div className="flex-1">
                  <div className="flex">
                    <div className="flex-1 border border-[#ddd] px-3 py-2.5 text-sm text-[#888] bg-white truncate">
                      {imageFile ? imageFile.name : "파일을 선택하세요"}
                    </div>
                    <button type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 border border-[#ddd] border-l-0 bg-[#f4f4f4] text-sm hover:bg-[#eee] whitespace-nowrap font-[var(--font-mono)]">
                      찾아보기...
                    </button>
                  </div>
                  <p className="font-[var(--font-mono)] text-[10px] text-[#bbb] mt-1">
                    (허가받지 않은) 저작권 있는 이미지, 폰트, 브랜드 로고 등은 불가합니다.
                  </p>
                </div>
                {imagePreview && (
                  <div className="w-20 h-20 border border-[#e0e0e0] bg-[#f8f8f8] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img src={imagePreview} alt="미리보기" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
              </div>
            </div>

            {/* 도수(컬러수) */}
            <div>
              <label className="block font-[var(--font-mono)] text-[11px] text-[#444] font-bold mb-1.5">
                도수(컬러수)
              </label>
              <select value={form.colorCount}
                onChange={(e) => setForm((f) => ({ ...f, colorCount: e.target.value }))}
                className="w-full border border-[#ddd] px-3 py-2.5 text-sm outline-none focus:border-[#111] bg-white">
                {COLOR_COUNT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* 상세 디자인 요청사항 */}
            <div>
              <label className="block font-[var(--font-mono)] text-[11px] text-[#444] font-bold mb-1.5">
                상세 디자인 요청사항
              </label>
              <textarea value={form.requirements}
                onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
                rows={4}
                placeholder={`색상, 폰트, 특이사항 등을 자세히 적어주세요.\n예) 몸통은 파랑색으로, 눈은 검정, 꽃은 분홍색으로 채워주세요.`}
                className="w-full border border-[#ddd] px-3 py-2.5 text-sm outline-none focus:border-[#111] resize-none text-[#c8161d] placeholder:text-[#bbb]"
              />
            </div>

            {error && (
              <p className="font-[var(--font-mono)] text-[11px] text-[#c8161d]">⚠ {error}</p>
            )}

            {/* 버튼 */}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose}
                className="px-6 py-3 border border-[#ddd] text-sm text-[#888] hover:border-[#111] hover:text-[#111] transition-colors">
                취소
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-[#c8161d] text-white py-3 text-sm font-bold hover:bg-[#9c0e15] transition-colors disabled:opacity-60">
                {loading ? "제출 중..." : "견적 신청하기 →"}
              </button>
            </div>

            <p className="font-[var(--font-mono)] text-[10px] text-[#bbb] text-center pb-1">
              담당 매니저 SLA: 영업일 기준 2시간 이내 연락 · 견적서 발송 1~2 영업일
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
