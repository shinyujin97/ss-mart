# 에스에스종합상사 (SS Mart)

> 작업복 / 안전화 / 안전용품 멀티브랜드 종합상사 이커머스
> 자수 / 마킹 서비스 통합 + B2B 단체주문

## 🎯 프로젝트 개요

- **사업자**: 에스에스종합상사 (인천)
- **취급 브랜드**: 80여 개 (PIOZEN, CARHARTT, K2 SAFETY, 3M 등)
- **차별화**: 자수 / 마킹 서비스 + 단체주문 30% 할인 + 캐릭터 디자인
- **목표 매출**: 월 1,000만원 (Phase 1)

## 🛠 Tech Stack

```
Frontend  : Next.js 15 (App Router) + React 19
Backend   : Next.js API Routes + Server Actions
Database  : PostgreSQL 16 (via Supabase)
Hosting   : Vercel
ORM       : Prisma 6
Styling   : Tailwind CSS v4 + 자체 디자인 토큰
Auth      : NextAuth v5 (Auth.js)
Storage   : Supabase Storage
Payment   : 토스페이먼츠
Monitoring: Sentry + Vercel Analytics
```

## 📂 프로젝트 구조

```
ss-mart/
├── 📄 CLAUDE.md              # ★ Claude Code 프로젝트 메모리 (필독)
├── 📄 README.md              # 이 파일
│
├── .claude/                  # Claude Code 확장 설정
│   ├── settings.json         # 권한 / 훅 / 모델 설정
│   ├── skills/               # 도메인별 Skill (6개)
│   │   ├── embroidery-system/
│   │   ├── bulk-order-flow/
│   │   ├── product-catalog/
│   │   ├── payment-flow/
│   │   ├── component-builder/
│   │   └── database-migration/
│   ├── agents/               # 전문 서브에이전트 (5개)
│   │   ├── code-reviewer.md
│   │   ├── test-writer.md
│   │   ├── db-migrator.md
│   │   ├── explorer.md
│   │   └── schema-validator.md
│   ├── hooks/                # 자동화 훅 (6개, deterministic)
│   │   ├── block-dangerous-commands.sh
│   │   ├── block-secret-files.sh
│   │   ├── auto-format.sh
│   │   ├── prisma-auto-generate.sh
│   │   ├── inject-skill-hints.sh
│   │   └── session-start.sh
│   └── commands/             # 슬래시 커맨드 (3개)
│       ├── component.md      # /component 시안→React
│       ├── seed.md           # /seed
│       └── check-business-rules.md
│
├── docs/                     # 프로젝트 문서
│   ├── architecture/
│   │   ├── overview.md       # ★ 전체 시스템 아키텍처
│   │   └── tech-stack.md     # 기술 스택 결정 근거
│   ├── domain/
│   │   └── business-rules.md # ★★★ 비즈니스 규칙 (가장 중요)
│   ├── database/
│   │   └── schema.md         # ★ DB 스키마 + Prisma
│   ├── development/
│   │   ├── coding-standards.md
│   │   └── roadmap.md        # ★ 개발 일정
│   └── deployment/
│       ├── vercel-supabase.md
│       ├── env-variables.md
│       └── checklist.md
│
├── app/                      # Next.js App Router
├── components/               # 공통 컴포넌트
├── lib/                      # 유틸 / 비즈니스 로직
├── prisma/                   # Prisma 스키마 / 마이그레이션
└── public/                   # 정적 자산
```

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 20+
- pnpm 9+ (권장) 또는 npm
- Supabase 계정 (Free Tier OK 개발용)
- Vercel 계정 (배포용)

### 설치

```bash
# 1. 저장소 클론
git clone https://github.com/{org}/ss-mart.git
cd ss-mart

# 2. 의존성 설치
pnpm install

# 3. 환경 변수 설정
cp .env.example .env.local
# .env.local 편집 (docs/deployment/env-variables.md 참조)

# 4. DB 마이그레이션
pnpm prisma migrate dev

# 5. 시드 데이터 (카테고리 / 브랜드)
pnpm prisma db seed

# 6. 개발 서버 시작
pnpm dev
```

http://localhost:3000 접속

### 자주 쓰는 명령어

```bash
# 개발
pnpm dev              # 개발 서버
pnpm build            # 프로덕션 빌드
pnpm start            # 프로덕션 서버

# DB
pnpm prisma studio              # DB GUI
pnpm prisma migrate dev          # 마이그레이션 생성 + 적용
pnpm prisma generate             # 타입 재생성
pnpm prisma db seed              # 시드 데이터

# 품질
pnpm typecheck        # TypeScript 검증
pnpm lint             # ESLint
pnpm format           # 포매팅
pnpm test             # 단위 테스트
pnpm test:e2e         # E2E 테스트
```

