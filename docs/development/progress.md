# 개발 진행 상황 (Progress Log)

> 마지막 업데이트: 2026-05-02  
> 다음 세션에서 이 파일을 먼저 읽고 이어서 작업하세요.

---

## 현재 상태

**개발 서버**: `pnpm dev` → http://localhost:3000  
**관리자**: http://localhost:3000/admin (`.env`에 `ADMIN_EMAILS=ssy66822@gmail.com` 필요)  
**DB**: Supabase PostgreSQL (`.env` DATABASE_URL 설정 완료)  
**Git**: `main` 브랜치, GitHub `shinyujin97/ss-mart` 연결 완료  
**전화번호**: 031-430-0497 (전체 통일 완료)

---

## 완료된 Phase

| Phase | 내용 | 상태 |
|-------|------|------|
| Phase 0 | Next.js 15 + Tailwind + Prisma + 폰트 설정 | ✅ |
| Phase 1 | NextAuth v5 + 로그인/회원가입 페이지 | ✅ |
| Phase 2 | 시드 데이터 + 메인/카테고리/상품 상세 페이지 | ✅ |
| Phase 3 | 장바구니 + 토스페이먼츠 결제 플로우 | ✅ |
| Phase 4 | 자수 시뮬레이터 + 안내 페이지 + 저작권 검증 | ✅ |
| Phase 5 | 단체주문 B2B 견적 시스템 | ✅ |
| Phase 6 | 마이페이지 전체 (주문/시안/포인트/쿠폰/위시리스트) | ✅ |
| Phase 7 | 정적 페이지 + SEO (sitemap/robots/OG) | ✅ |
| Phase 8 | 관리자 패널 (다크→밝은 테마로 전환) | ✅ |
| Phase 9 | QA — CRITICAL 3건 + HIGH 3건 수정 | ✅ |
| Phase 10 | 관리자 상품 CRUD + UI 개선 + 검색 + 버그 수정 | ✅ |

---

## 2026-05-02 작업 내역

### 메인 페이지 / 히어로
- 히어로 슬라이더 이미지 전체 교체 (컨셉에 맞는 어둡고 웅장한 이미지)
  - 2번: 작업화 클로즈업 (`photo-1759673824670`)
  - 3번: 자수 머신 (`photo-1772351721250`)
  - 4번: 팀 파이팅 오버헤드 (`photo-1520399636535`)
- 메인/ALL CATEGORIES 카테고리 숫자 제거
- 단체주문 전화번호 `031-430-0497` 전체 통일 (7개 파일)
- 네비게이션 전화번호 세로 배치로 비율 수정

### 관리자 패널 개선
- **전체 테마 밝은 테마로 전환** (다크 `#0f0f0f` → 라이트 `#f4f4f4`)
- **INFO 카드 중앙 정렬 + 숫자 크게** (`text-5xl`)
- **상품 CRUD 완성**
  - `POST /api/admin/products` — 상품 등록 API
  - `GET/PATCH/DELETE /api/admin/products/[id]` — 수정·삭제 API
  - 상품 등록/수정 폼 실제 저장 연동
- **이미지 관리 개선**: 대표 이미지 / 상세 이미지 분리 관리
- **옵션 구조 개선**: 색상 섹션 따로 + 사이즈 섹션 따로 (N색상 × M사이즈 = SKU 자동 생성)
- **상품 수정 페이지 옵션 로드**: DB 옵션 없으면 상품명 파싱으로 자동 채움 (`src/lib/product-options.ts`)
- **관리자 드롭다운에 관리자 페이지 링크** 추가
- **상품 상세 페이지 관리자 수정 버튼** — 브랜드명 위 우측 정렬, 빨간색

### 검색 기능 구현
- `src/components/layout/SearchBar.tsx` — 헤더 검색창 (Enter/클릭 → 결과 페이지)
- `src/app/search/page.tsx` — 검색 결과 페이지 (상품명·브랜드 통합 검색, 정렬, 페이지네이션)
- `src/app/search/SearchInput.tsx` — 결과 페이지 내 재검색 컴포넌트

