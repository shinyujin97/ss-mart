"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
  designNumber: string;
  disabled?: boolean;
}

export default function DeleteDesignButton({ id, designNumber, disabled }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/embroidery/designs/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "삭제 실패");
        return;
      }
      setShowConfirm(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={disabled}
        className="px-3 text-[11px] py-2 border border-[var(--line)] font-[var(--font-mono)] hover:border-[var(--red)] hover:text-[var(--red)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        삭제
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white border border-[#e5e5e5] shadow-xl w-[320px]">
            <div className="px-6 pt-5 pb-1">
              <div className="font-[var(--font-mono)] text-[10px] tracking-[2px] text-[#aaa]">CONFIRM / DELETE</div>
              <h3 className="text-base font-black text-[#111] mt-1">시안을 삭제하시겠습니까?</h3>
              <p className="font-[var(--font-mono)] text-[11px] text-[#888] mt-1">{designNumber}</p>
              <p className="text-xs text-[#aaa] mt-2">삭제된 시안은 복구할 수 없습니다.</p>
            </div>
            <div className="flex border-t border-[#e5e5e5] mt-5">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 text-sm text-[#888] hover:bg-[#f4f4f4] transition-colors border-r border-[#e5e5e5]"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-3 text-sm font-bold text-white bg-[#c8161d] hover:bg-[#9c0e15] transition-colors disabled:opacity-60"
              >
                {loading ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