## 📚 새 개발자 가이드

처음 합류 시 이 순서로 읽으세요:

1. **`CLAUDE.md`** — 프로젝트 전체 컨텍스트 (필독, 5분)
2. **`docs/domain/business-rules.md`** — 비즈니스 규칙 (필독, 15분)
3. **`docs/architecture/overview.md`** — 시스템 아키텍처 (10분)
4. **`docs/database/schema.md`** — DB 모델 (10분)
5. **`docs/development/roadmap.md`** — 어디서부터 작업할지 (5분)
6. **`docs/development/coding-standards.md`** — 코딩 컨벤션 (10분)

## 🎨 디자인 시안

15개 핵심 페이지의 디자인 시안이 완성되어 있습니다.

위치: `/mnt/user-data/outputs/workwear/` 또는 별도 전달받은 위치

| 번호 | 페이지 | 라우트 |
|------|--------|--------|
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

⚠️ **시안의 디자인 토큰을 정확히 재현해야 합니다**:
- 컬러: 빨강 #c8161d / 검정 #111 / 노랑 #ffd400
- 폰트: Noto Sans KR / IBM Plex Mono / Bebas Neue
- 직각 도형 (border-radius 0)
- 모노스페이스 라벨 (SECTION/01, CASE/001 형식)

## 🤖 Claude Code 활용

이 프로젝트는 **Claude Code 로 효율적으로 개발하도록 설계**되었습니다.

### 자동 동작

세션 시작 시:
- `CLAUDE.md` 자동 로드 (프로젝트 메모리)
- `session-start.sh` 훅이 최근 변경 사항 표시
- 위험 명령 자동 차단 (rm -rf, .env 접근 등)
- 키워드 감지 시 관련 Skill 힌트 자동 주입

### 슬래시 커맨드

```bash
# 시안 → React 컴포넌트 자동 변환
/component 18

# 시드 데이터 생성
/seed

# 비즈니스 규칙 위반 검사
/check-business-rules
```

### 서브에이전트

```bash
# 코드 리뷰 (Edit/Write 후 자동)
@code-reviewer 이 PR 검토해줘

# 테스트 작성
@test-writer 자수 가격 계산 테스트 작성

# DB 마이그레이션
@db-migrator 새 컬럼 추가 마이그레이션

# 코드 탐색 (메인 컨텍스트 절약)
@explorer 자수 가격 계산이 어디 있는지 찾아줘

# 스키마 일관성 검증
@schema-validator EmbroideryStatus 새 값 추가했어
```

## 🔐 보안 / 규정

### 한국 법규 준수

- ✅ 통신판매업 신고
- ✅ 개인정보 처리방침
- ✅ 전자상거래법 청약 철회
- ✅ 에스크로 / 안전결제 (10만원+)
- ✅ 세금계산서 발행 (B2B)
- ✅ KCs 인증 표시 (안전용품)

### 보안 원칙

- ✅ 비밀번호: bcrypt 12+ rounds
- ✅ 카드 정보: PG사 위임 (자체 저장 X)
- ✅ 사업자번호: 암호화 저장
- ✅ 결제 가격: 서버 재계산
- ✅ 재고: SELECT FOR UPDATE 락
- ✅ HTTPS 강제 + HSTS
- ✅ Rate Limiting (API)

## 🚨 비즈니스 핵심 규칙 (절대 어기지 말 것)

```
1. 자수 추가 상품 단순 변심 환불 자동 처리 ❌
   → 전자상거래법 맞춤 제작 조항

2. 저작권 IP (디즈니/마블/닌텐도 등) 자수 작업 ❌
   → 모든 시안에 키워드 검증 필수

3. 클라이언트 가격으로 결제 진행 ❌
   → 서버에서 재계산 필수

4. 100벌 미만에 단체할인 적용 ❌

5. 사업자 회원 아닌데 세금계산서 발행 ❌

6. KCs 인증 카테고리에 인증 정보 누락 ❌
   → 안전화/안전모/마스크는 필수
```

상세: `docs/domain/business-rules.md`

## 📞 연락처

- **CS 전화**: 1588-0000
- **카카오 채널**: @ssmart
- **이메일**: contact@ssmart.kr
- **본사**: 인천광역시 ○○구 ○○로 000

## 📄 라이선스

Private - 에스에스종합상사 © 2026
