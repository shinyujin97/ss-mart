# 코딩 표준 (Coding Standards)

> 모든 개발자가 따라야 할 컨벤션. ESLint / Biome / Husky 로 자동 강제.

## TypeScript

### Strict 모드 필수

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### `any` 사용 금지

```typescript
// ❌ 금지
function process(data: any) { }

// ✅ 권장
function process<T>(data: T) { }
function process(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // ...
  }
}
```

### Enum 우선 (문자열 리터럴 X)

```typescript
// ❌ 오타 위험
type Status = 'pending' | 'paid' | 'shippped';  // 오타!

// ✅ Prisma enum + import
import { OrderStatus } from '@prisma/client';
type Status = OrderStatus;
```

## 파일 구조

### Next.js App Router

```
app/
├── (shop)/                   # 라우트 그룹 (URL 영향 X)
│   ├── layout.tsx            # 쇼핑 공통 레이아웃
│   ├── page.tsx              # / 메인
│   ├── products/
│   │   ├── [slug]/
│   │   │   ├── page.tsx
│   │   │   └── _components/  # 페이지별 컴포넌트
│   │   └── page.tsx          # 상품 검색
│   └── cart/
│       └── page.tsx
├── (auth)/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (mypage)/
│   └── mypage/...
├── api/
│   ├── orders/route.ts
│   └── embroidery/...
└── admin/                    # 관리자 (별도 인증)

components/                   # 전역 재사용 컴포넌트
├── layout/
├── ui/                       # Button, Input 등
└── (도메인별)/

lib/                          # 비즈니스 로직 / 유틸
├── prisma.ts                 # Prisma 클라이언트
├── auth/
├── embroidery/
├── payment/
└── utils.ts

constants/                    # 상수 (자수 단가 등)
types/                        # 공통 타입
hooks/                        # React 커스텀 훅
```

### 파일 명명

```
컴포넌트: PascalCase.tsx        (ProductCard.tsx)
유틸 / 훅: camelCase.ts          (formatPrice.ts, useCart.ts)
상수: UPPER_SNAKE.ts            (EMBROIDERY_PRICES.ts)
타입 only: types.ts             (types/order.ts)
페이지: page.tsx (App Router)
API: route.ts (App Router)
테스트: *.test.ts / *.spec.ts
```

## 함수 / 변수

### 명명 규칙

```typescript
// ✅ 함수: 동사 시작
function calculateEmbroideryPrice() { }
function fetchOrders() { }
function handleSubmit() { }
function isValidBusinessNumber() { }  // boolean

// ✅ 변수: 명사
const totalAmount = 0;
const isLoading = false;            // boolean
const hasEmbroidery = false;        // boolean

// ✅ 상수: UPPER_SNAKE
const MAX_QUANTITY = 1000;
const EMBROIDERY_TYPES = { ... };
```

### Props 타입 정의

```typescript
// ✅ interface 또는 type 명시
interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  className?: string;
}

export function ProductCard({ product, onAddToCart, className }: ProductCardProps) {
  // ...
}

// ❌ inline (재사용성 떨어짐)
export function ProductCard({ product }: { product: Product }) { }
```

## Imports

### 순서 (eslint-plugin-import 자동 정렬)

```typescript
// 1. Node modules
import { useState } from 'react';
import Image from 'next/image';
import { z } from 'zod';

// 2. Path alias (절대 경로)
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/Button';
import type { Product } from '@/types/product';

// 3. Relative imports
import { ProductGallery } from './ProductGallery';
import { calculatePrice } from '../utils';

// 4. Type imports (별도 분리 권장)
import type { OrderStatus } from '@prisma/client';
```

### Path alias 설정

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## React / Next.js

### Server Components 우선

```typescript
// ✅ 기본은 Server Component
// app/products/[slug]/page.tsx
export default async function ProductPage({ params }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
  });
  return <ProductDetail product={product} />;
}

// ✅ 인터랙션 필요한 부분만 'use client'
// components/product/AddToCartButton.tsx
'use client';
export function AddToCartButton({ productId }) {
  const [loading, setLoading] = useState(false);
  // ...
}
```

### use client 위치

```typescript
// ✅ 가능한 leaf 컴포넌트에 'use client'
// 부모는 Server Component 유지

// ❌ 페이지 전체 'use client' 금지
```

### Image 최적화

```tsx
// ✅ next/image
import Image from 'next/image';
<Image
  src={product.imageUrl}
  alt={product.name}
  width={400}
  height={400}
  sizes="(max-width: 768px) 50vw, 25vw"
/>

// ❌ 일반 img
<img src={product.imageUrl} />
```

## 데이터 페치

### Server Component (권장)

```typescript
export default async function Page() {
  const products = await prisma.product.findMany({ /* ... */ });
  return <ProductList products={products} />;
}
```

### Client Component (필요 시)

```typescript
'use client';
import useSWR from 'swr';

export function CartItems() {
  const { data, error } = useSWR('/api/cart', fetcher);
  // ...
}
```

### Server Actions (폼)

