# 배포 가이드 (Vercel + Supabase)

> 확정 스택: Next.js 15 + Vercel + Supabase (PostgreSQL + Auth + Storage)

## 전체 배포 구조

```
┌──────────────────────────────────────────────────────────────┐
│                        사용자 (Browser)                       │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                       Vercel Edge Network                     │
│           (CDN, 한국 ICN 리전, 자동 SSL, DDoS 방어)            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                      Vercel Functions                         │
│              (Next.js Server Components + API)                │
└──────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┼──────────────┐
              ▼             ▼              ▼
       ┌────────────┐ ┌─────────┐ ┌──────────────┐
       │  Supabase  │ │ Vercel  │ │ External APIs │
       │            │ │  Blob   │ │               │
       │ PostgreSQL │ │ (이미지)│ │ - 토스페이먼츠 │
       │ Auth       │ └─────────┘ │ - 카카오 알림톡│
       │ Storage    │             │ - 알리고 SMS   │
       │ Realtime   │             │ - 우편번호 API │
       └────────────┘             │ - Sentry      │
                                  └──────────────┘
```

## 1. Supabase 셋업

### 프로젝트 생성

```bash
# https://supabase.com/dashboard 접속
# 1. New Project 클릭
# 2. 정보 입력:
#    - Name: ss-mart-prod (또는 ss-mart-staging)
#    - Database Password: (강한 비밀번호, 1Password 등에 저장)
#    - Region: Northeast Asia (Seoul) ap-northeast-2
#    - Pricing Plan: Pro ($25/월) 권장
# 3. 생성 완료 (1~2분 소요)
```

### 연결 정보 확인

Supabase Dashboard → Project Settings → Database

```
# Connection string (Prisma용)
postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct connection (마이그레이션용)
postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
```

⚠️ **중요**: Pooler URL (6543) 과 Direct URL (5432) 두 개 모두 필요
- Pooler: 일반 쿼리 (서버리스 환경 connection pool)
- Direct: 마이그레이션 / Prisma migrate

### 환경 변수 설정

```bash
# .env.local (개발 - 절대 커밋 X)
DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...pooler.supabase.com:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://[ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."  # 서버 전용, 절대 클라이언트 노출 X
```

### Prisma 설정

```prisma
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // ⚠️ Supabase 필수
}
```

### 첫 마이그레이션

```bash
# 로컬에서 한 번만
npx prisma migrate dev --name init

# 시드 데이터 (카테고리 / 브랜드)
npx prisma db seed
```

### Supabase Storage 버킷 생성

자수 시안 / 상품 이미지용 버킷 셋업:

```sql
-- Supabase Dashboard → SQL Editor

-- 1. 상품 이미지 (공개)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- 2. 자수 시안 (인증 필요)
INSERT INTO storage.buckets (id, name, public)
VALUES ('embroidery-designs', 'embroidery-designs', false);

-- 3. 견적서 PDF (인증 필요)
INSERT INTO storage.buckets (id, name, public)
VALUES ('quote-documents', 'quote-documents', false);

-- 4. 회사 로고 / 자수 업로드 (인증 필요)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-uploads', 'user-uploads', false);

-- RLS (Row Level Security) 정책
-- 자세한 정책은 deployment/supabase-rls.md 참조
```

## 2. Vercel 셋업

### 프로젝트 연결

```bash
# 1. https://vercel.com/new 접속
# 2. GitHub 저장소 import (ss-mart)
# 3. Framework Preset: Next.js 자동 감지
# 4. Root Directory: ./
# 5. 환경 변수 입력 (아래 표 참조)
# 6. Deploy 클릭
```

### 환경 변수 (Production)

Vercel Dashboard → Settings → Environment Variables

| 변수 | 값 | 환경 |
|------|----|----|
| `DATABASE_URL` | Supabase Pooler URL | All |
| `DIRECT_URL` | Supabase Direct URL | All |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key | Production / Preview |
| `NEXTAUTH_URL` | https://ssmart.kr | Production |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | All |
| `TOSS_CLIENT_KEY` | 토스 클라이언트 키 | All |
| `TOSS_SECRET_KEY` | 토스 시크릿 키 | Production / Preview |
| `KAKAO_API_KEY` | 카카오 알림톡 키 | All |
| `ALIGO_API_KEY` | 알리고 SMS 키 | All |
| `SENTRY_DSN` | Sentry DSN | All |
| `NEXT_PUBLIC_URL` | https://ssmart.kr | Production |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 토큰 | All (Vercel Blob 사용 시) |

⚠️ **테스트 키와 프로덕션 키 분리**:
- Production: 실 결제 키
- Preview: 테스트 키 (PR 미리보기)
- Development: 테스트 키 (.env.local)

### 도메인 연결

Vercel Dashboard → Settings → Domains

```bash
# 사장님이 사전 구매하신 도메인 연결
# 1. Add Domain: ssmart.kr (또는 사장님 도메인)
# 2. DNS 설정 (도메인 등록 업체에서):
#    Type: A     Name: @     Value: 76.76.21.21
#    Type: CNAME Name: www   Value: cname.vercel-dns.com
# 3. SSL 자동 발급 (Let's Encrypt)
# 4. 검증 완료까지 5~30분
```

### 빌드 설정

```json
// vercel.json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "prisma generate && next build",
  "regions": ["icn1"],
  "functions": {
    "app/api/orders/route.ts": {
      "maxDuration": 30
    },
    "app/api/embroidery/calculate-price/route.ts": {
      "maxDuration": 10
    }
  },
  "crons": [
    {
      "path": "/api/cron/cancel-unpaid-orders",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/check-quote-sla",
      "schedule": "*/30 9-18 * * 1-5"
    },
    {
      "path": "/api/cron/expire-coupons",
      "schedule": "0 0 * * *"
    }
  ]
}
```

