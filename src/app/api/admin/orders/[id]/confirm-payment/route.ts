import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: { status: true, bankTransferDeadline: true, totalAmount: true },
  });

  if (!order) return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  if (order.status !== "PENDING_PAYMENT") {
    return NextResponse.json({ error: "입금 대기 상태가 아닙니다." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id },
      data: { status: "PAID", paidAt: new Date() },
    });

    // 재고 예약 → 실차감
    const items = await tx.orderItem.findMany({ where: { orderId: id } });
    for (const item of items) {
      await tx.productOption.update({
        where: { id: item.optionId },
        data: {
          stockQuantity: { decrement: item.quantity },
          reservedQuantity: { decrement: item.quantity },
        },
      });
    }

    // 결제 기록
    await tx.payment.create({
      data: {
        orderId: id,
        method: "BANK_TRANSFER" as any,
        amount: order.totalAmount,
        pgProvider: "MANUAL",
        pgTransactionId: `BANK-${id}`,
        status: "APPROVED",
        approvedAt: new Date(),
      },
    });
  });

  return NextResponse.json({ ok: true });
}
