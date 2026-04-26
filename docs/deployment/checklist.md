# 배포 체크리스트 (Deployment Checklist)

> 배포 사고 방지용. 매 프로덕션 배포 시 반드시 확인.

## A. 일상 PR 머지 (Preview → Production)

### 코드 품질

```
[ ] 모든 테스트 통과 (npm run test)
[ ] TypeScript 컴파일 OK (npm run typecheck)
[ ] 린트 통과 (npm run lint)
[ ] Build 성공 (npm run build)
[ ] code-reviewer 에이전트 검토 완료
[ ] CRITICAL 이슈 0건
```

### 비즈니스 규칙

```
[ ] /check-business-rules 슬래시 커맨드 실행
[ ] 자수 / 단체주문 관련 변경 시 도메인 문서 검토
[ ] 결제 / 환불 로직 변경 시 트랜잭션 검증
```

### 동작 검증

```
[ ] Preview 배포 URL 에서 핵심 플로우 수동 테스트
[ ] 모바일 / PC 양쪽 확인
[ ] 사장님 / 매니저 검수 (디자인 변경 시)
```

## B. DB 마이그레이션 동반 배포 ⚠️

### 사전 준비

```
[ ] Staging 에서 마이그레이션 적용 완료
[ ] Staging 에서 E2E 테스트 통과
[ ] 위험 변경 (DROP, 타입 변경) 없는지 확인
[ ] 백업 계획 수립
[ ] 롤백 SQL 준비
```

### 백업

```bash
# 1. Supabase Dashboard → Database → Backups
#    자동 일별 백업 확인 (Pro 7일)

# 2. 수동 추가 백업 (안전)
pg_dump $PROD_DATABASE_URL > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql

# 3. 백업 파일 안전 보관 (S3 또는 로컬)
```

### 적용 (피크 시간 회피)

```
권장 시간:
- 평일 새벽 3~5시
- 주말 X (직원 부재)
- 점심 시간 X (12~13시)
- 퇴근 시간 X (18~20시)
- 단체주문 견적 응답 SLA 시간 X
```

```bash
# Vercel CLI 또는 GitHub Actions 로 마이그레이션 자동화
# (vercel-build 스크립트에 prisma migrate deploy 추가)

# 또는 수동 실행
DATABASE_URL=$PROD npx prisma migrate deploy
```

### 사후 확인

```
[ ] 헬스 체크 (curl /api/health) 200 OK
[ ] Sentry 에러 모니터링 (5분간)
[ ] 핵심 API 응답 속도
[ ] DB 연결 풀 상태
[ ] 사용자 영향 없는지 확인
```

## C. 첫 프로덕션 배포 (런칭 전) ⭐

### 인프라

```
[ ] Vercel 프로젝트 생성 + 도메인 연결
[ ] Supabase Production 프로젝트 생성 (Seoul 리전)
[ ] Supabase Storage 버킷 생성 (4개)
[ ] Supabase RLS 정책 설정
[ ] SSL 인증서 자동 발급 확인 (https://)
[ ] DNS 정상 (A / CNAME / SPF)
[ ] Sentry 프로젝트 생성
[ ] Vercel Analytics 활성화
```

### 환경 변수

```
[ ] 모든 Production 환경 변수 입력 완료 (env-variables.md)
[ ] 테스트 키 → 실 운영 키 전환 (PG / 카톡 / SMS)
[ ] NEXTAUTH_SECRET 생성 (openssl rand -base64 32)
[ ] CRON_SECRET 생성
[ ] 시크릿 1Password 등에 안전 보관
```

### 결제 (토스페이먼츠)

```
[ ] 사업자 인증 완료
[ ] 실 운영 키 발급 받음
[ ] 정산 계좌 등록
[ ] 웹훅 URL 등록: https://ssmart.kr/api/webhooks/toss
[ ] 1원 결제 테스트 성공
[ ] 환불 테스트 성공
[ ] 세금계산서 발행 테스트 (B2B)
[ ] 가상계좌 입금 확인 테스트
```

### 외부 서비스

```
[ ] 카카오 비즈메시지 채널 (@ssmart) 운영중
[ ] 알림톡 템플릿 등록 완료 (5종+)
   - 결제 완료
   - 자수 시안 검토 요청
   - 자수 시안 확정
   - 배송 시작
   - 단체주문 견적 발송
[ ] 알리고 SMS 발신번호 (1588-0000) 등록 완료
[ ] 카카오 / 네이버 로그인 OAuth 등록
   - Redirect URI: https://ssmart.kr/api/auth/callback/kakao
[ ] 우편번호 API (카카오) 도메인 등록
```

### 데이터

```
[ ] 카테고리 트리 시드 완료
[ ] 80개 브랜드 시드 완료 (사장님 검토)
[ ] 첫 상품 100~200개 등록 (사장님)
[ ] 인증 정보 (KCs / KS / 방염) 정확
[ ] 메인 배너 / 이벤트 이미지 업로드
[ ] 자수 갤러리 샘플 데이터 (28안 표시용)
[ ] 회사 소개 페이지 텍스트 / 이미지 (27안)
[ ] FAQ 8개 이상 등록
[ ] 약관 / 개인정보처리방침 등록
```

### 법무 / 사업

```
[ ] 통신판매업 신고 완료 (관할 시/구청)
[ ] 사업자등록증 PG 제출 완료
[ ] 개인정보 처리방침 작성 (변호사 검토 권장)
[ ] 이용약관 작성
[ ] 청약 철회 안내 페이지
[ ] 사업자정보확인 페이지 (필수)
[ ] 도메인 등록 정보 (사장님 명의)
```

