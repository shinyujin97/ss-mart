---
name: component
description: HTML 디자인 시안을 React/Next.js 컴포넌트로 변환합니다. 시안 번호 (15~29) 또는 페이지 이름을 받아서 자동으로 시안 파일을 읽고 컴포넌트 구조를 생성합니다.
context: fork
agent: general-purpose
---

# 시안 → React 컴포넌트 변환

다음 절차를 따라 디자인 시안을 React 컴포넌트로 변환합니다.

## 입력
$ARGUMENTS

(예: `/component 18` 또는 `/component product-detail`)

## 작업 절차

### 1. 시안 파일 식별

```
시안 번호 → 파일 매핑:
15 → 메인 (15_home.html)
16 → 자수 안내 (16_embroidery_guide.html)
17 → 자수 시뮬레이터 (17_simulator.html)
18 → 상품 상세 (18_detail.html)
19 → 카테고리 목록 (19_category.html)
20 → 장바구니 (20_cart.html)
21 → 주문서/결제 (21_checkout.html)
22 → 결제 완료 (22_order_complete.html)
23 → 로그인 (23_login.html)
24 → 회원가입 (24_signup.html)
25 → 마이페이지 (25_mypage.html)
26 → 단체주문 (26_bulk_order.html)
27 → 회사 소개 (27_about.html)
28 → 자수 갤러리 (28_gallery.html)
29 → 고객지원 (29_support.html)
```

시안 위치: `/mnt/user-data/outputs/workwear/{번호}_{이름}.html`

### 2. 시안 분석

`Read` 도구로 시안 HTML 전체 읽기:
- 페이지 라우트 결정 (예: `/products/[slug]`)
- 컴포넌트 분리 단위 파악
- Server / Client 컴포넌트 구분
- 디자인 토큰 매핑

### 3. 관련 Skill 참조

```
- 자수 관련 시안 (16, 17, 28) → embroidery-system
- 단체주문 (26) → bulk-order-flow
- 결제 (20, 21, 22) → payment-flow
- 상품 (18, 19) → product-catalog
- 모든 시안 → component-builder (디자인 토큰)
```

### 4. 컴포넌트 생성

다음 구조로 파일 생성:

```
app/
├── (route)/
│   └── page.tsx                    # Server Component
└── (route)/_components/
    ├── PageContent.tsx              # Server Component
    └── InteractiveSection.tsx       # 'use client'

components/
├── layout/                          # 공통
└── (route 도메인)/                  # 페이지별
```

### 5. 디자인 토큰 정확히 재현

```typescript
// CSS 변수 → Tailwind 매핑
// --red #c8161d → text-red, bg-red
// --black #111 → text-black, bg-black
// --yellow #ffd400 → text-yellow, bg-yellow

// 폰트
// Noto Sans KR → font-sans (기본)
// IBM Plex Mono → font-mono
// Bebas Neue → font-display

// 간격 / 사이즈
// HTML 시안의 정확한 px 값 사용
```

### 6. 결과 출력

```
## 생성된 파일

### 페이지
- app/products/[slug]/page.tsx

### 컴포넌트
- components/product/ProductGallery.tsx
- components/product/ProductOptions.tsx ('use client')
- components/product/EmbroideryToggle.tsx ('use client')
- components/product/ProductTabs.tsx
- components/product/ReviewSection.tsx

### 다음 단계
1. npm run dev 로 페이지 렌더 확인
2. 시안 HTML 과 비교
3. 모바일 반응형 검수 (시안은 데스크톱 우선)
4. 자수 토글 인터랙션 테스트
```

## 절대 하지 말 것

❌ 디자인 토큰 외 색상 사용
❌ 'use client' 남발
❌ 시안과 다른 폰트 / 간격
❌ <img> 태그 (next/image 사용)

## 항상 확인할 것

✅ 시안 HTML 먼저 read
✅ 도메인 별 Skill 함께 참조
✅ Server / Client 적절히 분리
✅ TypeScript 타입 정의
