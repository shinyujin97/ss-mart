# 환경 변수 (Environment Variables)

> 모든 환경 변수의 용도와 발급 방법. **실제 값은 절대 이 문서에 기재하지 않음.**

## .env 파일 구조

```
프로젝트 루트/
├── .env.example       # 템플릿 (커밋 OK, 실제 값 X)
├── .env.local         # 로컬 개발 (커밋 X, .gitignore)
├── .env.staging       # 스테이징 (커밋 X)
└── .env.production    # 프로덕션 (커밋 X, Vercel 환경변수에 저장)
```

## .env.example 템플릿

```bash
# .env.example
# 이 파일을 복사해서 .env.local 만들고 실제 값 입력

# ═══════════════════════════════════════════════════════
# DATABASE (Supabase PostgreSQL)
# ═══════════════════════════════════════════════════════
# Supabase Dashboard → Project Settings → Database → Connection string
DATABASE_URL="postgresql://postgres.xxxxx:[password]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxxx:[password]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"

# ═══════════════════════════════════════════════════════
# SUPABASE (Auth + Storage)
# ═══════════════════════════════════════════════════════
# Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."  # 서버 전용, 절대 노출 X

# ═══════════════════════════════════════════════════════
# NEXT.JS / NEXTAUTH
# ═══════════════════════════════════════════════════════
NEXT_PUBLIC_URL="http://localhost:3000"  # Production: https://ssmart.kr
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..." # openssl rand -base64 32

# ═══════════════════════════════════════════════════════
# OAUTH (소셜 로그인)
# ═══════════════════════════════════════════════════════
# 카카오 로그인
KAKAO_CLIENT_ID=""
KAKAO_CLIENT_SECRET=""

# 네이버 로그인
NAVER_CLIENT_ID=""
NAVER_CLIENT_SECRET=""

# Google 로그인 (선택)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Apple 로그인 (선택)
APPLE_CLIENT_ID=""
APPLE_CLIENT_SECRET=""

# ═══════════════════════════════════════════════════════
# 결제 (토스페이먼츠)
# ═══════════════════════════════════════════════════════
# 토스페이먼츠 Dashboard → 개발 → API 키
NEXT_PUBLIC_TOSS_CLIENT_KEY=""
TOSS_SECRET_KEY=""
TOSS_WEBHOOK_SECRET=""  # 가상계좌 입금 확인용

# ═══════════════════════════════════════════════════════
# 알림 (카카오 알림톡 / SMS)
# ═══════════════════════════════════════════════════════
# 알리고 (https://smartsms.aligo.in)
ALIGO_API_KEY=""
ALIGO_USER_ID=""
ALIGO_SENDER=""  # 발신번호 (예: 1588-0000)

# 카카오 비즈메시지 (알림톡)
KAKAO_BIZ_API_KEY=""
KAKAO_BIZ_SENDER_KEY=""  # 발신 프로필 키

# ═══════════════════════════════════════════════════════
# 외부 서비스
# ═══════════════════════════════════════════════════════
# 우편번호 (카카오 주소 API)
NEXT_PUBLIC_KAKAO_ADDRESS_KEY=""

# 사업자번호 검증 (국세청 또는 nict.kr)
BUSINESS_VERIFY_API_KEY=""

# 이메일 (Resend - 거래 알림)
RESEND_API_KEY=""
RESEND_FROM_EMAIL="no-reply@ssmart.kr"

# ═══════════════════════════════════════════════════════
# 모니터링
# ═══════════════════════════════════════════════════════
# Sentry
NEXT_PUBLIC_SENTRY_DSN=""
SENTRY_AUTH_TOKEN=""  # 소스맵 업로드용
SENTRY_ORG=""
SENTRY_PROJECT=""

# ═══════════════════════════════════════════════════════
# 이미지 / 스토리지
# ═══════════════════════════════════════════════════════
# Vercel Blob (이미지 호스팅, Supabase Storage 대안)
BLOB_READ_WRITE_TOKEN=""

# Cloudinary (이미지 변환 - 선택)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# ═══════════════════════════════════════════════════════
# 관리자 / 운영
# ═══════════════════════════════════════════════════════
# 관리자 알림 (Slack Webhook)
SLACK_WEBHOOK_URL=""
SLACK_BULK_ORDER_CHANNEL="#bulk-orders"
SLACK_ERROR_CHANNEL="#errors"

# Cron Secret (Vercel Cron 보호)
CRON_SECRET=""  # openssl rand -base64 32

# ═══════════════════════════════════════════════════════
# 비즈니스 설정
# ═══════════════════════════════════════════════════════
NEXT_PUBLIC_BUSINESS_NAME="에스에스종합상사"
NEXT_PUBLIC_CS_PHONE="1588-0000"
NEXT_PUBLIC_KAKAO_CHANNEL="@ssmart"
NEXT_PUBLIC_BUSINESS_HOURS="평일 09:00 - 18:00"

# ═══════════════════════════════════════════════════════
# 기능 플래그 (Feature Flags)
# ═══════════════════════════════════════════════════════
NEXT_PUBLIC_ENABLE_SIMULATOR="true"        # 자수 시뮬레이터
NEXT_PUBLIC_ENABLE_BULK_ORDER="true"       # 단체주문
NEXT_PUBLIC_ENABLE_REVIEWS="true"          # 리뷰
NEXT_PUBLIC_MAINTENANCE_MODE="false"       # 점검 모드
```

