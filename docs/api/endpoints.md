# API 엔드포인트 명세

> Next.js App Router 기반. REST API + Server Actions 혼용.

## 인증 (`app/api/auth/`)

NextAuth v5 가 자동 처리. 별도 라우트 작성 X.

```
GET  /api/auth/signin            로그인 페이지
GET  /api/auth/signout           로그아웃
GET  /api/auth/callback/{provider}  소셜 콜백
GET  /api/auth/session           현재 세션
```

## 회원 (`app/api/members/`)

```
POST   /api/members              회원가입
GET    /api/members/me           내 정보
PATCH  /api/members/me           내 정보 수정
DELETE /api/members/me           회원 탈퇴
GET    /api/members/me/points    적립금 내역
GET    /api/members/me/coupons   내 쿠폰
GET    /api/members/me/addresses 배송지 목록
POST   /api/members/me/addresses 배송지 추가
PATCH  /api/members/me/addresses/[id]  배송지 수정
DELETE /api/members/me/addresses/[id]  배송지 삭제
```

### 사업자 회원 가입

```
POST /api/members/business
{
  "email": "...",
  "password": "...",
  "businessNumber": "000-00-00000",
  "companyName": "...",
  "representativeName": "...",
  "taxInvoiceEmail": "..."
}
→ 201 Created + 사업자번호 검증 결과
```

## 상품 (`app/api/products/`)

```
GET /api/products
  ?q={keyword}
  &category={slug}
  &brand={slug,slug}
  &minPrice={n}&maxPrice={n}
  &sort=NEWEST|POPULAR|PRICE_LOW|PRICE_HIGH|RATING
  &page={n}&perPage={n}

GET /api/products/[slug]
GET /api/products/[slug]/reviews?page={n}
GET /api/categories
GET /api/categories/[slug]
GET /api/brands
GET /api/brands/[slug]
```

## 장바구니 (`app/api/cart/`)

```
GET    /api/cart                내 장바구니
POST   /api/cart                상품 추가
PATCH  /api/cart/[itemId]       수량 변경
DELETE /api/cart/[itemId]       삭제
DELETE /api/cart                전체 비우기

# 추가:
POST /api/cart/with-embroidery  자수 옵션 포함 추가
```

## 주문 / 결제 (`app/api/orders/`)

```
GET  /api/orders                내 주문 목록 (?status=&page=)
GET  /api/orders/[id]           주문 상세
POST /api/orders                주문 생성 (PENDING)
  {
    items: [{ productId, optionId, quantity, embroideryDesignId? }],
    addressId,
    couponId?,
    pointsToUse: number,
    paymentMethod: '...',
    expectedTotal: number  // 서버 검증용
  }
  → 201 + { orderId, paymentUrl }

POST /api/orders/[id]/confirm   구매 확정 (배송 후)
POST /api/orders/[id]/cancel    취소 요청
POST /api/orders/[id]/refund    환불 요청
```

### 결제 콜백

```
GET  /api/payment/success       토스 결제 성공 콜백
GET  /api/payment/fail          결제 실패 콜백
POST /api/webhooks/toss         가상계좌 입금 / 자동 취소
  - 서명 검증 필수
```

## 자수 (`app/api/embroidery/`)

```
GET  /api/embroidery/designs
  ?status=DRAFT|CONFIRMED|...
  → 내 시안 목록

GET  /api/embroidery/designs/[id]
POST /api/embroidery/designs    시안 생성
PATCH /api/embroidery/designs/[id]   수정 (revisionCount++)
POST /api/embroidery/designs/[id]/confirm  시안 확정
POST /api/embroidery/designs/[id]/cancel   시안 취소

POST /api/embroidery/calculate-price
  {
    type: 'COMPUTER',
    size: 'MEDIUM',
    positions: ['LEFT_CHEST'],
    quantity: 5
  }
  → { unitPrice: 6500, totalPrice: 32500 }

POST /api/embroidery/upload-logo
  multipart/form-data
  → Supabase Storage 업로드
  → { url: '...' }

POST /api/embroidery/validate-copyright
  { text: "...", imageUrl: "..." }
  → { passed: true } 또는 { passed: false, reason: '...' }
```

## 단체주문 (`app/api/bulk-order/`)

```
POST /api/bulk-order/quote      견적 요청
  {
    companyName, businessNumber?,
    managerName, managerPhone, managerEmail,
    categories: [...],
    sizeQuantities: { S: 0, M: 20, ... },
    embroideryRequested: true,
    embroideryType?, embroideryPosition?,
    desiredDeliveryDate, budgetRange,
    paymentMethod, additionalNotes?,
    privacyAgreed: true
  }
  → 201 + { quoteRequestId, requestNumber }
  → 매니저에게 Slack 알림

GET  /api/bulk-order/quotes/[id]  내 견적 조회
POST /api/bulk-order/quotes/[id]/accept  견적 수락
POST /api/bulk-order/quotes/[id]/reject  견적 거절

GET  /api/bulk-order/orders/[id]  단체 주문 조회
POST /api/bulk-order/orders/[id]/confirm-design  시안 확정
```

