import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// 기한 초과 무통장 주문 자동 취소
export async function POST(_req: NextRequest) {
  await requireAdmin();

  const expiredOrders = await prisma.order.findMany({
    where: {
      status: "PENDING_PAYMENT",
      bankTransferDeadline: { lt: new Date() },
    },
    select: { id: true },
  });

  for (const order of expiredOrders) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
      for (const item of items) {
        await tx.productOption.update({
          where: { id: item.optionId },
          data: { reservedQuantity: { decrement: item.quantity } },
        });
      }
    });
  }

  return NextResponse.json({ cancelled: expiredOrders.length });
}
