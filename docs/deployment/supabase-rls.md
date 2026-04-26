# Supabase RLS (Row Level Security) 정책

> Supabase PostgreSQL 의 기본 보안 모델. 각 테이블 / Storage 버킷에 RLS 활성화하여 데이터 접근 제어.

## 핵심 원칙

1. **RLS 기본 활성화** (보안 사고 방지)
2. **service_role 키는 서버 라우트에서만 사용** (RLS 우회)
3. **anon 키는 RLS 적용** (클라이언트 안전)
4. **PII 보호** (사업자번호, 결제 정보)

## 사용자 식별

```sql
-- Supabase 의 인증된 사용자 ID
auth.uid()

-- 사용자 메타데이터
auth.jwt() -> 'user_metadata'

-- 역할 (관리자 / 매니저 / 일반)
auth.jwt() -> 'app_metadata' -> 'role'
```

## 테이블별 RLS 정책

### 1. members (회원)

```sql
-- RLS 활성화
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 본인 정보만 조회 가능
CREATE POLICY "Members can view their own data"
  ON members FOR SELECT
  USING (auth.uid()::text = id);

-- 본인 정보만 수정 가능
CREATE POLICY "Members can update their own data"
  ON members FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- 회원가입은 service_role 만 (서버 라우트에서)
-- 직접 INSERT 정책 없음 → anon 키로 가입 불가
```

### 2. business_info (사업자 정보)

```sql
-- 매우 민감한 PII (사업자번호 포함)
ALTER TABLE business_info ENABLE ROW LEVEL SECURITY;

-- 본인 사업자 정보만
CREATE POLICY "Business info self access"
  ON business_info FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = business_info.member_id
      AND m.id = auth.uid()::text
    )
  );

-- 사업자 정보는 가입 시 한 번 등록, 변경은 admin 통해서
```

### 3. addresses (배송지)

```sql
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Addresses self access"
  ON addresses FOR ALL
  USING (member_id = auth.uid()::text)
  WITH CHECK (member_id = auth.uid()::text);
```

### 4. products (상품)

```sql
-- 모두 조회 가능 (공개 카탈로그)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are public for active items"
  ON products FOR SELECT
  USING (status = 'ACTIVE');

-- 등록 / 수정은 service_role (관리자 화면)
```

### 5. orders (주문)

```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 본인 주문만
CREATE POLICY "Orders self access"
  ON orders FOR SELECT
  USING (member_id = auth.uid()::text);

-- 관리자 / 매니저는 모두 조회 가능
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' IN ('ADMIN', 'MANAGER')
  );

-- INSERT / UPDATE 는 서버 라우트에서만 (service_role)
```

### 6. order_items (주문 상품)

```sql
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 자신의 주문에 속한 아이템만
CREATE POLICY "Order items follow order access"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
      AND (
        o.member_id = auth.uid()::text
        OR auth.jwt() -> 'app_metadata' ->> 'role' IN ('ADMIN', 'MANAGER')
      )
    )
  );
```

### 7. payments (결제)

```sql
-- 매우 민감 (결제 정보)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payments self access"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = payments.order_id
      AND (
        o.member_id = auth.uid()::text
        OR auth.jwt() -> 'app_metadata' ->> 'role' IN ('ADMIN', 'MANAGER')
      )
    )
  );

-- 결제 정보 INSERT / UPDATE 는 service_role 전용
```

### 8. embroidery_designs (자수 시안)

```sql
ALTER TABLE embroidery_designs ENABLE ROW LEVEL SECURITY;

-- 본인 시안 또는 디자이너 / 관리자
CREATE POLICY "Embroidery designs access"
  ON embroidery_designs FOR ALL
  USING (
    member_id = auth.uid()::text
    OR auth.jwt() -> 'app_metadata' ->> 'role' IN ('ADMIN', 'DESIGNER', 'MANAGER')
  );
```

### 9. quote_requests (단체주문 견적)

```sql
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- 본인 견적 + 배정된 매니저 + 관리자
CREATE POLICY "Quote requests access"
  ON quote_requests FOR SELECT
  USING (
    member_id = auth.uid()::text
    OR assigned_manager_id = auth.uid()::text
    OR auth.jwt() -> 'app_metadata' ->> 'role' = 'ADMIN'
  );
```

### 10. cart_items / wishlists

```sql
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cart items self access"
  ON cart_items FOR ALL
  USING (member_id = auth.uid()::text)
  WITH CHECK (member_id = auth.uid()::text);

-- 동일 패턴으로 wishlists
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wishlists self access"
  ON wishlists FOR ALL
  USING (member_id = auth.uid()::text)
  WITH CHECK (member_id = auth.uid()::text);
```

