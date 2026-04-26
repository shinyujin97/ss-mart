"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export default function PaymentConfirmHandler({ paymentKey, orderId, amount }: Props) {
  const router = useRouter();

  useEffect(() => {
    async function confirm() {
      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      });

      if (!res.ok) {
        router.replace(`/checkout?error=confirm_failed`);
        return;
      }

      // 승인 완료 → 페이지 새로고침 (order.status가 PAID로 바뀜)
      router.refresh();
    }

    confirm();
  }, [paymentKey, orderId, amount, router]);

  return null;
}
