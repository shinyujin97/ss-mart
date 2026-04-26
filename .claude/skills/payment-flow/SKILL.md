---
name: payment-flow
description: 주문 / 결제 / 환불 워크플로우 개발 시 사용. PG사 통합 (토스페이먼츠 / KG이니시스), 결제 수단 5가지 (카드, 간편결제, 계좌이체, 무통장, 세금계산서), 주문 상태 머신, 재고 차감 동시성, 환불 정책 (자수 추가 상품 단순 변심 환불 불가) 등을 다룸. 주문번호 생성, 결제 승인, 결제 실패 처리, 부분 환불, 가상계좌 입금 확인 등의 모든 결제 관련 로직을 포함.
---

# 결제 플로우 (Payment Flow) Skill

## 핵심 원칙

🔒 **결제는 보안의 최전선** — 다음 원칙을 절대 어기지 않음:

1. **모든 가격 / 합계 계산은 서버에서** (클라이언트 값 신뢰 금지)
2. **재고 확인은 SELECT FOR UPDATE 락**
3. **카드 정보 자체 저장 절대 금지** (PG사 위임, PCI DSS)
4. **결제 완료 = 트랜잭션 커밋 후** (PG 응답 + DB 업데이트 모두 성공)
5. **PG 콜백 검증** (서명 / 토큰 확인)
6. **개발 환경에서 실 결제 절대 금지**

## 주문 상태 머신

```typescript
const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['DESIGN_REVIEW', 'PREPARING', 'CANCELLED', 'REFUND_REQUESTED'],
  DESIGN_REVIEW: ['IN_PRODUCTION', 'REFUND_REQUESTED'],
  IN_PRODUCTION: ['PREPARING'],  // 자수 작업 후 출고 준비
  PREPARING: ['SHIPPING'],
  SHIPPING: ['DELIVERED'],
  DELIVERED: ['CONFIRMED', 'REFUND_REQUESTED'],
  CONFIRMED: [],
  CANCELLED: [],
  REFUND_REQUESTED: ['REFUNDED'],
  REFUNDED: [],
};
```

## 결제 처리 플로우 (트랜잭션)

```typescript
// app/api/orders/route.ts
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const data = await request.json();

  // 1. 입력 검증
  const validated = OrderInputSchema.parse(data);

  // 2. 트랜잭션 시작
  return await prisma.$transaction(async (tx) => {
    // 2-1. 회원 검증
    const member = await tx.member.findUniqueOrThrow({
      where: { id: validated.memberId },
    });

    // 2-2. 상품 / 옵션 검증 + 재고 락 (SELECT FOR UPDATE)
    for (const item of validated.items) {
      const option = await tx.$queryRaw`
        SELECT * FROM product_options
        WHERE id = ${item.optionId}
        FOR UPDATE
      `;

      if (!option || option.stockQuantity < item.quantity) {
        throw new InsufficientStockError(item.optionId);
      }
    }

    // 2-3. 가격 재계산 (서버 측)
    const calculated = await calculateOrderTotal(tx, validated);

    if (calculated.totalAmount !== validated.expectedTotal) {
      // 클라이언트와 서버 합계가 다름 → 가격 변동 또는 조작 시도
      throw new PriceMismatchError(calculated.totalAmount);
    }

    // 2-4. 주문 생성 (PENDING)
    const order = await tx.order.create({
      data: {
        orderNumber: await generateOrderNumber(),
        memberId: validated.memberId,
        status: 'PENDING',
        ...calculated,
        items: { create: validated.items.map(/* ... */) },
      },
    });

    // 2-5. 재고 예약 (reservedQuantity 증가)
    for (const item of validated.items) {
      await tx.productOption.update({
        where: { id: item.optionId },
        data: {
          reservedQuantity: { increment: item.quantity },
        },
      });
    }

    return order;
  });
}
```

## PG사 통합 (토스페이먼츠 예시)

