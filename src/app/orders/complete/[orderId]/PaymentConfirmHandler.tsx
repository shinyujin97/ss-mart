"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  paymentKey: string;
  orderId: string;
}

export default function PaymentConfirmHandler({ paymentKey, orderId }: Props) {
  const router = useRouter();

  useEffect(() => {
    async function confirm() {
      // [CRITICAL FIX 3] amount를 URL 파라미터에서 받지 않고 서버 DB 조회로 대체
      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentKey, orderId }),
      });

      if (!res.ok) {
        router.replace(`/checkout?error=confirm_failed`);
        return;
      }

      router.refresh();
    }

    confirm();
  }, [paymentKey, orderId, router]);

  return null;
}
