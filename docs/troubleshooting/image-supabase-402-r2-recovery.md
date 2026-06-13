# 이미지 전체 깨짐 — Supabase 402 & R2 이전 미완료 복구 (2차)

> 작성일: 2026-06-14
> 프로젝트: SS Mart (Next.js 16 + Vercel + PostgreSQL/Supabase + Cloudflare R2)
> 핵심 키워드: `402 Payment Required`, Supabase egress/storage quota, R2 이전 미완료, DB URL 미교체, 자격증명 소실
> 관련 문서: [`image-cdn-migration.md`](./image-cdn-migration.md) (1차 — gitignore/R2 최초 이전)

---

## 1. 증상

프로덕션·로컬 양쪽에서 **상품 이미지가 전부 깨짐**(이미지 자리에 alt 텍스트만). 1차 사고(로컬만 OK)와 달리 이번엔 로컬에서도 안 보임.

진단 첫 단서 — 이미지 URL을 직접 요청하면 **402**:
```bash
curl -I https://rreymhbhjrdadxkegheh.supabase.co/storage/v1/object/public/products/tbuc/xxx.jpg
# HTTP/2 402
# {"message":"Service for this project is restricted due to the following violations:
#   exceed_egress_quota, exceed_storage_size_quota. The project owner must upgrade
#   their plan or remove spend caps to restore service."}
```

→ **코드 문제 아님.** Supabase 스토리지가 무료 한도 초과로 차단된 상태.

---

## 2. 진짜 원인 (핵심) — 여러 결정이 쌓인 복합 사고

### ① 이미지를 Supabase에 의존
DB의 `product_images.url` 이 Supabase Storage 절대경로를 가리키고 있었음.
초기 점검 시 **7,869개 전부 supabase URL** (r2.dev 0개).

### ② R2 이전이 "절반만" 됨 (결정적)
이전은 두 단계인데 **2번이 누락**:
1. 파일을 R2에 업로드 ✅ (구형 flat 이미지 6만 장은 올라가 있었음)
2. **DB의 이미지 URL을 R2로 교체** ❌ (한 번도 실행 안 됨)

→ 파일은 R2에 있는데 사이트는 계속 (옛날) Supabase 주소만 바라봄.
   초기 점검에서 supabase URL 중 6,136개가 "이미 R2에 같은 키로 존재"했던 게 그 증거.

### ③ 신규 상품은 Supabase에 직접 업로드
에이스유니폼(2026-05-25 +228)·T-BUC 등 새 상품 이미지는 R2가 아니라 **Supabase에 직접** 올림 → Supabase 용량/트래픽 계속 증가.

### ④ Supabase 무료 한도 초과 → 차단 (폭발)
무료 플랜의 **저장용량 + egress(트래픽)** 두 한도를 모두 초과.
spend cap 상태라 Supabase가 스토리지를 **통째로 차단** → 모든 객체 요청 402 → 전 이미지 동시 깨짐.

### ⑤ 왜 즉시 못 고쳤나 — 자격증명 소실
R2 업로드 시 자격증명을 **터미널 `export`로만 넣고 파일에 저장 안 함**
(1차 문서 263~273줄에 "사용자 터미널과 Claude Code는 별개 프로세스" 명시).
→ 그 값은 해당 터미널 세션에만 존재 → 종료 후 소실.
→ `.env`·`.env.local`·Vercel 어디에도 R2 키 없음 → 신규 업로드 불가 상태.

> **한 줄 요약**: 이미지를 R2로 절반만 옮긴(파일만 복사, DB 주소 미교체) 상태에서,
> 여전히 의지하던 Supabase가 한도 초과로 죽으며 한꺼번에 터짐. 자격증명마저 소실돼 막혀 있었음.

---

## 3. 해결 방법 (단계별)

### STEP 0. 진단
```bash
# DB 이미지 호스트 분포 확인 (전부 supabase면 ②번 미교체 확정)
# Supabase 객체 직접 요청 → 402면 한도 초과 확정
# R2 공개 URL(pub-xxx.r2.dev/<key>) HEAD → 파일이 R2에 있는지 확인
```

### STEP 1. R2에 이미 있는 것 → DB만 교체 (자격증명 불필요)
`scripts/migrate-images-to-r2.ts`
- supabase URL의 키(`/public/` 뒷부분)를 R2 공개 URL로 HEAD 확인
- **R2에 존재가 확정된 것만** DB url을 `pub-xxx.r2.dev/<key>`로 교체 (죽은 주소로 바꾸는 사고 방지)
- 결과: **6,136개 즉시 복구** (자격증명 0개로)
```bash
npx tsx scripts/migrate-images-to-r2.ts          # 드라이런
npx tsx scripts/migrate-images-to-r2.ts --apply  # 반영
```