```typescript
// lib/payment/toss.ts
import { TossPayments } from '@tosspayments/payment-sdk';

export async function initiatePayment(orderId: string, paymentMethod: PaymentMethod) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
  });

  // 클라이언트 측 결제 위젯 호출
  const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);

  await tossPayments.requestPayment(paymentMethod, {
    amount: order.totalAmount,
    orderId: order.orderNumber,
    orderName: `주문 ${order.orderNumber}`,
    customerName: order.member.name,
    customerEmail: order.member.email,
    successUrl: `${process.env.NEXT_PUBLIC_URL}/checkout/success`,
    failUrl: `${process.env.NEXT_PUBLIC_URL}/checkout/fail`,
  });
}

// 서버 측 결제 승인 (success URL 콜백)
export async function approvePayment({
  paymentKey,
  orderId,
  amount,
}: {
  paymentKey: string;
  orderId: string;
  amount: number;
}) {
  // 1. 토스 API 호출 (서명 검증 포함)
  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  if (!response.ok) {
    throw new PaymentApprovalError(await response.json());
  }

  const result = await response.json();

  // 2. 트랜잭션으로 주문 / 결제 / 재고 업데이트
  await prisma.$transaction(async (tx) => {
    // 주문 상태 PAID
    const order = await tx.order.update({
      where: { orderNumber: orderId },
      data: { status: 'PAID', paidAt: new Date() },
      include: { items: true },
    });

    // 결제 정보 저장
    await tx.payment.create({
      data: {
        orderId: order.id,
        method: result.method,
        amount: result.totalAmount,
        pgProvider: 'TOSS',
        pgTransactionId: paymentKey,
        pgApprovalNumber: result.approvedAt,
        status: 'APPROVED',
        approvedAt: new Date(result.approvedAt),
      },
    });

    // 재고 차감 (reservedQuantity → stockQuantity)
    for (const item of order.items) {
      await tx.productOption.update({
        where: { id: item.optionId },
        data: {
          stockQuantity: { decrement: item.quantity },
          reservedQuantity: { decrement: item.quantity },
        },
      });
    }

    // 자수 시안이 있으면 디자이너에게 알림
    const hasEmbroidery = order.items.some(i => i.embroideryFee > 0);
    if (hasEmbroidery) {
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'DESIGN_REVIEW' },
      });
      await notifyDesigner(order.id);
    }

    // 적립금 사용 처리
    if (order.pointsUsed > 0) {
      await tx.pointHistory.create({
        data: {
          memberId: order.memberId,
          type: 'USE_PURCHASE',
          amount: -order.pointsUsed,
          relatedOrderId: order.id,
        },
      });
    }
  });

  return result;
}
```

## 환불 정책 (자수 추가 상품 주의)

```typescript
// lib/payment/refund.ts

export async function processRefund(orderId: string, reason: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      items: { include: { embroideryDesigns: true } },
      payment: true,
    },
  });

  // 환불 가능 여부 검증
  const refundability = checkRefundability(order);

  if (!refundability.canRefund) {
    throw new RefundNotAllowedError(refundability.reason);
  }

  // 자수 시작 후 부분 환불 (자수 비용 제외)
  let refundAmount = order.totalAmount;
  for (const item of order.items) {
    for (const design of item.embroideryDesigns) {
      if (['IN_PRODUCTION', 'COMPLETED'].includes(design.status)) {
        // 자수 작업 시작/완료된 자수 비용은 환불 불가
        refundAmount -= design.totalPrice;
      }
    }
  }

  // PG사 환불 API 호출
  await tossPaymentsApi.cancelPayment(order.payment.pgTransactionId, {
    cancelReason: reason,
    cancelAmount: refundAmount,
  });

  // DB 업데이트
  await prisma.$transaction(async (tx) => {
    await tx.refund.create({
      data: {
        orderId,
        reason,
        amount: refundAmount,
        status: 'COMPLETED',
        refundedAt: new Date(),
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { status: 'REFUNDED' },
    });

    // 재고 복구
    for (const item of order.items) {
      await tx.productOption.update({
        where: { id: item.optionId },
        data: { stockQuantity: { increment: item.quantity } },
      });
    }
  });
}

function checkRefundability(order: Order & { items: OrderItem[] }) {
  // 1. 배송 완료 후 7일 초과
  if (order.status === 'DELIVERED' && order.deliveredAt) {
    const daysSinceDelivery = (Date.now() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 7) {
      return { canRefund: false, reason: '교환/환불 기간 (7일) 초과' };
    }
  }

  // 2. 구매 확정 후 환불 불가
  if (order.status === 'CONFIRMED') {
    return { canRefund: false, reason: '구매 확정 후 환불 불가' };
  }

  // 3. 자수 작업 상태 체크
  // (단순 변심 시 자수 작업 시작 후 환불 불가)
  // (제품 불량은 별도 케이스)

  return { canRefund: true };
}
```

