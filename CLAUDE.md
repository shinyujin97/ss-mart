# CLAUDE.md

> 이 파일은 Claude Code가 모든 세션에서 자동으로 읽는 프로젝트 메모리입니다.
> 변경 사항은 즉시 모든 새 세션에 반영됩니다.

## Project Overview

**프로젝트명**: 에스에스종합상사 이커머스 (SS Mart)
**도메인**: 작업복 / 안전화 / 안전용품 멀티브랜드 종합상사
**핵심 차별화**: 자수 / 마킹 서비스 통합 (B2B + B2C)
**비즈니스 모델**:
- 80여 개 입점 브랜드 상품 매입 후 마진 판매
- 자수 / 마킹 작업 추가 (개인 + 단체)
- 매출 목표: 월 1,000만원 (웹 기준)

## Tech Stack (확정)

- **Frontend**: Next.js 15 (App Router) + React 19 ✅
- **Backend**: Next.js API Routes + Server Actions (단일 풀스택) ✅
- **Database**: PostgreSQL 16+ (via Supabase) ✅
- **Hosting**: Vercel ✅
- **ORM**: Prisma 6
- **Styling**: Tailwind CSS v4 + 자체 디자인 토큰
- **인증**: NextAuth (Auth.js v5) + Supabase Auth (선택)
- **이미지**: Vercel Blob 또는 Supabase Storage
- **결제**: 토스페이먼츠 (1순위) / KG이니시스 (대안)
- **모니터링**: Sentry + Vercel Analytics

상세: `docs/architecture/tech-stack.md`

## Critical Domain Rules

⚠️ **이 규칙들은 비즈니스의 핵심이므로 절대 임의로 변경 금지**

### 1. 자수 옵션 (Embroidery)
- 모든 상품에 자수 추가 옵션이 있어야 함 (기본값 OFF)
- 자수 종류: 컴퓨터 자수 / 패치 자수 / 아플리케 / 실사 패치 / 벨크로 패치 / 캐릭터 디자인 / 실크 인쇄 (7종)
- 자수 위치: 왼가슴 / 오른가슴 / 등판 중앙 / 등 상단 / 왼팔 / 오른팔 / 여러 곳
- 자수 가격: 종류 + 크기 + 위치 수에 따라 자동 계산
- **자수 추가 상품은 단순 변심 환불 불가** (전자상거래법 맞춤 제작 조항)
- 시안 확정 전까지 무료 무제한 수정
- 자수 작업 일정: 1~10벌 3~5일 / 10~99벌 5~7일 / 100벌+ 7~14일
- **저작권**: 디즈니/마블 등 IP 사용 금지. 오리지널 또는 고객사 자체 캐릭터만 가능

### 2. 단체주문 (Bulk Order / B2B)
- 100벌 이상부터 단체주문 자격
- 최대 30% 추가 할인
- 자수 / 마킹 무료 포함
- 사이즈별 수량 분리 입력 필수 (S/M/L/XL/2XL/3XL)
- 세금계산서 자동 발행 (법인 / 사업자 회원)
- 분할 배송 가능
- 전담 매니저 1:1 배정

### 3. 인증 (Certification)
- 안전화 / 안전모 / 마스크: **KCs 인증 필수 표시**
- 방염 작업복: KS 인증 + 방염 인증
- 정전기 방지: 별도 인증 표시
- 인증번호 (예: "제 17-AB-01234호") 상품 상세에 노출

### 4. 결제 / 배송
- **전 상품 무료 배송** (제주 / 도서산간 포함)
- 평일 14시 이전 결제 시 당일 출고
- 일반 상품: 1~2일 내 도착
- 자수 추가 상품: 시안 확정 후 5~7일
- 결제 수단 5가지: 신용카드 / 간편결제 / 계좌이체 / 무통장 / **법인-세금계산서**

### 5. 회원 (Membership)
- 개인 회원 / 법인-사업자 회원 분리 (가입 / 로그인 별도 탭)
- 가입 즉시 혜택: 2,000P / 10% 첫구매 쿠폰 / 무료 자수 시안 / 생일 쿠폰 / 단체할인 자격

## Page Structure (총 15개 핵심 페이지)

이미 디자인 시안이 완성되어 있으며 `/mnt/user-data/outputs/workwear/` 에 위치합니다.
개발 시 시안의 컴포넌트 구조와 디자인 토큰을 그대로 따라야 합니다.

| 번호 | 페이지 | 라우트 (예상) |
|------|--------|--------------|
| 15 | 메인 | `/` |
| 16 | 자수 안내 | `/embroidery` |
| 17 | 자수 시뮬레이터 | `/embroidery/simulator` |
| 18 | 상품 상세 | `/products/[slug]` |
| 19 | 카테고리 목록 | `/categories/[category]` |
| 20 | 장바구니 | `/cart` |
| 21 | 주문서/결제 | `/checkout` |
| 22 | 결제 완료 | `/orders/complete/[id]` |
| 23 | 로그인 | `/login` |
| 24 | 회원가입 | `/signup` |
| 25 | 마이페이지 | `/mypage` |
| 26 | 단체주문 견적 | `/bulk-order` |
| 27 | 회사 소개 | `/about` |
| 28 | 자수 갤러리 | `/embroidery/gallery` |
| 29 | 고객 지원 | `/support` |

