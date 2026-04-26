---
name: product-catalog
description: 상품 카탈로그 / 카테고리 / 브랜드 / 검색 / 필터 관련 개발 시 사용. 80여 개 입점 브랜드, 5,940 SKU, 카테고리 트리 (작업복/안전화/안전용품/F&B/의료), 상품 옵션 (색상/사이즈), 인증 정보 (KCs/KS/방염), 재고 관리, 풀텍스트 검색, 가격 필터, 정렬 (최신/인기/가격) 등을 다룸. 상품 상세 페이지, 카테고리 목록 페이지, 메인 페이지의 상품 그리드 영역을 구현할 때 참조.
---

# 상품 카탈로그 (Product Catalog) Skill

## 핵심 원칙

1. **카테고리 트리는 변경 가능, 슬러그는 불변** (URL 영향)
2. **재고 차감은 결제 완료 시점** (장바구니 X, 결제 완료 시 ✅)
3. **인증 정보는 카테고리별 필수 표시** (안전화/안전모/마스크 = KCs)
4. **상품 옵션 조합 SKU는 unique** (예: PZ-WW-001-BLK-L)
5. **검색 / 정렬 / 필터 모두 서버측 처리** (인덱스 활용)

## 카테고리 트리 (시드 데이터)

```typescript
// prisma/seeds/categories.ts
export const CATEGORIES = [
  {
    slug: 'workwear',
    name: '작업복',
    children: [
      { slug: 'workwear-top', name: '상의' },
      { slug: 'workwear-bottom', name: '하의' },
      { slug: 'workwear-set', name: '상하 세트' },
      { slug: 'workwear-vest', name: '조끼' },
      { slug: 'workwear-winter', name: '방한복' },
      { slug: 'workwear-fnb', name: 'F&B 유니폼' },
      { slug: 'workwear-medical', name: '의료 / 위생복' },
    ],
  },
  {
    slug: 'safety-shoes',
    name: '안전화',
    children: [
      { slug: 'safety-6inch', name: '6인치' },
      { slug: 'safety-8inch', name: '8인치' },
      { slug: 'safety-insulated', name: '절연화' },
      { slug: 'safety-waterproof', name: '방수화' },
      { slug: 'safety-winter', name: '방한 안전화' },
    ],
  },
  {
    slug: 'safety-gear',
    name: '안전용품',
    children: [
      { slug: 'safety-helmet', name: '안전모', requiresKcs: true },
      { slug: 'safety-mask', name: '마스크' },
      { slug: 'safety-vest', name: '안전조끼' },
      { slug: 'safety-gloves', name: '장갑 / 보호구' },
    ],
  },
];
```

## 상품 검색 (PostgreSQL 풀텍스트)

```typescript
// lib/products/search.ts
export async function searchProducts({
  query,
  categorySlug,
  brandIds,
  minPrice,
  maxPrice,
  sort = 'NEWEST',
  page = 1,
  perPage = 24,
}: ProductSearchParams) {
  const where: Prisma.ProductWhereInput = {
    status: 'ACTIVE',
    ...(query && {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { brand: { name: { contains: query, mode: 'insensitive' } } },
        { brand: { nameKr: { contains: query, mode: 'insensitive' } } },
      ],
    }),
    ...(categorySlug && {
      categories: { some: { category: { slug: categorySlug } } },
    }),
    ...(brandIds?.length && { brandId: { in: brandIds } }),
    ...(minPrice && { salePrice: { gte: minPrice } }),
    ...(maxPrice && { salePrice: { lte: maxPrice } }),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === 'POPULAR' ? { orderCount: 'desc' } :
    sort === 'PRICE_LOW' ? { salePrice: 'asc' } :
    sort === 'PRICE_HIGH' ? { salePrice: 'desc' } :
    sort === 'RATING' ? { averageRating: 'desc' } :
    { createdAt: 'desc' };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        brand: true,
        images: { where: { isMain: true }, take: 1 },
        categories: { include: { category: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / perPage) };
}
```

## 인증 표시 규칙