### 11. reviews (리뷰)

```sql
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 모두 활성 리뷰 조회 가능 (공개)
CREATE POLICY "Reviews public read for active"
  ON reviews FOR SELECT
  USING (status = 'ACTIVE');

-- 본인 리뷰만 작성 / 수정 / 삭제
CREATE POLICY "Reviews self write"
  ON reviews FOR INSERT
  WITH CHECK (member_id = auth.uid()::text);

CREATE POLICY "Reviews self update"
  ON reviews FOR UPDATE
  USING (member_id = auth.uid()::text)
  WITH CHECK (member_id = auth.uid()::text);
```

### 12. point_history / coupons

```sql
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Point history self read"
  ON point_history FOR SELECT
  USING (member_id = auth.uid()::text);

-- 적립금 변경은 service_role (서버 라우트)

-- 쿠폰 마스터는 공개
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active coupons public"
  ON coupons FOR SELECT
  USING (is_active = true AND valid_from <= now() AND valid_until >= now());

-- 회원 쿠폰
ALTER TABLE member_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Member coupons self read"
  ON member_coupons FOR SELECT
  USING (member_id = auth.uid()::text);
```

## Storage 버킷 RLS

### product-images (공개)

```sql
-- 모두 읽기 가능
CREATE POLICY "Product images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- 업로드는 admin 만
CREATE POLICY "Product images admin write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.jwt() -> 'app_metadata' ->> 'role' = 'ADMIN'
  );
```

### embroidery-designs (인증 필요)

```sql
-- 본인 시안 또는 디자이너 / 관리자만
CREATE POLICY "Embroidery designs auth read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'embroidery-designs'
    AND (
      -- 파일 경로에 사용자 ID 포함 (예: /members/{user_id}/...)
      (storage.foldername(name))[2] = auth.uid()::text
      OR auth.jwt() -> 'app_metadata' ->> 'role' IN ('ADMIN', 'DESIGNER', 'MANAGER')
    )
  );

-- 본인만 업로드
CREATE POLICY "Embroidery designs self upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'embroidery-designs'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
```

### quote-documents (인증 필요)

```sql
-- 본인 견적서 또는 매니저 / 관리자
CREATE POLICY "Quote docs access"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'quote-documents'
    AND (
      -- 견적 번호 + 회원 매핑 검증
      EXISTS (
        SELECT 1 FROM quote_requests qr
        WHERE qr.request_number = (storage.foldername(name))[2]
        AND (
          qr.member_id = auth.uid()::text
          OR qr.assigned_manager_id = auth.uid()::text
        )
      )
      OR auth.jwt() -> 'app_metadata' ->> 'role' = 'ADMIN'
    )
  );
```

### user-uploads (인증 필요)

```sql
-- 본인만 접근 (로고 / 자수 업로드 파일)
CREATE POLICY "User uploads self"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
```

## 역할 (Role) 관리

```typescript
// 회원 가입 시 기본 역할
{
  app_metadata: {
    role: 'MEMBER'  // 기본
  }
}

// 역할 변경 (service_role 만)
await supabaseAdmin.auth.admin.updateUserById(userId, {
  app_metadata: { role: 'MANAGER' }
});

// 가능한 역할
type Role = 'MEMBER' | 'MANAGER' | 'DESIGNER' | 'ADMIN';
```

## RLS 우회 (서버 전용)

```typescript
// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

// service_role 키는 서버에서만, 클라이언트 절대 노출 X
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // ⚠️ 절대 클라이언트 X
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// 사용: API 라우트 / Server Actions 에서만
// app/api/admin/orders/route.ts
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  // RLS 우회하여 모든 주문 조회
  const { data } = await supabaseAdmin
    .from('orders')
    .select('*');
  return Response.json(data);
}
```

## 정책 검증

```sql
-- 활성 RLS 정책 확인
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- RLS 활성화된 테이블 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- RLS 비활성 테이블 (보안 검토 필요)
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;
```

## 절대 하지 말 것

❌ RLS 비활성화 (개발 편의로도 금지)
❌ service_role 키를 클라이언트 코드에 사용
❌ 모든 사용자에게 SELECT 허용 (개인정보 누출)
❌ 정책 검증 없이 프로덕션 배포

## 항상 확인할 것

✅ 새 테이블 생성 시 RLS 활성화
✅ 정책 추가 시 USING + WITH CHECK 모두
✅ Storage 버킷 정책 별도 설정
✅ 역할 기반 접근 (admin / manager / designer / member)
✅ 정기 정책 감사 (분기별)