## 가상계좌 입금 확인 (Webhook)

```typescript
// app/api/webhooks/payment/virtual-account/route.ts
export async function POST(request: Request) {
  // 1. 서명 검증 (PG사 시크릿)
  const signature = request.headers.get('x-toss-signature');
  if (!verifySignature(signature, await request.text(), process.env.TOSS_SECRET_KEY)) {
    return new Response('Invalid signature', { status: 401 });
  }

  const data = await request.json();

  // 2. 입금 처리
  if (data.status === 'DONE') {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({
        where: { orderNumber: data.orderId },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: 'PAID', paidAt: new Date() },
      });

      // 재고 차감 / 자수 알림 등 후속 처리
    });
  }

  return Response.json({ received: true });
}
```

## 7일 미입금 자동 취소

```typescript
// crons/cancel-unpaid-orders.ts (매일 자정 실행)
export async function cancelUnpaidOrders() {
  const sevenDaysAgo = subDays(new Date(), 7);

  const unpaidOrders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: sevenDaysAgo },
    },
    include: { items: true },
  });

  for (const order of unpaidOrders) {
    await prisma.$transaction(async (tx) => {
      // 주문 취소
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      });

      // 예약 재고 복구
      for (const item of order.items) {
        await tx.productOption.update({
          where: { id: item.optionId },
          data: { reservedQuantity: { decrement: item.quantity } },
        });
      }
    });
  }
}
```

## 결제 페이지 컴포넌트 (디자인 시안 21안 기반)

```tsx
// app/(shop)/checkout/page.tsx
- CheckoutForm (서버 컴포넌트로 회원 / 장바구니 / 배송지 로드)
  - StepProgress (3단계: 장바구니→주문서→완료)
  - SectionOrderer (주문자 정보)
  - SectionDelivery (배송지 + 새 주소 추가)
  - SectionItems (주문 상품 목록 + 자수 정보)
  - SectionPayment (결제 수단 5탭)
    - CardPayment
    - EasyPay (카카오/네이버/토스)
    - BankTransfer
    - VirtualAccount
    - TaxInvoice (B2B 사업자만)
  - SectionAgreements (필수 3 + 선택 1)
- CheckoutSidebar (sticky)
  - PriceBreakdown
  - PayButton ("결제하기 252,800원")
```

## 절대 하지 말 것

❌ 클라이언트 가격으로 결제 진행
❌ 카드 번호 / CVV 자체 DB 저장
❌ 결제 승인 전 재고 차감 (예약만)
❌ 자수 작업 진행 중 단순 변심 환불
❌ PG 콜백 서명 검증 없이 처리
❌ 트랜잭션 없이 주문 / 결제 / 재고 분리 처리
❌ 개발 환경에서 실 PG 연동 (테스트 키만 사용)

## 항상 확인할 것

✅ 모든 가격은 서버에서 재계산
✅ 재고는 SELECT FOR UPDATE
✅ PG 응답 검증 + DB 트랜잭션
✅ 결제 실패 시 재고 / 적립금 자동 복구
✅ 7일 미입금 자동 취소 (cron)
✅ 환불 시 자수 작업 상태별 부분 환불

## 관련 파일

- DB 스키마: `docs/database/schema.md` (Order, Payment, Refund)
- 비즈니스 규칙: `docs/domain/business-rules.md` (5. 결제 / 주문)
- 디자인 시안: `/mnt/user-data/outputs/workwear/21_checkout.html`, `22_order_complete.html`