```typescript
// 카테고리별 필수 인증 매핑
const REQUIRED_CERTIFICATIONS: Record<string, CertificationType[]> = {
  'safety-shoes': ['KCS'],          // 안전화 필수
  'safety-helmet': ['KCS'],          // 안전모 필수
  'safety-mask': ['KF94', 'KF80'],  // 마스크 등급
  'workwear-flame-retardant': ['FLAME_RETARDANT'],
  'workwear-anti-static': ['ANTI_STATIC'],
};

export function validateProductCertifications(
  product: Product,
  categorySlug: string
): { valid: boolean; missing: CertificationType[] } {
  const required = REQUIRED_CERTIFICATIONS[categorySlug] || [];
  const existing = product.certifications.map(c => c.type);
  const missing = required.filter(r => !existing.includes(r));
  return { valid: missing.length === 0, missing };
}
```

## 재고 관리

```typescript
// lib/inventory/check.ts
export async function checkStock(optionId: string, quantity: number) {
  const option = await prisma.productOption.findUniqueOrThrow({
    where: { id: optionId },
  });

  const available = option.stockQuantity - option.reservedQuantity;
  return {
    available: available >= quantity,
    currentStock: option.stockQuantity,
    reserved: option.reservedQuantity,
    requestable: available,
  };
}

// 재고 부족 알림 (관리자)
export async function checkLowStock() {
  const lowStockOptions = await prisma.productOption.findMany({
    where: {
      stockQuantity: { lte: prisma.productOption.fields.lowStockThreshold },
    },
    include: { product: true },
  });

  // Slack 알림
  await notifyAdmins(`재고 부족 ${lowStockOptions.length}건`, lowStockOptions);
}
```

## 카테고리 목록 페이지 (19안)

```tsx
// app/categories/[slug]/page.tsx (Server Component)
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { brand?: string; price?: string; sort?: string; page?: string };
}) {
  const category = await prisma.category.findUniqueOrThrow({
    where: { slug: params.slug },
    include: { children: true, parent: true },
  });

  const { items, total, totalPages } = await searchProducts({
    categorySlug: params.slug,
    brandIds: searchParams.brand?.split(','),
    sort: searchParams.sort as SortType,
    page: Number(searchParams.page) || 1,
  });

  return (
    <CategoryLayout category={category}>
      <CategorySidebar />          {/* 좌측 필터 (Client) */}
      <ProductGrid products={items} total={total} totalPages={totalPages} />
    </CategoryLayout>
  );
}
```

## 상품 상세 페이지 (18안)

```tsx
// app/products/[slug]/page.tsx (Server Component)
export default async function ProductPage({ params }) {
  const product = await prisma.product.findUniqueOrThrow({
    where: { slug: params.slug },
    include: {
      brand: true,
      images: { orderBy: { sortOrder: 'asc' } },
      options: { where: { isActive: true } },
      certifications: true,
      categories: { include: { category: true } },
      reviews: {
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: { member: true, images: true },
      },
    },
  });

  // 조회수 +1 (background)
  void prisma.product.update({
    where: { id: product.id },
    data: { viewCount: { increment: 1 } },
  });

  return (
    <ProductDetailLayout>
      <ProductGallery images={product.images} />
      <ProductInfoSection product={product}>
        <ProductOptionsClient product={product} /> {/* 'use client' */}
      </ProductInfoSection>
      <ProductTabs product={product} reviews={product.reviews} />
      <RelatedProducts brandId={product.brandId} />
    </ProductDetailLayout>
  );
}
```

## 절대 하지 말 것

❌ 카테고리 슬러그 변경 (URL 끊김)
❌ 풀텍스트 검색 인덱스 없이 LIKE 쿼리 남발
❌ 인증 필수 카테고리에 인증 정보 없는 상품 등록
❌ 재고 0인데 "품절" 표시 안 하고 결제 진행
❌ N+1 쿼리 (반드시 include / select 사용)

## 항상 확인할 것

✅ 카테고리 슬러그 / 상품 슬러그 일관성
✅ 인증 정보 자동 검증 (등록 시)
✅ 메인 이미지 isMain=true 1개만
✅ 옵션 SKU 유일성
✅ 검색 인덱스 (`@@index([slug])`)

## 관련 파일

- DB 스키마: `docs/database/schema.md` (Product, Brand, Category)
- 디자인 시안: `19_category.html`, `18_detail.html`
