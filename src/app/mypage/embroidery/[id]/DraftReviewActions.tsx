"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  designId: string;
  revisionNo: number;
  totalDrafts: number; // 전체 시안 수
}

export default function DraftReviewActions({ designId, revisionNo, totalDrafts }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<null | "revision" | "confirm">(null);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [revisionSent, setRevisionSent] = useState(false);
  const [confirmedNo, setConfirmedNo] = useState<number | null>(null);

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch(`/api/embroidery/designs/${designId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CONFIRM", revisionNo }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? "처리 실패"); return; }
      setMode(null);
      setConfirmedNo(revisionNo);
      setTimeout(() => router.refresh(), 1500);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevision() {
    if (!revisionNotes.trim()) { alert("수정 요청 내용을 입력해 주세요."); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/embroidery/designs/${designId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REVISION", notes: revisionNotes }),
      });
      if (!res.ok) { const d = await res.json(); alert(d.error ?? "처리 실패"); return; }
      setMode(null);
      setRevisionSent(true);
      setTimeout(() => router.refresh(), 1500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t-2 border-[#c8161d]">

      {/* 시안 확정 완료 메시지 */}
      {confirmedNo !== null && (
        <div className="px-5 py-4 bg-[#c8161d] flex items-center gap-3">
          <span className="text-white font-bold text-lg">✓</span>
          <div>
            <div className="text-sm font-bold text-white">{confirmedNo}차 시안으로 확정되었습니다</div>
            <div className="font-[var(--font-mono)] text-[10px] text-white/70 mt-0.5">자수 제작이 곧 시작됩니다.</div>
          </div>
        </div>
      )}

      {/* 수정 요청 완료 메시지 */}
      {revisionSent && (
        <div className="px-5 py-4 bg-[#f4f4f4] flex items-center gap-3">
          <span className="text-[#c8161d] font-bold text-lg">✓</span>
          <div>
            <div className="text-sm font-bold text-[#111]">수정 요청이 전달되었습니다</div>
            <div className="font-[var(--font-mono)] text-[10px] text-[#888] mt-0.5">담당자가 확인 후 수정 시안을 보내드립니다.</div>
          </div>
        </div>
      )}

      {/* 버튼 */}
      {confirmedNo === null && !revisionSent && mode === null && (
        <>
          {/* 다중 시안일 때 — 각 시안에 독립 확정 버튼 */}
          {totalDrafts >= 2 ? (
            <div>
              <div className="px-5 py-2 bg-[#fff8f0] border-b border-[#ffd400]/30">
                <p className="font-[var(--font-mono)] text-[10px] text-[#888] text-center">
                  {revisionNo}차 시안으로 확정하시겠습니까?
                </p>
              </div>
              <button
                onClick={() => setMode("confirm")}
                className="w-full py-3.5 text-sm font-bold text-white bg-[#c8161d] hover:bg-[#9c0e15] transition-colors flex items-center justify-center gap-2"
              >
                {revisionNo}차 시안으로 확정하기 ✓
              </button>
            </div>
          ) : (
            /* 1차 시안만 있을 때 — 수정 요청 + 확정 */
            <div className="grid grid-cols-2 divide-x divide-[#e0e0e0]">
              <button
                onClick={() => setMode("revision")}
                className="py-4 text-sm font-bold text-[#111] hover:bg-[#f4f4f4] transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-[#888]">✎</span> 수정 요청하기
              </button>
              <button
                onClick={() => setMode("confirm")}
                className="py-4 text-sm font-bold text-white bg-[#c8161d] hover:bg-[#9c0e15] transition-colors flex items-center justify-center gap-2"
              >
                시안 확정하기 ✓
              </button>
            </div>
          )}
        </>
      )}

      {/* 수정 요청 폼 */}
      {confirmedNo === null && !revisionSent && mode === "revision" && (
        <div className="p-5 space-y-3">
          <div className="font-[var(--font-mono)] text-[10px] text-[#888] tracking-[1.5px]">수정 요청 내용</div>
          <textarea
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
            rows={4}
            placeholder="수정이 필요한 부분을 구체적으로 적어주세요. (색상, 크기, 위치, 폰트 등)"
            className="w-full border border-[#ddd] px-3 py-2.5 text-sm outline-none focus:border-[#c8161d] resize-none placeholder:text-[#ccc]"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode(null)}
              className="py-3 text-sm text-[#888] border border-[#e0e0e0] hover:border-[#999] transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleRevision}
              disabled={loading}
              className="py-3 text-sm font-bold text-[#111] border border-[#111] hover:bg-[#111] hover:text-white transition-colors disabled:opacity-50"
            >
              {loading ? "요청 중..." : "수정 요청 제출"}
            </button>
          </div>
          <p className="font-[var(--font-mono)] text-[10px] text-[#bbb] text-center">
            수정 요청 후 담당자가 수정 시안을 재전달합니다.
          </p>
        </div>
      )}

      {/* 확정 확인 */}
      {confirmedNo === null && !revisionSent && mode === "confirm" && (
        <div className="p-5 space-y-3">
          <div className="bg-[#fff8f0] border border-[#ffd400]/50 px-4 py-3">
            <p className="text-sm font-bold text-[#111] mb-1">{totalDrafts >= 2 ? `${revisionNo}차 시안으로 확정하시겠습니까?` : "시안을 확정하시겠습니까?"}</p>
            <p className="text-xs text-[#888] leading-relaxed">
              확정 후에는 자수 제작이 시작됩니다.<br />
              <span className="text-[#c8161d] font-bold">확정 이후 단순 변심에 의한 취소 및 환불은 불가합니다.</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode(null)}
              className="py-3 text-sm text-[#888] border border-[#e0e0e0] hover:border-[#999] transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="py-3 text-sm font-bold text-white bg-[#c8161d] hover:bg-[#9c0e15] transition-colors disabled:opacity-50"
            >
              {loading ? "처리 중..." : "확정하기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