### 보안

```
[ ] HTTPS 강제 (HSTS)
[ ] CSP 헤더 적용
[ ] Rate Limiting (API)
[ ] 비밀번호 해싱 (bcrypt 12 round 이상)
[ ] PII 암호화 (사업자번호 등)
[ ] 결제 정보 자체 저장 X (PG 위임)
[ ] 백업 / 복구 절차 문서화
```

### 모니터링

```
[ ] Sentry 에러 알림 → Slack 연동
[ ] Vercel Failed Deployment → Slack
[ ] Supabase 알림 → Email
[ ] 단체주문 SLA 알림 (2시간 초과)
[ ] 결제 실패율 5% 초과 알림
[ ] 재고 0 진입 일간 요약
[ ] Sentry 한 달 무료 한도 모니터링
```

### 성능

```
[ ] Lighthouse 모바일 점수 90+
[ ] LCP < 2.5s
[ ] CLS < 0.1
[ ] 메인 페이지 1.5s 이내 로드
[ ] 이미지 최적화 (WebP / AVIF)
[ ] Critical CSS 인라인
[ ] Font display: swap
```

### SEO

```
[ ] sitemap.xml 생성 + Google Search Console 등록
[ ] robots.txt 작성
[ ] 모든 페이지 Meta 태그 (title, description, OG)
[ ] 구조화 데이터 (Product, Breadcrumb)
[ ] Google Analytics 4 등록
[ ] 네이버 서치어드바이저 등록
[ ] 카카오 웹마스터 도구 등록
```

## D. 런칭 직전 (D-1)

### 최종 점검

```
[ ] 사장님 / 매니저 / 무료 개발자 함께 전체 페이지 순회
[ ] 가입 → 로그인 → 상품 → 자수 → 결제 → 완료 풀 플로우 테스트
[ ] 단체주문 견적 신청 → 매니저 알림 확인
[ ] 카톡 채널 알림톡 정상 전송 (5종)
[ ] 환불 / 부분환불 시뮬레이션
[ ] 모바일 사파리 / 크롬 / 삼성인터넷 테스트
```

### 백업 / 비상 대응 준비

```
[ ] 비상 연락망 확인
   - 사장님 휴대폰
   - 무료 개발자 연락처
   - 토스페이먼츠 CS
   - Supabase Support
   - Vercel Support
[ ] 점검 페이지 (maintenance.html) 준비
[ ] 카톡 채널 점검 안내 메시지 템플릿
[ ] 롤백 SQL 준비
```

## E. 런칭 후 (D-Day ~ D+7)

### Day 1

```
[ ] 1시간 마다 Sentry / 로그 확인
[ ] 첫 결제 성공 시 즉시 확인
[ ] 카톡 알림 누락 없는지 모니터링
[ ] 사장님 / 매니저 슬랙 활성화
```

### Week 1

```
[ ] 일별 매출 / 주문 수 모니터링
[ ] 결제 실패 사유 분석
[ ] 자수 시안 작업 SLA 준수 확인
[ ] 단체주문 견적 응답 시간 모니터링
[ ] 사용자 문의 패턴 정리 → FAQ 추가
[ ] 페이지별 이탈율 분석 → 개선
```

### Week 2~4

```
[ ] 사용자 피드백 수집
[ ] 핵심 KPI 측정 (회원가입 / 첫 구매 전환율)
[ ] 자수 시뮬레이터 사용률
[ ] 단체주문 전환율
[ ] 모바일 / PC 비율
[ ] 검색 쿼리 분석 (Search Console)
```

## F. 정기 점검 (월별)

```
[ ] Supabase / Vercel 비용 검토
[ ] 백업 정상 작동
[ ] 인증서 만료일 (자동 갱신이지만 확인)
[ ] 의존성 보안 업데이트 (npm audit)
[ ] PG 정산 확인
[ ] 키 회전 일정 (6개월~1년)
[ ] 데이터 백업 복구 훈련 (분기)
[ ] 비즈니스 규칙 검토 (분기)
```

## G. 사고 발생 시

### 즉시 (~5분)

```
[ ] 사고 영향 범위 파악
[ ] 사장님 / 매니저 즉시 보고
[ ] 점검 페이지 활성화 (필요 시)
[ ] 롤백 검토
```

### 단기 (~30분)

```
[ ] Vercel / Supabase / PG 상태 확인
[ ] 직전 정상 배포로 롤백 (Vercel)
[ ] DB 백업 확인 (필요 시 PITR)
[ ] 사용자 피해 규모 파악
[ ] 카톡 채널 공지
```

### 사후 (~24시간)

```
[ ] 근본 원인 분석 (RCA)
[ ] 재발 방지 대책 수립
[ ] 영향 받은 고객 개별 연락
[ ] 환불 / 보상 처리 (필요 시)
[ ] Postmortem 문서 작성
```

## 체크리스트 자동화

```bash
# scripts/pre-deploy-check.sh
#!/bin/bash
set -e

echo "▶ TypeScript 검증..."
npm run typecheck

echo "▶ 린트..."
npm run lint

echo "▶ 단위 테스트..."
npm run test

echo "▶ 빌드..."
npm run build

echo "▶ 비즈니스 규칙 검사..."
# /check-business-rules 슬래시 커맨드 결과 자동 파싱

echo "✅ 모든 검증 통과"
```

GitHub Actions 으로 자동화:

```yaml
# .github/workflows/pre-deploy.yml
name: Pre-deploy Check
on:
  pull_request:
    branches: [main, staging]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```
