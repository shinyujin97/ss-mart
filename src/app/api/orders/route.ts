import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { items, address, shippingType = "STANDARD", pointsUsed = 0, couponId } = body;

    if (!items?.length || !address) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
    }

    // 서버에서 가격 재계산 + 재고 확인 (동시성 제어)
    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0;

      for (const item of items) {
        // 재고 락
        const option = await tx.productOption.findUnique({
          where: { id: item.optionId },
          select: { id: true, stockQuantity: true, reservedQuantity: true, priceAdjust: true, product: { select: { salePrice: true, status: true } } },
        });

        if (!option || option.product.status !== "ACTIVE") {
          throw new Error(`상품을 찾을 수 없습니다: ${item.optionId}`);
        }

        const available = option.stockQuantity - option.reservedQuantity;
        if (available < item.quantity) {
          throw new Error(`재고가 부족합니다. (남은 재고: ${available}개)`);
        }

        // 서버 기준 단가 계산
        const unitPrice = option.product.salePrice + option.priceAdjust;
        subtotal += unitPrice * item.quantity;

        // 재고 예약
        await tx.productOption.update({
          where: { id: item.optionId },
          data: { reservedQuantity: { increment: item.quantity } },
        });
      }

      // 적립금 검증
      if (pointsUsed > 0) {
        const member = await tx.member.findUnique({
          where: { id: session.user!.id },
          select: { points: true },
        });
        if (!member || member.points < pointsUsed) {
          throw new Error("적립금이 부족합니다.");
        }
        if (pointsUsed > subtotal * 0.5) {
          throw new Error("적립금은 결제 금액의 50%까지만 사용 가능합니다.");
        }
      }

      const totalAmount = Math.max(0, subtotal - pointsUsed);

      // 주문번호 생성
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const count = await tx.order.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      });
      const orderNumber = `SS-${today}-${String(count + 1).padStart(6, "0")}`;

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          memberId: session.user!.id as string,
          recipientName: address.recipientName,
          recipientPhone: address.recipientPhone,
          zipCode: address.zipCode,
          address: address.address,
          addressDetail: address.addressDetail,
          deliveryMemo: address.deliveryMemo,
          shippingType,
          shippingFee: 0, // 전 상품 무료 배송
          subtotal,
          pointsUsed,
          totalAmount,
          pointsEarned: Math.floor(totalAmount * 0.01),
          hasEmbroidery: items.some((i: { embroideryFee?: number }) => (i.embroideryFee ?? 0) > 0),
          items: {
            create: await Promise.all(
              items.map(async (item: { optionId: string; quantity: number; embroideryFee?: number }) => {
                const option = await tx.productOption.findUnique({
                  where: { id: item.optionId },
                  include: { product: { include: { brand: true } } },
                });
                return {
                  productId: option!.productId,
                  productSnapshot: {
                    name: option!.product.name,
                    brand: option!.product.brand.name,
                    salePrice: option!.product.salePrice,
                  },
                  optionId: item.optionId,
                  optionSnapshot: { color: option!.color, size: option!.size },
                  quantity: item.quantity,
                  unitPrice: option!.product.salePrice + option!.priceAdjust,
                  totalPrice: (option!.product.salePrice + option!.priceAdjust) * item.quantity,
                  embroideryFee: item.embroideryFee ?? 0,
                };
              })
            ),
          },
        },
        select: { id: true, orderNumber: true, totalAmount: true },
      });

      // 적립금 차감
      if (pointsUsed > 0) {
        await tx.member.update({
          where: { id: session.user!.id },
          data: { points: { decrement: pointsUsed } },
        });
      }

      return newOrder;
    });

    return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber, amount: order.totalAmount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "주문 생성에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
