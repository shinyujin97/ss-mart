import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  // [CRITICAL FIX 3] amount를 클라이언트에서 받지 않고 서버 DB에서 조회
  const { paymentKey, orderId } = await req.json();

  if (!paymentKey || !orderId) {
    return NextResponse.json({ error: "필수 파라미터가 누락되었습니다." }, { status: 400 });
  }

  try {
    // DB에서 실제 금액 조회
    const order = await prisma.order.findUnique({
      where: { id: orderId, memberId: session.user.id as string },
      select: { totalAmount: true, status: true },
    });

    if (!order) {
      return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
    }
    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "이미 처리된 주문입니다." }, { status: 400 });
    }

    // 서버 DB 금액으로 PG 승인 요청
    const serverAmount = order.totalAmount;
    const secretKey = process.env.TOSS_SECRET_KEY!;
    const encoded = Buffer.from(`${secretKey}:`).toString("base64");

    const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount: serverAmount }),
    });

    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      await rollbackStock(orderId);
      return NextResponse.json(
        { error: tossData.message ?? "결제 승인에 실패했습니다." },
        { status: 400 }
      );
    }

    // 결제 성공 → 트랜잭션으로 DB 업데이트
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

      // [HIGH FIX 5] 적립금은 PENDING 상태로 이력만 기록 (구매 확정 시 실지급)
      const orderData = await tx.order.findUnique({
        where: { id: orderId },
        select: { pointsEarned: true, memberId: true, member: { select: { points: true } } },
      });
      if (orderData && orderData.pointsEarned > 0) {
        await tx.pointHistory.create({
          data: {
            memberId: orderData.memberId,
            type: "EARN_PURCHASE",
            amount: orderData.pointsEarned,
            balance: orderData.member.points, // 아직 잔액 증가 안 함
            reason: "구매 적립금 (구매 확정 후 지급)",
            relatedOrderId: orderId,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });
        // 실제 잔액은 구매 확정(CONFIRMED) 시점에 member.points 증가
      }
    });

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    console.error("[PAYMENT_CONFIRM]", error);
    await rollbackStock(orderId);
    return NextResponse.json({ error: "결제 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// [HIGH FIX 6] rollbackStock 트랜잭션으로 원자적 처리
async function rollbackStock(orderId: string) {
  try {
    await prisma.$transaction(async (tx) => {
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        await tx.productOption.update({
          where: { id: item.optionId },
          data: { reservedQuantity: { decrement: item.quantity } },
        });
      }
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
    });
  } catch (e) {
    console.error("[ROLLBACK_STOCK_FAILED]", orderId, e);
  }
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
