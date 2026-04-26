---
name: seed
description: Prisma 시드 데이터를 생성하거나 재실행합니다. 카테고리 트리, 80개 브랜드, 기본 쿠폰 (운영 데이터) + 개발 환경에서는 테스트 회원 / 상품도 자동 생성.
---

# 시드 데이터 실행

## 작업

1. `prisma/seeds/` 디렉토리 확인
2. 누락된 시드 파일 있으면 생성
3. `npx prisma db seed` 실행

## 시드 파일 구조 (database-migration Skill 참조)

```
prisma/seeds/
├── index.ts            # 메인 진입점
├── categories.ts       # 카테고리 트리
├── brands.ts           # 80개 브랜드
├── products.ts         # 테스트 상품 (개발 환경만)
├── members.ts          # 테스트 회원 (개발 환경만)
└── coupons.ts          # 기본 쿠폰
```

## package.json 설정 확인

```json
{
  "prisma": {
    "seed": "tsx prisma/seeds/index.ts"
  }
}
```

## 실행 후 검증

```bash
npx prisma studio
# 브라우저에서 데이터 확인
```

## 사장님께 받아야 할 정보

시드 파일 채울 때 사장님께 확인 필요:
- ✅ 입점 브랜드 80개 정확한 리스트
- ✅ 카테고리 한글 이름 최종
- ✅ 기본 쿠폰 정책 (할인율, 유효기간)
- ✅ KCs / KS 등 인증 종류 마스터
