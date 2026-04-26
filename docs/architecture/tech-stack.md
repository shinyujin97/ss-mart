# 기술 스택 (Tech Stack)

> 사용할 기술과 그 결정 근거. 새 기술 도입 시 이 문서에 추가하고 근거 명시.

## 결정된 스택 (Confirmed)

### 핵심 스택 ✅

| 카테고리 | 선택 | 비고 |
|---------|------|------|
| **Frontend** | Next.js 15 (App Router) + React 19 | 풀스택 단일 |
| **Backend** | Next.js API Routes + Server Actions | 별도 백엔드 X |
| **Database** | PostgreSQL 16+ (Supabase) | 매니지드 |
| **Hosting** | Vercel | 서버리스 |
| **ORM** | Prisma 6 | 마이그레이션 + 타입 |
| **Styling** | Tailwind CSS v4 | 디자인 토큰 매핑 |
| **Auth** | NextAuth v5 (Auth.js) | 소셜 로그인 통합 |
| **Storage** | Supabase Storage 또는 Vercel Blob | 이미지 + 자수 시안 |
| **Payment** | 토스페이먼츠 (1순위) | DX 최고 + B2B 세금계산서 |
| **Monitoring** | Sentry | 에러 추적 |

### 결정 근거 요약

**왜 Next.js 15 + Vercel + Supabase 조합인가**:

1. **시작이 가장 빠르다** — 인프라 셋업 거의 0
   - Supabase: PostgreSQL + Auth + Storage 한 번에
   - Vercel: Git push 만으로 배포
   - 첫 배포까지 1주 이내 가능

2. **사장님 사업 규모에 적정** — 월 1,000만원 매출 / 일 100~500 주문
   - Vercel Pro ($20/월) 이면 충분
   - Supabase Pro ($25/월) PostgreSQL + Auth + 8GB 스토리지
   - 총 인프라 비용 ~70,000원/월

3. **확장 가능** — 트래픽 늘어도 자동 스케일
   - Vercel Edge Functions
   - Supabase Read Replica (필요 시)
   - 일 매출 1억 규모까지는 추가 작업 거의 불필요

4. **한국 개발자 풀이 가장 큼** — 무료 개발자도 작업 용이

**선택 이유**:
1. **SEO 필수**: 작업복몰은 검색 트래픽이 핵심 (예: "PIOZEN 동절기 작업복") → SSR 필수
2. **이미지 최적화**: 80여 개 브랜드 × 5,940 상품 = 수만 장 이미지 → `next/image` 자동 최적화 (WebP, lazy loading)
3. **풀스택**: API Routes / Server Actions로 백엔드 통합 → 별도 백엔드 불필요
4. **Server Components**: 카테고리 / 상품 목록 같은 정적 콘텐츠는 RSC로 클라이언트 번들 최소화
5. **Korean ecosystem**: 한국 개발자 풀 가장 큼, Vercel + 카페24 + AWS 모두 잘 작동

**버전**: Next.js 15 (App Router) + React 19

**대안 비교**:

| 항목 | Next.js 15 | React 19 + Vite | Remix |
|------|-----------|-----------------|-------|
| SEO | ⭐⭐⭐⭐⭐ | ⭐⭐ (CSR) | ⭐⭐⭐⭐⭐ |
| 이미지 최적화 | ⭐⭐⭐⭐⭐ | 직접 구현 | ⭐⭐⭐⭐ |
| 한국 생태계 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| 학습 곡선 | 보통 | 쉬움 | 보통 |
| 풀스택 | API Routes | 별도 필요 | Loaders/Actions |
| **이커머스 적합성** | **최고** | 부족 (SEO) | 좋음 |

**왜 Vite + SPA가 안 되는가**:
- 검색 엔진이 빈 HTML만 보면 색인 안 됨
- 작업복은 정보성 검색이 매출 상당 부분 → SEO 빠지면 매출 직격
- 이미지 최적화를 직접 구현해야 함 → 비용 / 시간 낭비

### 백엔드 / API

