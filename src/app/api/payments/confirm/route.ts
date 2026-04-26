import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { paymentKey, orderId, amount } = await req.json();

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.json({ error: "필수 파라미터가 누락되었습니다." }, { status: 400 });
  }

  try {
    // 주문 금액 서버 재확인
    const order = await prisma.order.findUnique({
      where: { id: orderId, memberId: session.user.id },
      select: { totalAmount: true, status: true },
    });

    if (!order) {
      return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
    }
    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "이미 처리된 주문입니다." }, { status: 400 });
    }
    if (order.totalAmount !== amount) {
      return NextResponse.json({ error: "결제 금액이 일치하지 않습니다." }, { status: 400 });
    }

    // 토스페이먼츠 결제 승인 API 호출
    const secretKey = process.env.TOSS_SECRET_KEY!;
    const encoded = Buffer.from(`${secretKey}:`).toString("base64");

    const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      // 결제 실패 → 재고 복구
      await rollbackStock(orderId);
      return NextResponse.json(
        { error: tossData.message ?? "결제 승인에 실패했습니다." },
        { status: 400 }
      );
    }

    // 결제 성공 → DB 업데이트
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          paidAt: new Date(),
          payment: {
            create: {
              method: mapPaymentMethod(tossData.method),
              amount: tossData.totalAmount,
              pgProvider: "TOSS",
              pgTransactionId: tossData.paymentKey,
              pgApprovalNumber: tossData.approvalNumber ?? null,
              cardCompany: tossData.card?.company ?? null,
              installmentMonths: tossData.card?.installmentPlanMonths ?? 0,
              status: "APPROVED",
              approvedAt: new Date(tossData.approvedAt),
            },
          },
        },
      });

      // 재고 예약 → 실차감
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        await tx.productOption.update({
          where: { id: item.optionId },
          data: {
            stockQuantity: { decrement: item.quantity },
            reservedQuantity: { decrement: item.quantity },
          },
        });
      }

      // 적립금 예약 기록
      const orderData = await tx.order.findUnique({ where: { id: orderId }, select: { pointsEarned: true, memberId: true, member: { select: { points: true } } } });
      if (orderData && orderData.pointsEarned > 0) {
        await tx.pointHistory.create({
          data: {
            memberId: orderData.memberId,
            type: "EARN_PURCHASE",
            amount: orderData.pointsEarned,
            balance: orderData.member.points + orderData.pointsEarned,
            reason: "구매 적립금",
            relatedOrderId: orderId,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });
      }
    });

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    console.error("[PAYMENT_CONFIRM]", error);
    await rollbackStock(orderId);
    return NextResponse.json({ error: "결제 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

async function rollbackStock(orderId: string) {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    await prisma.productOption.update({
      where: { id: item.optionId },
      data: { reservedQuantity: { decrement: item.quantity } },
    });
  }
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
}

function mapPaymentMethod(method: string) {
  const map: Record<string, string> = {
    카드: "CREDIT_CARD",
    간편결제: "EASY_PAY",
    계좌이체: "BANK_TRANSFER",
    가상계좌: "VIRTUAL_ACCOUNT",
  };
  return (map[method] ?? "CREDIT_CARD") as any;
}