## 리뷰 (`app/api/reviews/`)

```
GET  /api/reviews?productId={id}&page={n}
POST /api/reviews
  {
    productId, orderItemId,
    rating, title?, content, tags[], imageUrls[]
  }
  → 적립금 자동 지급

DELETE /api/reviews/[id]
POST   /api/reviews/[id]/helpful
POST   /api/reviews/[id]/report
```

## 위시리스트 (`app/api/wishlist/`)

```
GET    /api/wishlist
POST   /api/wishlist  { productId }
DELETE /api/wishlist/[productId]
```

## 1:1 문의 (`app/api/inquiries/`)

```
GET  /api/inquiries           내 문의 목록
POST /api/inquiries           문의 생성
GET  /api/inquiries/[id]
POST /api/inquiries/[id]/reply  관리자 답변
```

## Cron / Webhooks (`app/api/cron/`)

⚠️ Vercel Cron 만 호출. `Authorization: Bearer ${CRON_SECRET}` 검증.

```
GET /api/cron/cancel-unpaid-orders     매일 자정 (7일+ 미입금)
GET /api/cron/check-quote-sla          영업시간 30분마다
GET /api/cron/expire-coupons           매일
GET /api/cron/award-confirmed-points   매일 (구매 확정 7일+)
GET /api/cron/check-low-stock          매일
GET /api/cron/health                   외부 모니터링
```

## 관리자 (`app/api/admin/`)

⚠️ `app/api/admin/*` 모든 라우트는 ADMIN 역할 검증.

```
GET    /api/admin/dashboard      매출 / 주문 통계
GET    /api/admin/orders          전체 주문
PATCH  /api/admin/orders/[id]/status  상태 변경
GET    /api/admin/quotes          전체 견적
PATCH  /api/admin/quotes/[id]/assign  매니저 배정
POST   /api/admin/quotes/[id]/send-quote  견적서 발송
GET    /api/admin/embroidery/designs  자수 시안 (디자이너용)
PATCH  /api/admin/embroidery/[id]/status
POST   /api/admin/products       상품 등록
PATCH  /api/admin/products/[id]
DELETE /api/admin/products/[id]
POST   /api/admin/products/[id]/options  옵션 추가
PATCH  /api/admin/inventory/[id] 재고 조정
GET    /api/admin/members        회원 검색
PATCH  /api/admin/members/[id]/role  역할 변경
```

## 응답 표준

### 성공

```json
{
  "data": { ... }
}

// 또는 페이지네이션
{
  "data": [...],
  "meta": {
    "page": 1,
    "perPage": 24,
    "total": 1283,
    "totalPages": 54
  }
}
```

### 에러

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "재고가 부족합니다",
    "details": {
      "productId": "...",
      "requested": 10,
      "available": 5
    }
  }
}
```

### 에러 코드 표준

```typescript
type ErrorCode =
  // 4xx
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'

  // 비즈니스
  | 'INSUFFICIENT_STOCK'
  | 'PRICE_MISMATCH'
  | 'PAYMENT_FAILED'
  | 'COPYRIGHT_VIOLATION'
  | 'EMBROIDERY_REFUND_NOT_ALLOWED'
  | 'BULK_ORDER_QUANTITY_INVALID'
  | 'TAX_INVOICE_NOT_ELIGIBLE'

  // 5xx
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'DATABASE_ERROR'
  | 'EXTERNAL_API_ERROR';
```

## 인증 / 권한

```typescript
// 인증 필요한 라우트
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json(
      { error: { code: 'UNAUTHORIZED' } },
      { status: 401 }
    );
  }
  // ...
}

// 역할 검증
function requireRole(session: Session, role: Role | Role[]) {
  const required = Array.isArray(role) ? role : [role];
  const userRole = session.user.role;
  if (!required.includes(userRole)) {
    throw new ForbiddenError();
  }
}
```

## Server Actions 사용

```typescript
// app/actions/order.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createOrder(formData: FormData) {
  const session = await auth();
  if (!session) throw new UnauthorizedError();

  const validated = OrderSchema.parse(Object.fromEntries(formData));
  const order = await prisma.$transaction(async (tx) => {
    // ...
  });

  revalidatePath('/cart');
  redirect(`/checkout/${order.id}`);
}
```

## Rate Limiting

```typescript
// middleware.ts (Next.js 미들웨어)
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: redisClient,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
});

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return Response.json(
        { error: { code: 'RATE_LIMITED' } },
        { status: 429 }
      );
    }
  }
}
```
