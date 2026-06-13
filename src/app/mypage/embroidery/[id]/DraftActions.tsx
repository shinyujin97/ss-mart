"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  designId: string;
  canRequest: boolean;
}

export default function DraftActions({ designId, canRequest }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");

  async function handleRequest() {
    setLoading(true);
    try {
      const res = await fetch(`/api/embroidery/designs/${designId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes || undefined }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "요청 실패");
        return;
      }
      router.push("/mypage/embroidery/requests");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 divide-x divide-[#e0e0e0] border-t border-[#e0e0e0]">
        <button
          disabled={!canRequest}
          className="py-3.5 text-sm font-bold text-[#111] hover:bg-[#f4f4f4] transition-colors disabled:opacity-40"
        >
          수정 요청하기
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!canRequest}
          className="py-3.5 text-sm font-bold text-white bg-[#c8161d] hover:bg-[#9c0e15] transition-colors disabled:opacity-40"
        >
          이 시안으로 견적 요청 →
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#e5e5e5] shadow-xl w-full max-w-[380px]">
            <div className="px-6 pt-5 pb-1">
              <div className="font-[var(--font-mono)] text-[10px] tracking-[2px] text-[#aaa]">견적 요청 확인</div>
              <h3 className="text-base font-black text-[#111] mt-1">이 시안으로 견적을 요청하시겠습니까?</h3>
              <p className="text-xs text-[#888] mt-2">요청 후에는 시안이 신청현황으로 이동하며 담당자가 검토합니다.</p>
            </div>
            <div className="px-6 py-4">
              <label className="font-[var(--font-mono)] text-[10px] text-[#555] block mb-1.5">상세 디자인 요청사항 (선택)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="색상, 폰트, 특이사항 등..."
                className="w-full border border-[#ddd] px-3 py-2 text-sm outline-none focus:border-[#111] resize-none placeholder:text-[#ccc]"
              />
            </div>
            <div className="flex border-t border-[#e5e5e5]">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 text-sm text-[#888] hover:bg-[#f4f4f4] border-r border-[#e5e5e5]"
              >
                취소
              </button>
              <button
                onClick={handleRequest}
                disabled={loading}
                className="flex-1 py-3 text-sm font-bold text-white bg-[#c8161d] hover:bg-[#9c0e15] disabled:opacity-60"
              >
                {loading ? "요청 중..." : "견적 요청"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
