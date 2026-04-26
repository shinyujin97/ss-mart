---
name: bulk-order-flow
description: B2B 단체주문 / 견적 시스템 개발 시 사용. 견적 요청 폼, 매니저 배정, 견적서 작성, 단체주문 생성, 분할 배송, 세금계산서 발행, 신용 거래 등 B2B 워크플로우 전반을 다룸. 100벌 이상 단체할인 30%, 사이즈별 수량 입력, 자수 무료 정책, B2B 결제 5가지 옵션 (일시/분할/신용)을 포함. 단체주문은 일반 주문과 별도 시스템으로 운영되며 매니저 SLA 2시간, 견적 발송 1~2영업일, 제작 5~14일 등의 운영 규칙을 따름.
---

# 단체주문 (B2B Bulk Order) Skill

## 핵심 규칙

1. **100벌 이상 단체주문 자격** (또는 자수 추가 50벌+, 또는 견적가 500만원+)
2. **할인율은 수량별 차등** (100~199벌 20%, 200~499벌 25%, 500벌+ 30%)
3. **자수 / 마킹 무료 포함** (COMPUTER, PATCH, SILK_PRINT만)
4. **세금계산서 자동 발행** (사업자 회원만)
5. **매니저 응답 SLA 2시간** (영업시간 내)
6. **견적 유효기간 14일 기본**
7. **단체주문은 일반 주문과 별도 시스템**

## 견적 워크플로우 상태 머신

```typescript
const QUOTE_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  PENDING: ['ASSIGNED', 'REJECTED'],
  ASSIGNED: ['IN_REVIEW', 'REJECTED'],
  IN_REVIEW: ['QUOTED', 'REJECTED'],
  QUOTED: ['ACCEPTED', 'REJECTED', 'EXPIRED'],
  ACCEPTED: ['CONVERTED'],  // 단체주문으로 전환
  CONVERTED: [],
  REJECTED: [],
  EXPIRED: [],
};

const BULK_ORDER_TRANSITIONS: Record<BulkOrderStatus, BulkOrderStatus[]> = {
  CONTRACT_PENDING: ['CONTRACT_SIGNED', 'CANCELLED'],
  CONTRACT_SIGNED: ['DESIGN_IN_PROGRESS', 'CANCELLED'],
  DESIGN_IN_PROGRESS: ['PRODUCTION_PENDING', 'CANCELLED'],
  PRODUCTION_PENDING: ['IN_PRODUCTION'],
  IN_PRODUCTION: ['PARTIAL_DELIVERED', 'COMPLETED', 'CANCELLED'],
  PARTIAL_DELIVERED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};
```

## 단체할인 계산

```typescript
// lib/bulk-order/discount.ts
export function calculateBulkDiscount(quantity: number): number {
  if (quantity >= 1000) return 0.30;  // 협의 가능
  if (quantity >= 500) return 0.30;
  if (quantity >= 200) return 0.25;
  if (quantity >= 100) return 0.20;
  return 0;
}

export function calculateBulkPrice({
  basePrice,
  quantity,
  embroideryRequested,
  embroideryType,
}: {
  basePrice: number;
  quantity: number;
  embroideryRequested: boolean;
  embroideryType?: EmbroideryType;
}) {
  const discountRate = calculateBulkDiscount(quantity);
  const discountedUnitPrice = basePrice * (1 - discountRate);
  const subtotal = discountedUnitPrice * quantity;

  // 자수 비용 (단체할인 시 무료 종류 체크)
  const embroideryFreeTypes: EmbroideryType[] = ['COMPUTER', 'PATCH', 'SILK_PRINT'];
  const embroideryFee =
    embroideryRequested && quantity >= 100 && embroideryType && embroideryFreeTypes.includes(embroideryType)
      ? 0
      : embroideryRequested ? calculateRegularEmbroideryFee(...) : 0;

  // 부가세 (10%)
  const taxableAmount = subtotal + embroideryFee;
  const taxAmount = Math.round(taxableAmount * 0.1);

  return {
    unitPrice: Math.round(discountedUnitPrice),
    subtotal: Math.round(subtotal),
    embroideryFee,
    taxAmount,
    totalAmount: taxableAmount + taxAmount,
  };
}
```

## 견적 폼 검증