## 3. CI/CD 파이프라인

### Git 브랜치 전략

```
main           ← Production (자동 배포)
├── staging    ← Staging (자동 배포)
└── develop    ← Development
    └── feature/embroidery-simulator  ← 기능 브랜치 (Preview 자동 생성)
```

### Preview 배포 (자동)

- 모든 PR 마다 고유 URL 자동 생성 (예: `ss-mart-git-feature-xyz.vercel.app`)
- 환경 변수: Preview 키 자동 적용
- 무료 개발자 / 사장님이 PR 마다 미리보기 가능

### Production 배포

```bash
# main 브랜치에 머지하면 자동 배포
git checkout main
git merge --no-ff feature/embroidery-simulator
git push origin main
# → Vercel 자동 빌드 + 배포 (3~5분)
```

### 배포 전 체크리스트 (`deployment/checklist.md`)

```
[배포 전]
- [ ] 모든 테스트 통과 (npm run test)
- [ ] TypeScript 컴파일 OK (npm run typecheck)
- [ ] 린트 통과 (npm run lint)
- [ ] 마이그레이션 staging 검증
- [ ] 환경 변수 추가 / 변경 사항 확인
- [ ] 비즈니스 규칙 검사 (/check-business-rules)

[배포 중]
- [ ] Vercel 빌드 로그 확인
- [ ] 헬스 체크 endpoint 응답
- [ ] Sentry 에러 모니터링

[배포 후]
- [ ] 핵심 플로우 수동 테스트 (로그인 / 결제 / 자수)
- [ ] 카톡 알림 정상 작동
- [ ] PG 결제 테스트 (1원 결제)
- [ ] 모바일 / PC 양쪽 확인
```

## 4. 모니터링

### Sentry 통합

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // PII 마스킹
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },
});
```

### Vercel Analytics

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 알림 설정

```
[Vercel]
- Failed Deployment → Slack
- Function Error → Email + Slack

[Supabase]
- DB 연결 실패 → Slack
- Storage 90% 사용 → Email

[Sentry]
- New Error (Production) → Slack
- High Frequency Error → 즉시 알림

[비즈니스]
- 단체주문 견적 SLA 위반 (2시간 초과) → 사장님 + 매니저
- 결제 실패율 5% 초과 → 즉시 알림
- 재고 0 진입 상품 → 일간 요약
```

## 5. 비용 예상

### Phase 1 (개발 + 초기 운영, 일 0~50 주문)

| 서비스 | 플랜 | 월 비용 |
|--------|------|---------|
| Vercel | Pro | $20 |
| Supabase | Pro | $25 |
| 토스페이먼츠 | 결제 수수료 | 매출의 ~3% |
| Sentry | Team | $26 (선택, Free 충분) |
| Cloudinary | Free | $0 (25GB까지) |
| 카카오 알림톡 | 종량제 | ~10,000원 |
| 알리고 SMS | 종량제 | ~5,000원 |
| 도메인 | 연 갱신 | ~15,000원/년 |
| **소계** | | **약 70,000원/월** |

### Phase 2 (성장기, 일 100~500 주문)

| 서비스 | 플랜 | 월 비용 |
|--------|------|---------|
| Vercel | Pro | $20 + Bandwidth 추가 |
| Supabase | Pro + Add-ons | ~$50 |
| Cloudinary | Plus | $99 |
| **소계** | | **약 200,000원/월** |

### Phase 3 (대규모, 일 1,000+ 주문)

- Vercel Enterprise 또는 AWS 이전 검토
- Supabase Team 또는 자체 PostgreSQL
- 약 500,000~1,000,000원/월

## 6. 롤백 / 비상 대응

### 즉시 롤백 (Vercel)

```bash
# Vercel Dashboard → Deployments
# 1. 직전 정상 배포 선택
# 2. "Promote to Production" 클릭
# → 30초 내 롤백 완료
```

### DB 롤백

```bash
# 1. Supabase Dashboard → Database → Backups
# 2. 일별 자동 백업 (Pro 7일 보관)
# 3. PITR (Point in Time Recovery) - Pro 이상

# 또는 수동 백업
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### 장애 발생 시 체크 순서

```
1. Vercel Dashboard → Status (https://vercel.com/status)
2. Supabase Dashboard → Status (https://status.supabase.com)
3. Sentry → Issues (최근 1시간)
4. Vercel Logs → Production
5. PG사 (토스페이먼츠) 장애 공지

대응:
- Vercel 장애: 도메인 임시 CDN (Cloudflare) 백업 페이지
- Supabase 장애: Read Replica fallback (Phase 2부터)
- PG 장애: 다른 PG로 전환 (KG이니시스 백업)
```

## 7. 도메인 / SSL

```
[도메인 등록 업체에서]
- A 레코드: @ → 76.76.21.21
- CNAME: www → cname.vercel-dns.com
- TXT: 메타 태그 인증 (필요 시)

[Vercel에서]
- 자동 SSL 발급 (Let's Encrypt)
- HSTS 자동 적용
- HTTP → HTTPS 자동 리다이렉트

[검증]
- https://www.ssllabs.com/ssltest/
- A+ 등급 목표
```

## 다음 읽을 문서

- `env-variables.md` — 환경 변수 전체 명세
- `checklist.md` — 배포 전 체크리스트 상세
