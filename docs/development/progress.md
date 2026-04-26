# 개발 진행 상황 (Progress Log)

> 마지막 업데이트: 2026-04-26  
> 다음 세션에서 이 파일을 먼저 읽고 이어서 작업하세요.

---

## 현재 상태

**개발 서버**: `pnpm dev` → http://localhost:3000  
**관리자**: http://localhost:3000/admin (`.env`에 `ADMIN_EMAILS=ssy66822@gmail.com` 필요)  
**DB**: Supabase PostgreSQL (`.env` DATABASE_URL 설정 완료)  
**Git**: `main` 브랜치, 리모트 미설정 (GitHub 주소 받으면 연결 예정)

---

## 완료된 Phase

| Phase | 내용 | 상태 |
|-------|------|------|
| Phase 0 | Next.js 16 + Tailwind + Prisma + 폰트 설정 | ✅ |
| Phase 1 | NextAuth v5 + 로그인/회원가입 페이지 | ✅ |
| Phase 2 | 시드 데이터 + 메인/카테고리/상품 상세 페이지 | ✅ |
| Phase 3 | 장바구니 + 토스페이먼츠 결제 플로우 | ✅ |
| Phase 4 | 자수 시뮬레이터 + 안내 페이지 + 저작권 검증 | ✅ |
| Phase 5 | 단체주문 B2B 견적 시스템 | ✅ |
| Phase 6 | 마이페이지 전체 (주문/시안/포인트/쿠폰/위시리스트) | ✅ |
| Phase 7 | 정적 페이지 + SEO (sitemap/robots/OG) | ✅ |
| Phase 8 | 관리자 패널 (다크 테마, 8개 메뉴) | ✅ |
| Phase 9 | QA — CRITICAL 3건 + HIGH 3건 수정 | ✅ |

---

## 오늘 마지막 작업 (2026-04-26)

### 수정 완료
- **헤더 로그인 상태 표시**: 로그인 시 `홍길동님 ▾` 드롭다운 (마이페이지/주문내역/로그아웃)
- **헤더 아이콘**: 찜(하트 SVG) + 장바구니(쇼핑백 SVG) + 빨간 동그라미 배지
- **ALL CATEGORIES 드롭다운**: wrapper `onMouseLeave`로 수정 → 마우스 이동 시 유지
- **상품 상세 찜하기**: `[장바구니] [바로구매] [♥]` 버튼 나란히 배치
- **찜 배지 실시간 업데이트**: 토글 후 `router.refresh()` 호출

---

## 남은 이슈 (테스트하면서 하나씩)

### QA 미수정 항목 (우선순위 순)
| 등급 | 파일 | 내용 |
|------|------|------|
| HIGH | `src/app/api/embroidery/designs/route.ts` | 로고 이미지 업로드 저작권 검사 없음 (이미지 자동 스캔 어려움 → 디자이너 수동 검수로 대체) |
| MEDIUM | `src/app/admin/products/new/ProductForm.tsx` | KCs 필수 카테고리 선택 시 인증번호 강제 입력 없음 |
| MEDIUM | `src/app/api/bulk-order/quote/route.ts` | 견적 14일 만료 자동 처리 없음 (Vercel Cron 필요) |
| MEDIUM | `src/app/api/bulk-order/quote/route.ts` | 견적 접수 후 매니저 알림 없음 (Slack/이메일 연동 필요) |

### 기능 미완성 항목
| 항목 | 위치 | 내용 |
|------|------|------|
| 검색 기능 | `src/components/layout/Header.tsx` | 검색 input 있지만 실제 검색 동작 미구현 |
| 소셜 로그인 | `src/app/login/LoginForm.tsx` | 카카오/네이버/Google 버튼 UI만 있음 |
| 상품 등록 실제 저장 | `src/app/admin/products/new/ProductForm.tsx` | 폼 UI 완성, API 연동 미완성 |
| 카카오 알림톡 | - | 자수 시안 → 카톡 전송 미구현 |
| 가상계좌 입금 확인 | `src/app/api/payments/` | Webhook 미구현 |
| 주문 취소 API | `src/app/api/orders/` | 버튼 UI 있지만 API 없음 |
| 구매 확정 API | `src/app/api/orders/` | 버튼 UI 있지만 API 없음 |

---

## 주요 파일 위치

```
핵심 비즈니스 로직
├── src/lib/embroidery/        # 자수 가격계산/저작권/상태머신
├── src/lib/bulk-order/        # 단체주문 할인/검증/견적번호
├── src/constants/embroidery.ts # 자수 종류/사이즈/위치 상수

API 엔드포인트
├── src/app/api/orders/        # 주문 생성 (서버 재계산 + 재고락)
├── src/app/api/payments/      # 토스페이먼츠 결제 승인
├── src/app/api/embroidery/    # 자수 시안 CRUD + 가격계산
├── src/app/api/bulk-order/    # 단체주문 견적
├── src/app/api/wishlist/      # 찜하기 토글

주요 페이지
├── src/app/(메인/카테고리/상품)   # Phase 2
├── src/app/cart/              # Phase 3
├── src/app/checkout/          # Phase 3
├── src/app/embroidery/        # Phase 4
├── src/app/bulk-order/        # Phase 5
├── src/app/mypage/            # Phase 6
├── src/app/admin/             # Phase 8

공통 컴포넌트
├── src/components/layout/Header.tsx      # 헤더 (아이콘+인증)
├── src/components/layout/Navigation.tsx  # 네비 (ALL CATEGORIES 드롭다운)
├── src/components/layout/Footer.tsx      # 푸터
```

---

## 환경 변수 필요 목록 (`.env`)

```env
# DB (필수)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth (필수)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# 관리자 (필수)
ADMIN_EMAILS="ssy66822@gmail.com"

# 토스페이먼츠 (결제 테스트 시 필요)
NEXT_PUBLIC_TOSS_CLIENT_KEY="test_ck_..."
TOSS_SECRET_KEY="test_sk_..."

# 선택 (나중에)
NEXT_PUBLIC_SITE_URL="https://ssmart.kr"
GOOGLE_SITE_VERIFICATION=""
```

---

## 내일 이어서 할 일 (우선순위)

1. **직접 사이트 테스트** — 회원가입 → 로그인 → 장바구니 → 결제 플로우 확인
2. **버그 발견 시 하나씩 수정**
3. **상품 등록 API 완성** (`/admin/products/new`)
4. **검색 기능 구현**
5. **주문 취소 / 구매 확정 API**
6. **Vercel 배포** (준비 되면)

---

## 세션 시작 체크리스트

```bash
# 1. 개발 서버 시작
pnpm dev

# 2. DB 연결 확인
pnpm prisma studio

# 3. 관리자 접속 (ADMIN_EMAILS 설정 후)
# http://localhost:3000/admin

# 4. 이 파일 읽고 이어서 작업
cat docs/development/progress.md
```