```typescript
// lib/bulk-order/validation.ts
import { z } from 'zod';

export const QuoteRequestSchema = z.object({
  // 회사 정보
  companyName: z.string().min(1, '회사명을 입력하세요'),
  businessNumber: z.string()
    .regex(/^\d{3}-\d{2}-\d{5}$/, '사업자등록번호 형식이 올바르지 않습니다')
    .optional(),
  managerName: z.string().min(1),
  managerPosition: z.string().optional(),
  managerPhone: z.string().regex(/^010-\d{4}-\d{4}$/),
  managerEmail: z.string().email(),

  // 카테고리 (다중 선택, 최소 1개)
  categories: z.array(z.string()).min(1, '카테고리를 선택하세요'),

  // 사이즈별 수량
  sizeQuantities: z.record(z.string(), z.number().min(0)),

  // 총 수량은 100벌 이상이거나 자수 옵션 50벌+
  embroideryRequested: z.boolean(),

  // 자수 옵션 (선택)
  embroideryType: z.enum(['COMPUTER', 'PATCH', /* ... */]).optional(),
  embroideryPosition: z.enum(['LEFT_CHEST', /* ... */]).optional(),
  embroideryContent: z.string().optional(),
  logoFileUrl: z.string().url().optional(),

  // 일정 / 예산
  desiredDeliveryDate: z.string().datetime().optional(),
  budgetRange: z.string().optional(),
  paymentMethod: z.enum(['ONE_TIME', 'SPLIT_50_50', 'SPLIT_30_70', 'CREDIT', 'TAX_INVOICE']),

  // 추가 요청
  additionalNotes: z.string().max(2000).optional(),

  // 약관
  privacyAgreed: z.boolean().refine(v => v === true, '개인정보 수집 동의 필수'),
}).refine((data) => {
  const total = Object.values(data.sizeQuantities).reduce((a, b) => a + b, 0);
  if (data.embroideryRequested && total >= 50) return true;
  return total >= 100;
}, '단체주문은 100벌 이상 (자수 추가 시 50벌 이상)이어야 합니다');
```

## 견적번호 / 단체주문번호 생성

```typescript
// lib/bulk-order/numbering.ts
export async function generateQuoteNumber(): Promise<string> {
  const date = format(new Date(), 'yyyy-MM');
  const lastQuote = await prisma.quoteRequest.findFirst({
    where: { requestNumber: { startsWith: `SS-Q-${date}` } },
    orderBy: { createdAt: 'desc' },
  });

  const sequence = lastQuote
    ? parseInt(lastQuote.requestNumber.split('-').pop()!) + 1
    : 1;

  return `SS-Q-${date}-${String(sequence).padStart(3, '0')}`;
}

export async function generateBulkOrderNumber(): Promise<string> {
  // 동일 패턴: SS-B-YYYY-MM-001
}
```

## 매니저 배정 로직

```typescript
// lib/bulk-order/manager-assignment.ts
export async function assignManager(quoteRequestId: string) {
  // 1. 활성 매니저 조회 (라운드 로빈 또는 부하 분산)
  const managers = await prisma.user.findMany({
    where: { role: 'BULK_ORDER_MANAGER', isActive: true },
    include: {
      assignedQuotes: {
        where: { status: { in: ['ASSIGNED', 'IN_REVIEW'] } },
      },
    },
  });

  // 2. 가장 적게 할당된 매니저 선택
  const targetManager = managers.sort(
    (a, b) => a.assignedQuotes.length - b.assignedQuotes.length
  )[0];

  if (!targetManager) {
    throw new Error('배정 가능한 매니저가 없습니다');
  }

  // 3. 견적 업데이트
  await prisma.quoteRequest.update({
    where: { id: quoteRequestId },
    data: {
      assignedManagerId: targetManager.id,
      assignedAt: new Date(),
      status: 'ASSIGNED',
    },
  });

  // 4. 매니저에게 Slack / 이메일 알림
  await notifyManager(targetManager, quoteRequestId);

  return targetManager;
}
```

## 견적서 PDF 생성

```typescript
// lib/bulk-order/quote-pdf.ts
import { jsPDF } from 'jspdf';

export async function generateQuotePDF(quoteRequestId: string): Promise<string> {
  const quote = await prisma.quoteRequest.findUnique({
    where: { id: quoteRequestId },
    include: { member: { include: { businessInfo: true } } },
  });

  const doc = new jsPDF();

  // 1. 헤더 (로고, 회사명, 견적서)
  // 2. 견적 정보 (번호, 일자, 유효기간)
  // 3. 회사 정보 (수신처)
  // 4. 상품 내역 (카테고리, 사이즈별 수량, 단가)
  // 5. 자수 / 마킹 옵션
  // 6. 부가세 (10%)
  // 7. 총액
  // 8. 결제 조건
  // 9. 납품 일정
  // 10. 매니저 연락처

  const pdfBuffer = doc.output('arraybuffer');

  // S3 / Cloudinary 업로드
  const url = await uploadFile(pdfBuffer, `quotes/${quote.requestNumber}.pdf`);

  return url;
}
```

## 분할 배송 처리

