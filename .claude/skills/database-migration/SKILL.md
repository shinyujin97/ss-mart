---
name: database-migration
description: Prisma 마이그레이션, 시드 데이터, DB 스키마 변경 시 사용. 새 모델 추가, 컬럼 추가/변경, 인덱스 추가, 마이그레이션 명명 규칙, 시드 데이터 (카테고리 트리, 80개 브랜드, 테스트 회원/상품), 프로덕션 마이그레이션 안전 절차, 롤백 전략을 다룸. 마이그레이션 파일은 의미 있는 이름으로 (예: add-embroidery-revision-count), 프로덕션 적용 전 staging 검증 필수.
---

# DB 마이그레이션 (Database Migration) Skill

## 핵심 원칙

1. **개발 환경**: `prisma migrate dev` (자동 생성 + 적용)
2. **프로덕션 환경**: `prisma migrate deploy` (생성된 마이그레이션 적용만)
3. **마이그레이션 파일은 절대 수정하지 않음** (이미 적용된 마이그레이션)
4. **이름은 의미 있게** (`add-embroidery-revision-count`)
5. **데이터 손실 위험 변경**은 별도 검토 (DROP COLUMN, 타입 변경)

## 새 마이그레이션 생성 워크플로우

```bash
# 1. schema.prisma 수정 후
# 2. 의미 있는 이름으로 마이그레이션 생성
npx prisma migrate dev --name add_embroidery_revision_count

# 3. 생성된 SQL 검증
cat prisma/migrations/{timestamp}_add_embroidery_revision_count/migration.sql

# 4. 시드 데이터 필요 시
npx prisma db seed
```

## 시드 데이터 구조

```
prisma/
├── schema.prisma
├── seeds/
│   ├── index.ts            # 메인 시드 진입점
│   ├── categories.ts       # 카테고리 트리
│   ├── brands.ts           # 80개 브랜드
│   ├── products.ts         # 테스트 상품 (개발 환경만)
│   ├── members.ts          # 테스트 회원 (개발 환경만)
│   └── coupons.ts          # 기본 쿠폰
└── migrations/
```

```typescript
// prisma/seeds/index.ts
import { PrismaClient } from '@prisma/client';
import { seedCategories } from './categories';
import { seedBrands } from './brands';
import { seedCoupons } from './coupons';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 프로덕션에서도 실행 (마스터 데이터)
  await seedCategories(prisma);
  await seedBrands(prisma);
  await seedCoupons(prisma);

  // 개발 환경만
  if (process.env.NODE_ENV === 'development') {
    const { seedProducts } = await import('./products');
    const { seedMembers } = await import('./members');
    await seedProducts(prisma);
    await seedMembers(prisma);
  }

  console.log('✅ Seeding complete');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

## 카테고리 시드 예시

```typescript
// prisma/seeds/categories.ts
export async function seedCategories(prisma: PrismaClient) {
  const tree = [
    { slug: 'workwear', name: '작업복', children: [
      { slug: 'workwear-top', name: '상의' },
      { slug: 'workwear-bottom', name: '하의' },
      // ...
    ]},
    // ...
  ];

  for (const root of tree) {
    const parent = await prisma.category.upsert({
      where: { slug: root.slug },
      update: { name: root.name },
      create: {
        slug: root.slug,
        name: root.name,
        level: 0,
      },
    });

    if (root.children) {
      for (const [idx, child] of root.children.entries()) {
        await prisma.category.upsert({
          where: { slug: child.slug },
          update: {},
          create: {
            slug: child.slug,
            name: child.name,
            parentId: parent.id,
            level: 1,
            sortOrder: idx,
          },
        });
      }
    }
  }
}
```

## 브랜드 시드 (80여개)

```typescript
// prisma/seeds/brands.ts
const BRANDS = [
  { slug: 'piozen', name: 'PIOZEN', nameKr: '피오젠' },
  { slug: 'carhartt', name: 'CARHARTT', nameKr: '칼하트' },
  { slug: 'dickies', name: 'DICKIES', nameKr: '디키즈' },
  { slug: 'levis', name: "LEVI'S", nameKr: '리바이스' },
  { slug: 'k2-safety', name: 'K2 SAFETY', nameKr: 'K2 안전화' },
  { slug: '3m', name: '3M', nameKr: '스리엠' },
  { slug: 'kolon', name: 'KOLON', nameKr: '코오롱' },
  { slug: 'red-wing', name: 'RED WING', nameKr: '레드윙' },
  { slug: 'blaklader', name: 'BLAKLADER', nameKr: '블락클라데' },
  { slug: 'puma-safety', name: 'PUMA SAFETY', nameKr: '푸마' },
  // ... 80개 (사장님께 실제 입점 브랜드 리스트 받아서 채우기)
];

