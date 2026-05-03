"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmPaymentButton({ orderId, deadline }: { orderId: string; deadline: Date | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isExpired = deadline && new Date(deadline) < new Date();

  async function handleConfirm() {
    if (!confirm("입금을 확인하셨습니까? 주문이 결제완료 상태로 변경됩니다.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/confirm-payment`, { method: "PATCH" });
      if (!res.ok) { const d = await res.json(); alert(d.error ?? "처리 실패"); return; }
      router.refresh();
    } finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col gap-1">
      <button onClick={handleConfirm} disabled={loading || !!isExpired}
        className="px-3 py-1.5 bg-[#c8161d] text-white text-[11px] font-bold hover:bg-[#9c0e15] disabled:opacity-50 transition-colors whitespace-nowrap">
        {loading ? "처리중..." : "입금 확인"}
      </button>
      {deadline && (
        <span className={`font-[var(--font-mono)] text-[9px] text-center ${isExpired ? "text-[#c8161d]" : "text-[#888]"}`}>
          {isExpired ? "기한초과" : `~${new Date(deadline).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`}
        </span>
      )}
    </div>
  );
}
