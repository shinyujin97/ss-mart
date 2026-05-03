import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COMPANY_BANK_ACCOUNT } from "@/constants/bank-account";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { items, address, shippingType = "STANDARD", pointsUsed = 0, paymentMethod } = body;

    if (!items?.length || !address) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
    }

    const order = await prisma.$transaction(async (tx) => {
      // [CRITICAL FIX 2] 세금계산서 결제 시 사업자 회원 검증
      if (paymentMethod === "TAX_INVOICE") {
        const member = await tx.member.findUnique({
          where: { id: session.user!.id as string },
          select: { type: true },
        });
        if (member?.type !== "BUSINESS") {
          throw new Error("세금계산서 결제는 사업자 회원만 이용할 수 있습니다.");
        }
      }

      let subtotal = 0;
      let embroideryFeeTotal = 0;

      for (const item of items) {
        const option = await tx.productOption.findUnique({
          where: { id: item.optionId },
          select: {
            id: true, stockQuantity: true, reservedQuantity: true, priceAdjust: true,
            product: { select: { salePrice: true, status: true } },
          },
        });

        if (!option || option.product.status !== "ACTIVE") {
          throw new Error(`상품을 찾을 수 없습니다: ${item.optionId}`);
        }

        const available = option.stockQuantity - option.reservedQuantity;
        if (available < item.quantity) {
          throw new Error(`재고가 부족합니다. (남은 재고: ${available}개)`);
        }

        const unitPrice = option.product.salePrice + option.priceAdjust;
        subtotal += unitPrice * item.quantity;

        // [CRITICAL FIX 1] 자수비는 DB에 저장된 서버 계산값 조회 (클라이언트 값 무시)
        if (item.embroideryDesignId) {
          const design = await tx.embroideryDesign.findUnique({
            where: { id: item.embroideryDesignId },
            select: { totalPrice: true },
          });
          embroideryFeeTotal += design?.totalPrice ?? 0;
        }

        await tx.productOption.update({
          where: { id: item.optionId },
          data: { reservedQuantity: { increment: item.quantity } },
        });
      }

      const grossAmount = subtotal + embroideryFeeTotal;

      // 적립금 검증
      if (pointsUsed > 0) {
        const member = await tx.member.findUnique({
          where: { id: session.user!.id as string },
          select: { points: true },
        });
        if (!member || member.points < pointsUsed) {
          throw new Error("적립금이 부족합니다.");
        }
        if (pointsUsed > grossAmount * 0.5) {
          throw new Error("적립금은 결제 금액의 50%까지만 사용 가능합니다.");
        }
      }

      const totalAmount = Math.max(0, grossAmount - pointsUsed);

      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const count = await tx.order.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      });
      const orderNumber = `SS-${today}-${String(count + 1).padStart(6, "0")}`;

      const isBankTransfer = paymentMethod === "BANK_TRANSFER";
      const bankDeadline = isBankTransfer
        ? new Date(Date.now() + COMPANY_BANK_ACCOUNT.deadlineHours * 60 * 60 * 1000)
        : null;

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          memberId: session.user!.id as string,
          status: isBankTransfer ? "PENDING_PAYMENT" : "PENDING",
          recipientName: address.recipientName,
          recipientPhone: address.recipientPhone,
          zipCode: address.zipCode,
          address: address.address,
          addressDetail: address.addressDetail,
          deliveryMemo: address.deliveryMemo,
          shippingType,
          shippingFee: 0,
          subtotal,
          embroideryFee: embroideryFeeTotal,
          pointsUsed,
          totalAmount,
          pointsEarned: Math.floor(totalAmount * 0.01),
          hasEmbroidery: embroideryFeeTotal > 0,
          ...(isBankTransfer ? {
            bankTransferDeadline: bankDeadline,
            bankTransferHolder: address.bankTransferHolder ?? null,
          } : {}),
          items: {
            create: await Promise.all(
              items.map(async (item: { optionId: string; quantity: number; embroideryDesignId?: string }) => {
                const option = await tx.productOption.findUnique({
                  where: { id: item.optionId },
                  include: { product: { include: { brand: true } } },
                });
                const serverEmbFee = item.embroideryDesignId
                  ? (await tx.embroideryDesign.findUnique({ where: { id: item.embroideryDesignId }, select: { totalPrice: true } }))?.totalPrice ?? 0
                  : 0;
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
                  embroideryFee: serverEmbFee,
                };
              })
            ),
          },
        },
        select: { id: true, orderNumber: true, totalAmount: true },
      });

      if (pointsUsed > 0) {
        await tx.member.update({
          where: { id: session.user!.id as string },
          data: { points: { decrement: pointsUsed } },
        });
      }

      return newOrder;
    });

    const res: Record<string, unknown> = {
      orderId: order.id, orderNumber: order.orderNumber, amount: order.totalAmount,
    };
    if (body.paymentMethod === "BANK_TRANSFER") {
      res.bankTransfer = {
        bank: COMPANY_BANK_ACCOUNT.bank,
        accountNumber: COMPANY_BANK_ACCOUNT.accountNumber,
        holder: COMPANY_BANK_ACCOUNT.holder,
        deadline: new Date(Date.now() + COMPANY_BANK_ACCOUNT.deadlineHours * 60 * 60 * 1000).toISOString(),
        amount: order.totalAmount,
      };
    }
    return NextResponse.json(res);
  } catch (error) {
    const message = error instanceof Error ? error.message : "주문 생성에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