#### 🥇 추천: **Next.js API Routes + Server Actions**

**선택 이유**:
1. **단일 코드베이스**: 별도 백엔드 분리 시 관리 비용 2배
2. **Server Actions**: 폼 제출 / 상태 변경에 최적, 자수 시안 / 견적 등에 잘 맞음
3. **타입 공유**: 프론트-백 간 타입 자동 동기화 (TypeScript)
4. **충분한 성능**: 월 1,000만원 매출 규모면 단일 Next.js 서버로 충분
5. **확장 가능**: 나중에 트래픽 늘면 일부 API만 별도 마이크로서비스로 분리 가능

**대안**:
- **NestJS** (별도 백엔드): 팀이 크거나 마이크로서비스로 분리 예정일 때
- **FastAPI** (Python): 데이터 분석 / ML 통합 시 (현재 단계 불필요)

### ORM / DB 클라이언트

#### 🥇 추천: **Prisma**

**선택 이유**:
1. **타입 안전**: 스키마 → 타입 자동 생성, 작업복 도메인 복잡 (자수 옵션 등) → 타입 안전성 핵심
2. **마이그레이션**: SQL 마이그레이션 자동 생성 + 안전 적용
3. **Prisma Studio**: 비개발자도 DB 조회 가능 (사장님이 주문 / 매출 확인 가능)
4. **JSON 컬럼 지원**: 자수 옵션 같은 유연한 데이터 저장 용이
5. **한국 자료 풍부**

**대안**:
- **Drizzle**: SQL에 가깝고 빠름. Prisma만큼 ergonomic 하지 않음
- **TypeORM**: 점차 사용률 감소
- **Kysely**: 쿼리 빌더, 자동 마이그레이션 없음

### 스타일링

#### 🥇 추천: **Tailwind CSS v4 + 자체 디자인 토큰**

**선택 이유**:
1. **이미 시안에 적용**: HTML 시안이 모두 Tailwind 톤의 utility class 스타일
2. **일관성**: 디자인 토큰 (CLAUDE.md 참고) 그대로 `tailwind.config` 에 매핑
3. **번들 최소화**: 사용한 클래스만 빌드
4. **유지보수**: 컴포넌트 안에서 스타일 관리

**규칙**:
- 디자인 토큰은 `globals.css` 의 `:root` 에 CSS 변수로 정의 (시안 그대로)
- Tailwind 설정에서 `theme.extend.colors` 로 매핑
- 인라인 스타일 / `style={}` 사용 금지 (단, 동적 색상 등 필수 케이스 제외)

### 인증 / 세션

#### 🥇 추천: **NextAuth (Auth.js v5)**

**선택 이유**:
1. **소셜 로그인** (카카오 / 네이버 / Google / Apple) 빌트인
2. **Database 세션** 지원 (PostgreSQL)
3. **법인 / 개인 회원 분기** Adapter 커스터마이즈 가능
4. **표준 보안** (CSRF, JWT, 세션 회전 등 기본)

**대안**:
- **Lucia**: 더 가볍지만 소셜 로그인 직접 구현 필요
- **Clerk**: 강력하지만 유료 (월 $25+)
- **Supabase Auth**: Supabase 호스팅 시만

### 결제 (PG)

#### 🥇 추천: **토스페이먼츠** 또는 **KG이니시스**

**선택 이유**:
- **토스페이먼츠**:
  - 개발 경험 가장 좋음 (DX)
  - 빠른 정산 (D+2)
  - 간편결제 (토스, 페이코, 카카오페이) 통합
  - **세금계산서 발행 API** 제공 (B2B에 필수)
- **KG이니시스**:
  - 가장 보편적, 카페24 등 솔루션 호환성 최고
  - 수수료 협상 가능
  - 한국 PG 표준

**필수 기능**:
- ✅ 신용카드 / 체크카드 결제
- ✅ 간편결제 (카카오페이, 네이버페이, 토스페이)
- ✅ 계좌이체 / 무통장입금
- ✅ **에스크로** (10만원 이상)
- ✅ **세금계산서 발행** (B2B 핵심)
- ✅ 부분 환불 / 취소