```typescript
// app/actions/order.ts
'use server';

export async function createOrder(formData: FormData) {
  const validated = OrderSchema.parse(Object.fromEntries(formData));
  // DB 저장
  revalidatePath('/cart');
  redirect('/checkout');
}
```

## 검증

### Zod 사용 (모든 외부 입력)

```typescript
// lib/validation/order.ts
export const OrderInputSchema = z.object({
  items: z.array(z.object({
    productId: z.string().cuid(),
    optionId: z.string().cuid(),
    quantity: z.number().int().min(1).max(1000),
  })).min(1),
  shippingAddress: z.object({ /* ... */ }),
});

// API 라우트
export async function POST(request: Request) {
  const body = await request.json();
  const validated = OrderInputSchema.parse(body);  // 자동 throw
  // ...
}
```

## 에러 처리

### 커스텀 에러 클래스

```typescript
// lib/errors.ts
export class BusinessError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}

export class InsufficientStockError extends BusinessError {
  constructor(productId: string) {
    super(`재고 부족: ${productId}`, 'INSUFFICIENT_STOCK', 409);
  }
}

export class CopyrightViolationError extends BusinessError {
  constructor(reason: string) {
    super(`저작권 위반: ${reason}`, 'COPYRIGHT_VIOLATION', 403);
  }
}
```

### API 에러 응답

```typescript
// app/api/orders/route.ts
export async function POST(request: Request) {
  try {
    // ...
  } catch (error) {
    if (error instanceof BusinessError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: '입력 검증 실패', issues: error.issues },
        { status: 400 }
      );
    }
    // 예상 못한 에러는 Sentry 로 전송
    captureException(error);
    return Response.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
```

## 데이터베이스 (Prisma)

### 트랜잭션 우선

```typescript
// ✅ 여러 테이블 변경은 트랜잭션
await prisma.$transaction(async (tx) => {
  await tx.order.create({ /* ... */ });
  await tx.payment.create({ /* ... */ });
  await tx.productOption.update({ /* ... */ });
});
```

### N+1 방지

```typescript
// ❌ N+1 (각 product마다 brand 쿼리)
const products = await prisma.product.findMany();
for (const p of products) {
  const brand = await prisma.brand.findUnique({ where: { id: p.brandId } });
}

// ✅ include 한 번에
const products = await prisma.product.findMany({
  include: { brand: true, images: { take: 1 } },
});
```

## Git 커밋 메시지

### Conventional Commits

```
feat: 자수 시뮬레이터 4면 뷰 추가
fix: 단체주문 사이즈별 수량 합계 계산 오류
refactor: 결제 트랜잭션 로직 분리
docs: 비즈니스 규칙 문서 업데이트
test: 자수 가격 계산 테스트 추가
chore: prisma 6.0 업그레이드
style: ProductCard 디자인 토큰 정렬
perf: 상품 검색 인덱스 추가
```

### 영향 범위 명시

```
feat(embroidery): 캐릭터 디자인 자수 종류 추가
fix(payment): 가상계좌 입금 확인 webhook 오류
```

## 보안

### 절대 하지 말 것

```typescript
// ❌ 절대 금지
console.log(process.env.DATABASE_URL);
console.log(`카드번호: ${cardNumber}`);
const password = req.body.password;
db.query(`SELECT * FROM users WHERE email = '${email}'`);  // SQL injection
```

### 안전한 패턴

```typescript
// ✅ Prisma 사용 (자동 escape)
db.user.findUnique({ where: { email } });

// ✅ 비밀번호 해싱
import bcrypt from 'bcryptjs';
const hash = await bcrypt.hash(password, 12);

// ✅ 로그 마스킹
logger.info({ orderId, userId, /* card 정보 X */ });
```

## 컴포넌트 작성

### 디자인 토큰 사용

```tsx
// ✅ Tailwind config 의 토큰
<div className="bg-red text-white px-4 py-2">

// ❌ 직접 hex
<div className="bg-[#c8161d] text-[#ffffff]">
<div style={{ backgroundColor: '#c8161d' }}>
```

### cn() 유틸로 조건부 클래스

```tsx
import { cn } from '@/lib/utils';

<button className={cn(
  'px-4 py-2 font-bold',
  variant === 'primary' && 'bg-red text-white',
  variant === 'secondary' && 'bg-black text-yellow',
  isLoading && 'opacity-50 cursor-not-allowed',
  className
)}>
```

## 테스트

- 비즈니스 로직 100% 테스트 커버리지 목표
- E2E 는 핵심 플로우만 (로그인 / 결제 / 자수 추가)
- 자세한 가이드: `.claude/agents/test-writer.md`

## 자동 강제 (CI / Hooks)

```bash
# Husky pre-commit
- lint-staged (변경 파일만 lint + format)
- typecheck
- 단위 테스트 (변경 영향 받는 파일)

# CI Pipeline
- npm run lint
- npm run typecheck
- npm run test
- npm run build
```

## 도구 설정 파일

```
.eslintrc.json
biome.json (또는 .prettierrc)
.husky/pre-commit
tsconfig.json
```