export async function seedBrands(prisma: PrismaClient) {
  for (const [idx, brand] of BRANDS.entries()) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: { name: brand.name, nameKr: brand.nameKr },
      create: { ...brand, sortOrder: idx },
    });
  }
}
```

## 위험한 변경 처리

### 컬럼 삭제 (데이터 손실)

```bash
# ❌ 절대 자동 진행 금지
# ✅ 다음 절차로 안전하게:

# Step 1: deprecate 표시
# schema.prisma 에 @deprecated 코멘트
model Member {
  email       String  @unique
  /// @deprecated 사용 안 함, 2026-06 제거 예정
  oldField    String?
}

# Step 2: 코드에서 사용 제거 + 배포
# Step 3: 1주일 모니터링
# Step 4: 마이그레이션으로 컬럼 삭제
npx prisma migrate dev --name remove_old_field
```

### 타입 변경 (문자열 → ENUM 등)

```sql
-- 마이그레이션 SQL 직접 작성 (위험)
-- 1. 새 컬럼 추가
ALTER TABLE members ADD COLUMN type_new "MemberType";

-- 2. 데이터 변환
UPDATE members SET type_new = CASE
  WHEN type = 'individual' THEN 'INDIVIDUAL'::"MemberType"
  WHEN type = 'business' THEN 'BUSINESS'::"MemberType"
END;

-- 3. NOT NULL 검증 후 컬럼 교체
-- 4. 기존 컬럼 삭제 + 이름 변경
```

## 프로덕션 마이그레이션 절차

```bash
# 1. Staging 환경에서 먼저 적용
DATABASE_URL=$STAGING_DB npx prisma migrate deploy

# 2. Staging 검증 (E2E 테스트 통과)

# 3. 프로덕션 적용 전 백업
pg_dump $PROD_DB > backup_$(date +%Y%m%d_%H%M%S).sql

# 4. 프로덕션 적용 (피크 시간 회피)
DATABASE_URL=$PROD_DB npx prisma migrate deploy

# 5. 즉시 헬스 체크
curl https://ssmart.kr/api/health

# 6. 문제 시 롤백
psql $PROD_DB < backup_xxxxxx.sql
```

## 인덱스 전략

```prisma
// 자주 검색되는 컬럼은 반드시 @@index
model Product {
  slug    String @unique  // 자동 unique 인덱스
  brandId String

  @@index([brandId, status])    // 복합 인덱스 (브랜드별 활성 상품)
  @@index([isNew, isBest, isFeatured])
}

// 풀텍스트 검색은 raw SQL로 수동 추가
// prisma/migrations/xxx_add_product_fulltext_index/migration.sql
CREATE INDEX idx_products_fulltext ON products
  USING GIN (to_tsvector('simple', name || ' ' || COALESCE(short_description, '')));
```

## 데이터 마이그레이션 (Data, not Schema)

스키마 변경 없이 데이터만 변환하는 경우:

```typescript
// scripts/migrate-data/recalculate-member-totals.ts
async function recalculateAllMemberTotals() {
  const members = await prisma.member.findMany();

  for (const member of members) {
    const result = await prisma.order.aggregate({
      where: { memberId: member.id, status: 'CONFIRMED' },
      _count: true,
      _sum: { totalAmount: true },
    });

    await prisma.member.update({
      where: { id: member.id },
      data: {
        totalOrders: result._count,
        totalAmount: result._sum.totalAmount || 0,
      },
    });
  }
}
```

## 절대 하지 말 것

❌ `prisma migrate reset` 프로덕션 실행 (전체 삭제)
❌ 이미 배포된 마이그레이션 파일 수정
❌ 백업 없이 프로덕션 마이그레이션
❌ 피크 시간 (점심 / 퇴근 시간) 마이그레이션
❌ DROP TABLE 자동 진행
❌ 테스트 환경 검증 없이 프로덕션 적용
❌ 시드 데이터에 실제 회원 / 결제 정보 (PII)

## 항상 확인할 것

✅ 마이그레이션 이름은 의미 있게
✅ 생성된 SQL 직접 검토
✅ Staging → Production 순
✅ 백업 후 진행
✅ 인덱스 전략 (느린 쿼리 모니터링)
✅ 시드는 idempotent (upsert 사용)

## 관련 파일

- DB 스키마 정의: `docs/database/schema.md`
- 비즈니스 규칙: `docs/domain/business-rules.md`