```typescript
// lib/bulk-order/split-shipping.ts
interface SplitShipmentInfo {
  totalQuantity: number;
  shipments: Array<{
    sequenceNumber: number;
    quantity: number;
    expectedDate: string;
    address: string;
    deliveryNote?: string;
  }>;
}

export async function createSplitShipments(
  bulkOrderId: string,
  splitInfo: SplitShipmentInfo
) {
  const totalSplit = splitInfo.shipments.reduce(
    (sum, s) => sum + s.quantity,
    0
  );

  if (totalSplit !== splitInfo.totalQuantity) {
    throw new Error('분할 배송 수량 합계가 일치하지 않습니다');
  }

  // 각 분할 배송마다 별도 Order 생성
  for (const shipment of splitInfo.shipments) {
    await prisma.order.create({
      data: {
        bulkOrderId,
        // ... 분할 주문 정보
      },
    });
  }
}
```

## 세금계산서 자동 발행

```typescript
// lib/tax-invoice/issue.ts
export async function issueTaxInvoice(bulkOrderId: string) {
  const order = await prisma.bulkOrder.findUnique({
    where: { id: bulkOrderId },
    include: { member: { include: { businessInfo: true } } },
  });

  if (!order.member.businessInfo) {
    throw new Error('사업자 정보가 없습니다');
  }

  // PG사 세금계산서 API 호출 (예: 토스페이먼츠)
  const result = await tossPaymentsApi.issueTaxInvoice({
    businessNumber: order.member.businessInfo.businessNumber,
    companyName: order.member.businessInfo.companyName,
    representativeName: order.member.businessInfo.representativeName,
    email: order.member.businessInfo.taxInvoiceEmail,
    amount: order.totalAmount,
    taxAmount: order.taxAmount,
    items: [/* 상품 내역 */],
  });

  // 세금계산서 번호 저장
  await prisma.payment.update({
    where: { orderId: bulkOrderId },
    data: {
      taxInvoiceIssued: true,
      taxInvoiceNumber: result.invoiceNumber,
    },
  });

  return result;
}
```

## 알림 / SLA 관리

```typescript
// lib/bulk-order/sla-monitoring.ts

// 영업시간 체크 (평일 9-18시, 점심 12-13시 제외)
function isBusinessHours(date: Date): boolean {
  const day = date.getDay();
  const hour = date.getHours();

  if (day === 0 || day === 6) return false; // 주말
  if (hour < 9 || hour >= 18) return false;
  if (hour === 12) return false; // 점심
  return true;
}

// 영업시간 기준 N시간 추가
export function addBusinessHours(start: Date, hours: number): Date {
  // 영업시간만 카운트하여 마감 시간 계산
}

// 매 30분마다 SLA 미준수 견적 체크 (Cron job)
export async function checkSLAViolations() {
  const now = new Date();

  const overdueQuotes = await prisma.quoteRequest.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: addBusinessHours(now, -2) },
    },
  });

  for (const quote of overdueQuotes) {
    // 사장님 / 매니저에게 SLA 위반 알림
    await notifySlaViolation(quote);
  }
}
```

## 단체주문 폼 컴포넌트 패턴

```tsx
// app/(shop)/bulk-order/page.tsx
- BulkOrderForm
  - SectionCompanyInfo      (회사 정보 6필드)
  - SectionCategorySelect   (11개 카테고리 멀티 체크)
  - SectionSizeQuantity     (사이즈별 수량 + TOTAL 자동 합계 ★)
  - SectionEmbroidery       (자수 토글 + 옵션 + 파일 업로드)
  - SectionSchedule         (납기/예산/결제방식)
  - SectionAdditional       (자유 텍스트)
  - SectionAgreements       (필수 1, 선택 1)

- BulkOrderSidebar (sticky)
  - ProcessSteps (6단계 진행 표시)
  - BenefitList (5가지 혜택)
  - DirectContact (1588-0000 + 카톡)
```

## 절대 하지 말 것

❌ 100벌 미만 견적을 단체주문으로 처리
❌ 사업자 회원이 아닌데 세금계산서 자동 발행
❌ 매니저 승인 없이 견적서 자동 발송
❌ 견적 유효기간 무시 (반드시 만료 처리)
❌ 단체주문에서 자수 비용 클라이언트 계산값만 신뢰
❌ 분할 배송 시 수량 합계 검증 누락

## 항상 확인할 것

✅ 견적 요청 → 매니저 배정 (2시간 이내 SLA)
✅ 사업자번호 검증 (정규식 + 외부 API)
✅ 사이즈별 수량 합계 자동 검증
✅ 자수 무료 종류 체크 (COMPUTER/PATCH/SILK_PRINT)
✅ 견적서 14일 유효기간 자동 만료
✅ 세금계산서 발행 시 PG사 API 응답 저장

## 관련 파일

- DB 스키마: `docs/database/schema.md` (QuoteRequest, BulkOrder)
- 비즈니스 규칙: `docs/domain/business-rules.md` (2. 단체주문)
- 디자인 시안: `/mnt/user-data/outputs/workwear/26_bulk_order.html`