### 브랜드관 / 베스트 페이지
- `src/app/brands/page.tsx` — 브랜드관 목록
- `src/app/brands/[slug]/page.tsx` — 브랜드별 상품 목록
- `src/app/best/page.tsx` — 카테고리별 베스트 상품

### 버그 수정
- **로그아웃 시 장바구니 유지 버그** 수정 → 로그아웃 시 `clearCart()` 호출
- **관리자 폼 텍스트 안 보이는 버그** 수정 → `text-white`를 `text-[#111]`로 교체
- **단체주문 페이지 메인 이미지** 교체 (실험실 → 팀 파이팅)

### 회원/인증 개선
- **비밀번호 최소 길이 8자 → 6자** 변경
- **회원가입 이메일 형식 서버 검증** 추가 (비이메일 형식 차단)
- **로그인 폼** `type="email"` → `type="text"` (기존 비이메일 계정도 로그인 가능)

---

## 남은 이슈

### QA 미수정 항목
| 등급 | 내용 |
|------|------|
| MEDIUM | KCs 필수 카테고리 선택 시 인증번호 강제 입력 없음 |
| MEDIUM | 견적 14일 만료 자동 처리 없음 (Vercel Cron 필요) |
| MEDIUM | 견적 접수 후 매니저 알림 없음 (Slack/이메일 연동 필요) |

### 기능 미완성 항목
| 항목 | 내용 |
|------|------|
| 소셜 로그인 | 카카오/네이버/Google 버튼 UI만 있음 |
| 주문 취소 API | 버튼 UI 있지만 API 없음 |
| 구매 확정 API | 버튼 UI 있지만 API 없음 |
| 관리자 주문 상태 변경 | 조회만 가능, 상태 변경 불가 |
| 관리자 자수 시안 승인/거절 | 조회만 가능 |
| 관리자 쿠폰 생성 | 조회만 가능 |
| 관리자 공지사항 DB 연동 | 현재 더미 데이터 |
| 카카오 알림톡 | 자수 시안 → 카톡 전송 미구현 |
| 가상계좌 입금 확인 Webhook | 미구현 |
| `public/products/` 이미지 | 8.4GB — Vercel Blob 또는 Supabase Storage 업로드 필요 (현재 .gitignore) |

---

## 주요 파일 위치

```
핵심 비즈니스 로직
├── src/lib/embroidery/        # 자수 가격계산/저작권/상태머신
├── src/lib/bulk-order/        # 단체주문 할인/검증/견적번호
├── src/lib/product-options.ts # 상품명 파싱 (색상/사이즈 자동 추출)
├── src/lib/cartStore.ts       # Zustand 장바구니 (localStorage persist)

관리자
├── src/app/admin/             # 관리자 패널 전체
├── src/app/api/admin/products/ # 상품 CRUD API

검색
├── src/app/search/            # 검색 결과 페이지
├── src/components/layout/SearchBar.tsx  # 헤더 검색창

공통 컴포넌트
├── src/components/layout/Header.tsx
├── src/components/layout/Navigation.tsx  # 031-430-0497 표시
├── src/components/layout/HeaderAuthClient.tsx  # 로그아웃 시 카트 초기화
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
```

---

## 다음 세션 할 일 (우선순위)

1. **관리자 주문 상태 변경** API + UI
2. **관리자 자수 시안 승인/거절** 기능
3. **주문 취소 / 구매 확정** API
4. **관리자 쿠폰 생성** 기능
5. **`public/products/` 이미지 → Vercel Blob 업로드** 검토
6. **Vercel 배포** 준비

---

## 세션 시작 체크리스트

```bash
# 1. 개발 서버 시작
pnpm dev

# 2. 관리자 접속
# http://localhost:3000/admin

# 3. 이 파일 읽고 이어서 작업
cat docs/development/progress.md
```