### 이미지 / 미디어

#### 🥇 추천: **Vercel Blob** (Vercel 사용 시) or **Cloudinary** (범용)

**Vercel Blob**:
- 가장 간단, `next/image` 와 자동 통합
- 이미지 5GB 까지 무료 (그 후 GB당 $0.15)
- **단점**: Vercel 종속

**Cloudinary**:
- 강력한 이미지 변환 (resize, watermark, AI crop)
- 무료 25GB
- 자수 시뮬레이터에서 로고 업로드 → 처리 시 유리
- **추천**: 자수 사업의 특수성 고려 시 Cloudinary가 더 적합

**대안**:
- **AWS S3 + CloudFront**: 직접 운영, 가장 저렴, 설정 복잡
- **Cafe24 호스팅**: 패키지에 포함 (제한적)

### 캐시 / 큐 (선택)

#### 도입 시점: **트래픽 늘어난 후**

- **Redis (Upstash)**:
  - 세션 / 장바구니 캐싱
  - 자수 시뮬레이터 임시 저장
  - 초기에는 PostgreSQL로 충분, 트래픽 늘면 추가
- **BullMQ + Redis**:
  - 자수 작업 큐 / 이메일 / SMS 큐
  - 단계적 도입

### 검색

#### 단계별 도입

**Phase 1 (현재)**: PostgreSQL 풀텍스트 검색
- `pg_trgm`, `tsvector` 사용
- 한국어는 형태소 분석 부족하지만 작은 규모는 충분

**Phase 2 (확장 시)**: Meilisearch 또는 Typesense
- 한국어 지원 양호
- 자체 호스팅 가능

**Phase 3 (대규모)**: Elasticsearch / OpenSearch
- 추천 시스템 / 검색 분석까지 필요할 때

### 모니터링 / 로깅

| 카테고리 | 도구 | 비용 |
|---------|------|------|
| 에러 | **Sentry** | 무료 5K 이벤트/월 |
| APM | **Vercel Analytics** (Vercel 사용 시) | 일부 무료 |
| 로그 | **Better Stack (Logtail)** | 무료 1GB/월 |
| 알림 | **Slack Webhook** | 무료 |
| 업타임 | **Better Uptime** | 무료 10 모니터 |

### 개발 도구

| 카테고리 | 도구 |
|---------|------|
| 패키지 매니저 | **pnpm** (속도 + 디스크 효율) |
| 린터 | **ESLint** (Next.js 기본) + **Biome** (포맷터, 빠름) |
| 타입 체크 | **TypeScript 5.6+** strict |
| Git Hooks | **Husky + lint-staged** |
| 테스트 단위 | **Vitest** |
| 테스트 E2E | **Playwright** |
| API 테스트 | **MSW** (Mock Service Worker) |
| 컴포넌트 개발 | **Storybook** (선택) |

## 호스팅 / 배포 옵션 비교

`../deployment/hosting-options.md` 참조 (별도 문서)

## 새 라이브러리 도입 체크리스트

새 의존성 추가 전 다음 질문에 답하기:

- [ ] 이미 있는 라이브러리로 해결 가능한가?
- [ ] GitHub Star 1,000+ 인가?
- [ ] 최근 6개월 내 업데이트 있나?
- [ ] 번들 크기 영향은? (Bundlephobia 확인)
- [ ] TypeScript 지원하나?
- [ ] 라이선스 (MIT / Apache 등 OK, AGPL 주의)
- [ ] 한국어 자료 / 커뮤니티 있나?

## 절대 도입 금지

- ❌ **Moment.js** → `date-fns` 또는 `dayjs` 사용
- ❌ **Lodash 전체 import** → 개별 함수 import
- ❌ **자체 결제 모듈** → 항상 PG사 위임 (PCI DSS)
- ❌ **자체 비밀번호 해싱** → bcrypt / argon2 사용
- ❌ **레거시 jQuery** 플러그인