### STEP 2. https 원본이 있는 브랜드 → 원본 직결 (자격증명 불필요)
`scripts/fix-tbuc-images-direct.ts`
- tbuc 원본은 **https**(`www.tbuc.co.kr`) → DB를 원본 URL로 직접 연결
- 상품 코드 ↔ `tbuc-scraped.json` 매칭, 원본 HEAD 200 전수 확인 후 교체
- `next.config.ts` remotePatterns에 `www.tbuc.co.kr` 추가(pathname 제한 해제 — 원본은 `/data/**`)
- 결과: **335개 복구**
> ⚠️ http 원본(aceuniform)은 https 사이트에서 mixed-content 차단 → 직결 불가, R2 필수.

### STEP 3. R2에 없는 것 → 원본 재다운로드 → R2 업로드 → DB 교체 (자격증명 필요)
`scripts/fix-aceuniform-images-r2.ts`
- 매핑: 상품 slug의 itId(`ace-...-{itId}`) ↔ `aceuniform-scraped.json` `imageUrls[idx]`
  (이미지 키 `products/aceuniform/{productId}_{idx}.jpg` 의 idx = imageUrls 순번)
- 원본 다운로드 → R2(`ss-mart-products`) 같은 키로 업로드 → DB url을 r2.dev로 교체
- 결과: **1,236개 복구** (실패 0)
```bash
npx tsx scripts/fix-aceuniform-images-r2.ts          # 드라이런(매핑/도달성)
npx tsx scripts/fix-aceuniform-images-r2.ts --apply  # 다운로드+업로드+교체
```

### STEP 4. 복구 불가 / 불필요 → 정리
- **일터루 54개**: 삭제된 브랜드(5/25)의 잔존 ACTIVE 상품 → 참조 0 확인 후 상품·브랜드 삭제
- **유한킴벌리 108개**: 메인 아닌 **detail 이미지**(18개 상품), 원본 소스 어디에도 없음 → 깨진 레코드 삭제(메인은 정상 유지)

### STEP 5. 자격증명 영구 저장 (재발 방지)
R2 키 3종을 `.env.local`에 저장 (git 미추적):
```
CLOUDFLARE_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
```
- R2 토큰 발급: Cloudflare → R2 → `Manage R2 API Tokens` → `Create API Token` → **Object Read & Write**
- ⚠️ Secret Access Key는 생성 화면에서 **한 번만** 표시 → 즉시 저장. 분실 시 새 토큰 발급.
- ⚠️ `cfat_...`(Token Value)는 S3 키가 아님. **Access Key ID + Secret Access Key** 를 써야 함.

---

## 4. 최종 결과
```
이미지 7,707개 (불필요 162개 삭제 반영) — 깨짐 0
  R2 (r2.dev)     7,372   (aceuniform 1,236 포함)
  tbuc.co.kr        335   (원본 직결)
```
- DB/R2 기반 변경이라 코드 배포 없이 프로덕션 즉시 반영 (tbuc는 next.config 변경만 배포)
- 이미지 메인 소스가 R2(egress 무료)로 통일 → Supabase 트래픽 한도 재발 구조 아님

---

## 5. 재발 방지 체크리스트
- [ ] **신규 상품 이미지는 처음부터 R2에 업로드** (Supabase Storage에 직접 올리지 말 것)
- [ ] 업로드 후 **DB url을 반드시 R2(r2.dev)로 기록** — "파일 업로드"와 "DB 교체"는 한 세트
- [ ] R2 자격증명은 **`.env.local`에 저장** (터미널 export만 하지 말 것 — 소실됨)
- [ ] 이미지 추가 시 `next.config.ts` remotePatterns에 호스트 등록 확인
- [ ] 정기 점검: DB 이미지 호스트 분포에 `supabase.co`가 남아있지 않은지
- [ ] (선택) R2에 안 쓰는 잔여 객체 정리 — `public/products` 전량(6만)을 올려 미사용분이 용량 점유 중일 수 있음
- [ ] 장기적으로 Supabase Storage 의존 완전 제거 + `next.config` supabase remotePattern 정리 검토
```bash
# 점검용: DB 이미지 호스트 분포 (supabase가 0이어야 정상)
# scripts/migrate-images-to-r2.ts 드라이런 또는 productImage.findMany 로 host 집계
```
