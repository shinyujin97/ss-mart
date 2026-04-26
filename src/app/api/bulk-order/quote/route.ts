import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuoteRequestSchema } from "@/lib/bulk-order/validation";
import { generateQuoteNumber } from "@/lib/bulk-order/numbering";
import { isBulkEligible } from "@/lib/bulk-order/discount";

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json();

  // Zod 검증
  const result = QuoteRequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "입력 오류", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const data = result.data;
  const totalQuantity = Object.values(data.sizeQuantities).reduce((a, b) => a + b, 0);

  // 단체주문 자격 재검증 (서버)
  if (!isBulkEligible(totalQuantity, data.embroideryRequested)) {
    return NextResponse.json(
      { error: "단체주문 자격 미충족 (100벌 이상 또는 자수 추가 50벌 이상)" },
      { status: 400 }
    );
  }

  const requestNumber = await generateQuoteNumber();

  // 견적 만료일 (14일)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  const quote = await prisma.quoteRequest.create({
    data: {
      requestNumber,
      memberId: session?.user?.id ?? null,
      companyName: data.companyName,
      businessNumber: data.businessNumber || null,
      managerName: data.managerName,
      managerPosition: data.managerPosition || null,
      managerPhone: data.managerPhone,
      managerEmail: data.managerEmail,
      categories: data.categories,
      sizeQuantities: data.sizeQuantities,
      totalQuantity,
      embroideryRequested: data.embroideryRequested,
      embroideryType: (data.embroideryType as any) ?? null,
      embroideryPosition: (data.embroideryPosition as any) ?? null,
      embroideryContent: data.embroideryContent ?? null,
      logoFileUrl: data.logoFileUrl ?? null,
      desiredDeliveryDate: data.desiredDeliveryDate ? new Date(data.desiredDeliveryDate) : null,
      budgetRange: data.budgetRange ?? null,
      paymentMethod: data.paymentMethod,
      additionalNotes: data.additionalNotes ?? null,
      status: "PENDING",
      expiresAt,
    },
    select: { id: true, requestNumber: true },
  });

  return NextResponse.json(
    { quoteId: quote.id, requestNumber: quote.requestNumber },
    { status: 201 }
  );
}