## Design System

⚠️ **이 디자인 토큰은 절대 변경하지 말 것** (시안 전체 일관성)

```css
:root {
  --red: #c8161d;        /* 메인 액센트 */
  --red-dark: #9c0e15;
  --black: #111;          /* 메인 다크 */
  --gray-900: #1a1a1a;
  --gray-700: #4a4a4a;
  --gray-500: #8a8a8a;
  --gray-300: #d8d8d8;
  --gray-100: #f4f4f4;
  --gray-50: #fafafa;
  --line: #e5e5e5;
  --yellow: #ffd400;      /* 포인트 */
}
```

**폰트 스택**:
- 한글 본문: `Noto Sans KR` (400~900)
- 라벨/번호: `IBM Plex Mono` (400~600)
- 큰 숫자/로고: `Bebas Neue`

**디자인 원칙**:
- `border-radius: 0` (직각 도형)
- 모노스페이스 라벨 (`SECTION/01`, `CASE/001` 형식)
- 검정 두꺼운 라인
- 인더스트리얼 카탈로그 톤

## Development Commands

```bash
# 개발 서버
npm run dev

# 빌드
npm run build

# 타입 체크
npm run typecheck

# 린트
npm run lint

# 테스트
npm run test

# DB 마이그레이션 (Prisma 기준)
npx prisma migrate dev
npx prisma generate
npx prisma studio
```

## Repository Structure

```
ss-mart/
├── .claude/                    # Claude Code 설정
│   ├── skills/                 # 자주 쓰는 작업 (자수, 단체주문 등)
│   ├── agents/                 # 전문 서브에이전트
│   ├── hooks/                  # 자동 실행 훅
│   ├── commands/               # 슬래시 커맨드
│   └── settings.json           # 권한 / 모델 설정
├── docs/                       # 프로젝트 문서
│   ├── architecture/           # 시스템 아키텍처
│   ├── domain/                 # 비즈니스 도메인 규칙
│   ├── database/               # DB 스키마, ERD
│   ├── api/                    # API 명세
│   ├── development/            # 개발 가이드
│   └── deployment/             # 배포 가이드
├── app/                        # Next.js App Router (예상)
├── components/                 # 공통 컴포넌트
├── lib/                        # 유틸리티, DB 클라이언트
├── prisma/                     # Prisma 스키마, 마이그레이션
├── public/                     # 정적 자산
└── CLAUDE.md                   # 이 파일
```

## Important References

새로 작업 시작할 때 반드시 참고할 문서:

- `docs/architecture/overview.md` — 전체 아키텍처 한눈에 보기
- `docs/architecture/tech-stack.md` — 기술 스택 결정 근거
- `docs/domain/business-rules.md` — 비즈니스 규칙 상세
- `docs/database/schema.md` — DB 스키마 / ERD
- `docs/development/coding-standards.md` — 코딩 컨벤션
- `docs/development/component-guide.md` — 컴포넌트 작성 가이드

## Behavior Rules for Claude

### 항상 지킬 것

1. **디자인 시안 우선**: 새 컴포넌트 작성 시 `/mnt/user-data/outputs/workwear/` 의 시안 HTML을 먼저 확인
2. **도메인 규칙 우선**: 비즈니스 규칙(자수/단체주문/인증)은 기술적 편의보다 우선
3. **타입 안전성**: TypeScript strict 모드 유지
4. **시안 그대로 구현**: 시안의 디자인 토큰 / 폰트 / 간격 / 컬러 정확히 재현
5. **금액 계산은 서버에서**: 클라이언트 측 가격 조작 방지
6. **재고 / 가격 서버 검증**: 결제 전 항상 서버에서 재확인
7. **자수는 별도 상태 머신**: 일반 상품 상태와 자수 작업 상태 분리

### 절대 하지 말 것

1. ❌ **저작권 있는 캐릭터** 자수 디자인 생성 (디즈니, 마블, 닌텐도 등)
2. ❌ **클라이언트 사이드 결제 계산만으로** 주문 처리
3. ❌ **디자인 토큰 임의 변경** (시안 일관성 깨짐)
4. ❌ **자수 추가 상품 단순 환불** 플로우 자동 처리
5. ❌ **재고 미확인 상태로** 결제 진행
6. ❌ **PII / 결제 정보** 평문 저장 또는 로그
7. ❌ **개발 중 실제 결제 PG** 호출

## Quick Status

- **현재 단계**: 초기 셋업 / 문서화
- **다음 단계**: DB 스키마 설계 → 인증 시스템 → 상품 카탈로그
- **마일스톤**: `docs/development/roadmap.md` 참조
