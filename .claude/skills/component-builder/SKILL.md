---
name: component-builder
description: HTML 디자인 시안을 React/Next.js 컴포넌트로 변환할 때 사용. /mnt/user-data/outputs/workwear/ 의 15개 시안 HTML 파일을 기반으로 컴포넌트를 생성. Tailwind CSS + 디자인 토큰 (--red, --black, --yellow, Bebas Neue, IBM Plex Mono, Noto Sans KR) 정확히 매핑. Server Components 우선, 클라이언트 컴포넌트는 인터랙션 필요 시만. 직각 도형 (border-radius 0), 인더스트리얼 카탈로그 톤 유지. 모든 시안의 컴포넌트는 재사용 가능한 단위로 분리.
---

# 컴포넌트 빌더 (Component Builder) Skill

## 작업 원칙

1. **시안 우선** — `/mnt/user-data/outputs/workwear/` HTML을 먼저 확인
2. **디자인 토큰 정확히 재현** (CSS 변수 → Tailwind config 매핑)
3. **Server Components 우선** (Next.js App Router)
4. **클라이언트 컴포넌트는 인터랙션 필요 시만**
5. **재사용 가능한 단위로 분리** (Atom → Molecule → Organism)

## 디자인 토큰 (Tailwind 매핑)

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        red: {
          DEFAULT: '#c8161d',
          dark: '#9c0e15',
        },
        black: {
          DEFAULT: '#111',
          900: '#1a1a1a',
        },
        gray: {
          900: '#1a1a1a',
          700: '#4a4a4a',
          500: '#8a8a8a',
          300: '#d8d8d8',
          100: '#f4f4f4',
          50: '#fafafa',
        },
        line: '#e5e5e5',
        yellow: '#ffd400',
      },
      fontFamily: {
        sans: ['var(--font-noto-sans-kr)', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'monospace'],
        display: ['var(--font-bebas-neue)', 'sans-serif'],
      },
      letterSpacing: {
        wide: '0.5px',
        wider: '1px',
        widest: '1.5px',
        'extra-wide': '3px',
      },
      borderRadius: {
        none: '0',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

## 폰트 로드 (`app/layout.tsx`)

```tsx
import { Noto_Sans_KR, IBM_Plex_Mono, Bebas_Neue } from 'next/font/google';

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-noto-sans-kr',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
});

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bebas-neue',
});

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${ibmPlexMono.variable} ${bebasNeue.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

## 공통 레이아웃 컴포넌트

시안 모든 페이지에 공통으로 들어가는 레이아웃:

```tsx
// components/layout/Header.tsx
export function Header() {
  return (
    <>
      <TopBar />          {/* 회색 상단 바 */}
      <MainHeader />      {/* 로고 + 검색 + 아이콘 */}
      <Navigation />      {/* 검정 네비게이션 */}
    </>
  );
}

// components/layout/Footer.tsx
export function Footer() {
  return (
    <footer className="bg-black-900 text-gray-500 py-12">
      {/* 4컬럼 그리드 */}
    </footer>
  );
}

// components/layout/FloatingChat.tsx (모든 페이지)
'use client';
export function FloatingChat() { /* 우하단 빨간 박스 */ }
```

## 컴포넌트 분류 / 위치

```
components/
├── layout/                  # 공통 레이아웃
│   ├── Header.tsx
│   ├── TopBar.tsx
│   ├── Navigation.tsx
│   ├── Footer.tsx
│   └── FloatingChat.tsx
├── ui/                      # 재사용 atom/molecule
│   ├── Badge.tsx           # NEW/SALE/BEST/KCs 배지
│   ├── Button.tsx          # 기본/빨강/검정 버튼
│   ├── Checkbox.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Tag.tsx             # EMB/BULK 태그
│   ├── ProductCard.tsx     # 상품 카드 (그리드)
│   ├── PriceDisplay.tsx
│   ├── StarRating.tsx
│   ├── StepProgress.tsx    # 3-4단계 진행 표시
│   └── SectionHeader.tsx   # SECTION/01 라벨 + 타이틀
├── product/
│   ├── ProductGallery.tsx  # 좌측 이미지 갤러리 (18안)
│   ├── ProductOptions.tsx  # 색상/사이즈 선택
│   ├── EmbroideryToggle.tsx
│   ├── ReviewSection.tsx
│   └── QnaSection.tsx
├── cart/
│   ├── CartItem.tsx        # 장바구니 한 항목 (자수 박스 포함)
│   ├── CartGroup.tsx       # 브랜드별 그룹
│   ├── BulkBanner.tsx
│   └── OrderSummary.tsx    # 우측 결제 요약
├── checkout/
│   ├── DeliveryForm.tsx
│   ├── PaymentMethodTabs.tsx
│   └── AgreementSection.tsx
├── embroidery/
│   ├── SimulatorCanvas.tsx # 4면 뷰 시뮬레이터 (17안)
│   ├── DesignCard.tsx      # 시안 카드 (마이페이지)
│   └── EmbroideryFeatures.tsx
└── bulk-order/
    ├── QuoteForm.tsx
    ├── SizeQuantityGrid.tsx
    └── ProcessSidebar.tsx
```

## 시안 → 컴포넌트 변환 패턴

### 예시 1: 모노스페이스 라벨

```html
<!-- 시안 HTML -->
<div class="section-tag">SECTION / 01 ─ DETAIL</div>
<h2 class="section-title">상품 <span class="accent">상세 설명</span></h2>
```

```tsx
// React 컴포넌트
export function SectionHeader({
  number,
  label,
  title,
  accent,
  className,
}: {
  number: string;        // "01"
  label: string;         // "DETAIL"
  title: string;         // "상품 "
  accent?: string;       // "상세 설명"
  className?: string;
}) {
  return (
    <div className={cn('mb-7', className)}>
      <div className="font-mono text-[11px] text-red tracking-[2px] mb-2">
        SECTION / {number} ─ {label}
      </div>
      <h2 className="text-[26px] font-black tracking-[-0.8px] leading-tight">
        {title}
        {accent && <span className="text-red">{accent}</span>}
      </h2>
    </div>
  );
}
```

### 예시 2: 상품 카드

```tsx
// components/ui/ProductCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from './Badge';
import { PriceDisplay } from './PriceDisplay';

interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    brandName: string;
    brandNameKr: string;
    name: string;
    imageUrl: string;
    basePrice: number;
    salePrice: number;
    discountRate?: number;
    rating: number;
    reviewCount: number;
    badges?: Array<'NEW' | 'SALE' | 'BEST'>;
    tags?: Array<'EMB' | 'BULK' | 'KCS'>;
    serialNumber: string;  // "/ 001"
  };
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="block group cursor-pointer transition-transform hover:-translate-y-[3px] duration-200"
    >
      <div className="relative aspect-square bg-gray-100 overflow-hidden mb-3">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-[400ms] group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 50vw, 25vw"
        />

        <div className="absolute top-2.5 left-2.5 bg-white/95 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.5px] font-semibold">
          {product.serialNumber}
        </div>

        {product.badges && (
          <div className="absolute bottom-2.5 left-2.5 flex gap-1">
            {product.badges.map(badge => (
              <Badge key={badge} variant={badge.toLowerCase() as any}>
                {badge}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="font-mono text-[10px] text-gray-500 tracking-[1px] mb-1 font-semibold">
        {product.brandName} ─ {product.brandNameKr}
      </div>

      <h3 className="text-[13px] leading-tight line-clamp-2 mb-2 text-gray-900 font-medium h-9">
        {product.name}
      </h3>

      <PriceDisplay
        basePrice={product.basePrice}
        salePrice={product.salePrice}
        discountRate={product.discountRate}
      />

      {product.tags && (
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {product.tags.map(tag => (
            <Tag key={tag} variant={tag.toLowerCase() as any}>{tag}</Tag>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-line font-mono text-[10px] text-gray-500 tracking-[0.3px]">
        <span>RV {product.reviewCount}</span>
        <span className="text-red font-bold">★ {product.rating}</span>
      </div>
    </Link>
  );
}
```

### 예시 3: 클라이언트 인터랙션 (자수 토글)

```tsx
// components/product/EmbroideryToggle.tsx
'use client';
import { useState } from 'react';

export function EmbroideryToggle({
  onToggle,
  onOptionChange,
}: {
  onToggle: (isOn: boolean) => void;
  onOptionChange: (options: EmbroideryOptions) => void;
}) {
  const [isOn, setIsOn] = useState(false);
  const [options, setOptions] = useState<EmbroideryOptions>({
    type: 'COMPUTER',
    position: 'LEFT_CHEST',
    size: 'SMALL',
    text: '',
  });

  return (
    <div className="space-y-0">
      <div
        className={cn(
          'cursor-pointer transition-all p-4',
          isOn ? 'bg-black border-2 border-red' : 'bg-gradient-to-br from-yellow/40 to-yellow/60 border-2 border-yellow'
        )}
        onClick={() => {
          setIsOn(!isOn);
          onToggle(!isOn);
        }}
      >
        {/* 토글 헤더 */}
      </div>

      {isOn && (
        <div className="p-5 bg-gray-50 border border-line border-t-0">
          {/* 자수 옵션 입력 */}
        </div>
      )}
    </div>
  );
}
```

## Server Components 우선 원칙

```tsx
// ✅ Server Component (기본)
// app/products/[slug]/page.tsx
export default async function ProductPage({ params }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { /* ... */ },
  });

  return (
    <ProductDetailLayout>
      <ProductGallery images={product.images} />
      <ProductInfo product={product}>
        {/* 인터랙션 부분만 Client Component */}
        <ProductOptionsClient product={product} />
      </ProductInfo>
    </ProductDetailLayout>
  );
}

// 🔥 Client Component만 'use client'
// components/product/ProductOptionsClient.tsx
'use client';
export function ProductOptionsClient({ product }) {
  const [selectedColor, setSelectedColor] = useState(...);
  // 옵션 선택 / 수량 / 자수 토글 등
}
```

## cn() 유틸 (clsx + tailwind-merge)

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## 시안별 우선순위

기능 개발 시 컴포넌트 작성 우선순위:

```
Priority 1 (필수, 가장 먼저)
- Header / Navigation / Footer / FloatingChat (모든 페이지 공통)
- ProductCard (메인, 카테고리, 마이페이지에 모두 사용)
- Button, Input, Checkbox, Select (기본 UI)
- SectionHeader (모든 페이지)

Priority 2 (이커머스 핵심)
- ProductGallery (18안 상세)
- ProductOptions (18안)
- CartItem (20안)
- OrderSummary (20-21안 공통)

Priority 3 (자수 시스템)
- EmbroideryToggle (18안, 20안)
- SimulatorCanvas (17안)
- DesignCard (25안 마이페이지)

Priority 4 (B2B)
- QuoteForm (26안)
- SizeQuantityGrid (26안)

Priority 5 (정적 페이지)
- About 섹션들 (27안)
- Gallery (28안)
- FAQ / Notice (29안)
```

## 절대 하지 말 것

❌ 디자인 토큰 외의 임의 색상 사용
❌ 인라인 스타일 (`style={{}}`) 사용 (단, 동적 이미지 URL 등 예외)
❌ `border-radius` 0 외의 값 (시안 일관성)
❌ 모든 컴포넌트에 'use client' (Server 우선)
❌ `next/image` 안 쓰고 `<img>` 직접 사용

## 항상 확인할 것

✅ 시안 HTML 파일 먼저 확인
✅ 디자인 토큰 정확히 매핑
✅ 폰트 적용 (Noto Sans KR / IBM Plex Mono / Bebas Neue)
✅ Server / Client 컴포넌트 적절히 분리
✅ Image 최적화 (`next/image` + sizes)
✅ TypeScript 타입 정의