## 환경별 설정

### Local (.env.local)

- **모든 외부 서비스: 테스트 / Sandbox 키만**
- 결제: 토스페이먼츠 Test 키
- DB: Supabase Free Tier 별도 프로젝트 추천 (개발용)

### Preview (Vercel)

- PR 미리보기용
- 외부 서비스: 테스트 키
- DB: Staging Supabase 또는 Production Branch

### Staging (Vercel)

- 사장님 / 무료 개발자 검수용
- 외부 서비스: 테스트 키 (실 결제 X)
- DB: Staging Supabase
- 도메인: staging.ssmart.kr

### Production (Vercel)

- 실제 운영
- 외부 서비스: **실제 키**
- DB: Production Supabase
- 도메인: ssmart.kr

## 발급 절차 / 가이드

### 1. Supabase

```
https://supabase.com/dashboard
1. New Project
2. Region: Northeast Asia (Seoul)
3. Project Settings → API → URL/Keys 복사
4. Project Settings → Database → Connection string 복사
```

### 2. 토스페이먼츠

```
https://app.tosspayments.com
1. 회원가입 (사업자등록증 필요)
2. 개발자센터 → 테스트키 즉시 사용 가능
3. 실 운영 키는 사업자 검증 후 발급 (3~5일)
4. 웹훅 URL 등록: https://ssmart.kr/api/webhooks/toss
```

### 3. 카카오 로그인

```
https://developers.kakao.com
1. 내 애플리케이션 → 추가하기
2. 앱 키 → JavaScript 키 (NEXT_PUBLIC_KAKAO_CLIENT_ID)
3. 카카오 로그인 → 활성화
4. Redirect URI: https://ssmart.kr/api/auth/callback/kakao
5. 동의 항목 설정 (이메일, 닉네임 필수)
```

### 4. 알리고 (SMS)

```
https://smartsms.aligo.in
1. 회원가입 + 사업자 인증
2. API 사용 신청 (발신번호 인증)
3. API 정보 → API 키 발급
4. 발신번호: 1588-0000 사전 등록
```

### 5. 카카오 비즈메시지 (알림톡)

```
https://business.kakao.com
1. 카카오 채널 (@ssmart) 생성
2. 비즈메시지 → 알림톡 신청
3. 발송 프로필 등록 (1~3일 심사)
4. 알림톡 템플릿 등록 (각 시나리오마다)
   - 결제 완료
   - 자수 시안 검토 요청
   - 자수 시안 확정
   - 배송 시작
   - 단체주문 견적 발송
```

### 6. Sentry

```
https://sentry.io
1. 무료 계정 생성
2. New Project → Next.js 선택
3. DSN 복사 → NEXT_PUBLIC_SENTRY_DSN
4. Auth Token 발급 (소스맵 업로드용)
```

## 보안 원칙

### 절대 하지 말 것

```
❌ .env 파일 git 커밋
❌ NEXT_PUBLIC_ 접두사 없는 키를 클라이언트 코드에서 사용
❌ Service Role Key 클라이언트 노출
❌ 시크릿을 console.log
❌ 시크릿을 에러 메시지에 포함
❌ 시크릿을 로그에 평문 저장
```

### 항상 확인할 것

```
✅ .env*  → .gitignore 에 등록
✅ Vercel 환경 변수는 Production / Preview / Development 분리
✅ NEXT_PUBLIC_ 만 클라이언트 노출 (의도적인 것만)
✅ Service Role Key 는 서버 라우트에서만
✅ 분기별 시크릿 키 회전
✅ 직원 이탈 시 즉시 키 회전
```

## .gitignore 필수 항목

```bash
# .gitignore
.env
.env.local
.env.production
.env.staging
.env.*.local

# 시드용 시크릿
prisma/seeds/private/

# 인증서
*.pem
*.key
credentials.json
```

## 환경 변수 검증 (Zod)

런타임에 환경 변수가 누락되었는지 자동 검증:

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  NEXTAUTH_SECRET: z.string().min(32),
  TOSS_SECRET_KEY: z.string(),
  // ...
});

export const env = envSchema.parse(process.env);

// 빌드 시 환경 변수 누락 즉시 감지
```

## 키 회전 주기

| 종류 | 회전 주기 | 비고 |
|------|----------|------|
| 데이터베이스 비밀번호 | 6개월 | Supabase Dashboard에서 |
| NEXTAUTH_SECRET | 1년 | 회전 시 모든 세션 만료 |
| 토스페이먼츠 시크릿 | 사고 시 즉시 | |
| 카카오 / 네이버 OAuth | 사고 시 즉시 | |
| Cloudinary / Blob 토큰 | 6개월 | |
| Slack Webhook | 1년 | |
| Cron Secret | 1년 | |
