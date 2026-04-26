---
name: embroidery-system
description: 자수 / 마킹 관련 기능 개발 시 사용. 자수 시뮬레이터, 자수 옵션, 시안 워크플로우, 가격 계산, 자수 시안 보관함, 카톡 시안 전송 등 모든 자수 관련 작업. 자수 종류 7가지 (컴퓨터 자수, 패치 자수, 아플리케, 실사 패치, 벨크로 패치, 캐릭터 디자인, 실크 인쇄), 자수 위치 7곳, 자수 크기 5단계의 비즈니스 규칙을 포함. 저작권 검증, 시안 워크플로우 상태 머신, 단체주문 자수 무료 정책 등을 다룸.
---

# 자수 시스템 (Embroidery System) Skill

## 핵심 규칙 (절대 위반 금지)

⚠️ 이 규칙들은 사장님 사업의 핵심이라 절대 임의 변경 불가:

1. **자수 추가 상품은 단순 변심 환불 불가** (전자상거래법 맞춤 제작 조항)
2. **저작권 IP 자수 작업 절대 금지** (디즈니, 마블, 닌텐도 등)
3. **시안은 무제한 무료 수정** (확정 전까지)
4. **단체 100벌+ 자수 무료** (COMPUTER, PATCH, SILK_PRINT만)
5. **모든 자수 가격 계산은 서버 측에서** (클라이언트 조작 방지)

## 자수 종류 정의

```typescript
// constants/embroidery.ts
export const EMBROIDERY_TYPES = {
  COMPUTER: { name: '컴퓨터 자수', basePrice: 5000, bulkFree: true },
  PATCH: { name: '패치 자수', basePrice: 8000, bulkFree: true },
  APPLIQUE: { name: '아플리케 자수', basePrice: 12000, bulkFree: false },
  REAL_PATCH: { name: '실사 패치', basePrice: 15000, bulkFree: false },
  VELCRO: { name: '벨크로 패치', basePrice: 18000, bulkFree: false },
  CHARACTER: { name: '캐릭터 디자인', basePrice: 20000, bulkFree: false },
  SILK_PRINT: { name: '실크 인쇄', basePrice: 3000, bulkFree: true },
} as const;

export const SIZE_MULTIPLIERS = {
  SMALL: 1.0,    // 5x5
  MEDIUM: 1.3,   // 8x8
  LARGE: 1.6,    // 10x10
  XLARGE: 2.2,   // 15x15
  XXLARGE: 3.0,  // 20x20
} as const;

export const POSITIONS = [
  'LEFT_CHEST', 'RIGHT_CHEST', 'BACK_CENTER',
  'BACK_TOP', 'LEFT_SLEEVE', 'RIGHT_SLEEVE', 'MULTIPLE'
] as const;
```

## 가격 계산 (서버 전용)

```typescript
// lib/embroidery/pricing.ts
import { EMBROIDERY_TYPES, SIZE_MULTIPLIERS } from '@/constants/embroidery';

interface CalculatePriceParams {
  type: EmbroideryType;
  size: EmbroiderySize;
  positions: EmbroideryPosition[];
  quantity: number;
  isBulkOrder?: boolean;
}

export function calculateEmbroideryPrice({
  type,
  size,
  positions,
  quantity,
  isBulkOrder = false,
}: CalculatePriceParams): number {
  // 단체주문 (100벌+) 자수 무료 (특정 종류만)
  if (isBulkOrder && quantity >= 100 && EMBROIDERY_TYPES[type].bulkFree) {
    return 0;
  }

  const basePrice = EMBROIDERY_TYPES[type].basePrice;
  const sizeMultiplier = SIZE_MULTIPLIERS[size];
  const positionCount = positions.length;

  return Math.round(basePrice * sizeMultiplier * positionCount * quantity);
}
```

## 시안 워크플로우 상태 머신

```typescript
// 허용된 상태 전이만 가능
const ALLOWED_TRANSITIONS: Record<EmbroideryStatus, EmbroideryStatus[]> = {
  DRAFT: ['REVIEW_PENDING', 'CANCELLED'],
  REVIEW_PENDING: ['REVIEW_IN_PROGRESS', 'REJECTED', 'CANCELLED'],
  REVIEW_IN_PROGRESS: ['CUSTOMER_REVIEW', 'REJECTED'],
  CUSTOMER_REVIEW: ['REVISION_REQUESTED', 'CONFIRMED', 'CANCELLED'],
  REVISION_REQUESTED: ['REVIEW_IN_PROGRESS', 'CUSTOMER_REVIEW'],
  CONFIRMED: ['IN_PRODUCTION'],
  IN_PRODUCTION: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
};

// 상태 변경 시 항상 검증
export function transitionStatus(
  currentStatus: EmbroideryStatus,
  newStatus: EmbroideryStatus
): boolean {
  return ALLOWED_TRANSITIONS[currentStatus].includes(newStatus);
}
```

## 저작권 검증

```typescript
// 차단 키워드 (자동 검증)
const BLOCKED_KEYWORDS = [
  // 영화/애니
  '디즈니', 'disney', '마블', 'marvel', 'dc', '닌텐도', 'nintendo',
  '포켓몬', 'pokemon', '미키', 'mickey', '슈퍼맨', 'superman',
  // 스포츠
  'NBA', 'MLB', 'NFL', 'EPL', '레알마드리드', '바르셀로나',
  // 명품
  '루이비통', 'louis', '구찌', 'gucci', '샤넬', 'chanel',
  // 애니메이션
  '짱구', 'crayon', '도라에몽', '드래곤볼', '나루토',
];

export function validateCopyright(text: string, imageMetadata?: any): {
  passed: boolean;
  reason?: string;
} {
  const lowerText = text.toLowerCase();
  for (const blocked of BLOCKED_KEYWORDS) {
    if (lowerText.includes(blocked.toLowerCase())) {
      return {
        passed: false,
        reason: `저작권 보호 콘텐츠로 의심됩니다: "${blocked}". 오리지널 디자인 또는 자체 캐릭터를 사용해주세요.`,
      };
    }
  }
  return { passed: true };
}
```

## 시뮬레이터 컴포넌트 패턴

자수 시뮬레이터 페이지 구현 시 따를 패턴:

```tsx
// app/(shop)/embroidery/simulator/page.tsx 구조
- SimulatorCanvas (4면 뷰: 정면/뒷면/왼쪽/오른쪽)
  - TshirtSvg (각 면별 SVG)
  - EmbroideryOverlay (드래그 가능한 자수 마커)
- OptionsPanel (좌측)
  - TypeSelector (7개 자수 종류)
  - PositionSelector (시각적 위치 선택)
  - SizeSelector (5단계 크기)
  - ColorPicker (자수 실 색상)
  - TextOrLogoInput (텍스트 / 로고 업로드)
- PreviewPanel (우측)
  - PriceCalculator (실시간 가격 표시)
  - QuantitySelector
  - ActionButtons (저장 / 결제하기)
```

## API 엔드포인트 패턴

자수 관련 API는 다음 패턴으로 구현:

```typescript
// app/api/embroidery/designs/route.ts

// POST /api/embroidery/designs - 시안 생성
// GET /api/embroidery/designs?memberId=xxx - 시안 목록
// PATCH /api/embroidery/designs/[id] - 시안 수정 (수정 횟수 증가)
// POST /api/embroidery/designs/[id]/confirm - 시안 확정
// POST /api/embroidery/designs/[id]/cancel - 시안 취소

// 모든 가격 계산은 서버에서:
// POST /api/embroidery/calculate-price
//   { type, size, positions, quantity, isBulkOrder } → { price }
```

## 카톡 시안 전송 통합

결제 완료 후 카톡으로 시안을 전송하는 워크플로우:

```typescript
// lib/notifications/kakao.ts
export async function sendDesignToKakao(designId: string) {
  const design = await prisma.embroideryDesign.findUnique({
    where: { id: designId },
    include: { member: true, orderItem: true },
  });

  // 카카오톡 알림톡 API 호출 (알리고/솔라피)
  await kakaoApi.sendAlertTalk({
    to: design.member.phone,
    template: 'EMBROIDERY_DESIGN_REVIEW',
    variables: {
      designNumber: design.designNumber,
      productName: design.orderItem.productSnapshot.name,
      reviewUrl: `${process.env.NEXT_PUBLIC_URL}/mypage/embroidery/${design.id}`,
    },
  });
}
```

## 마이페이지 자수 시안 보관함

```tsx
// app/mypage/embroidery/page.tsx
- DesignGrid (3열 그리드)
  - DesignCard (각 시안)
    - StatusBadge (DRAFT/IN_PRODUCTION/CONFIRMED 색상별)
    - DesignPreview (티셔츠 미니 일러스트)
    - DesignInfo (시안 번호, 회사명, 자수 종류, 위치)
    - Actions (수정 요청 / 다운로드 / 재구매)
```

## 절대 하지 말 것

❌ 클라이언트 사이드에서만 가격 계산하고 결제 진행
❌ 자수 추가 상품 단순 변심 환불 자동 처리
❌ 저작권 검증 없이 시안 생성
❌ 시안 상태 머신 무시하고 임의 상태 전이
❌ 캐릭터 디자인 의뢰 시 사장님 / 매니저 승인 없이 자동 진행
❌ 자수 작업 시작 후 옵션 변경 (재작업 비용 발생)

## 항상 확인할 것

✅ 자수 가격은 서버에서 재계산
✅ 시안 상태 변경 시 ALLOWED_TRANSITIONS 검증
✅ 저작권 키워드 차단 검증
✅ 단체주문 100벌+ 시 자수 무료 (특정 종류만)
✅ 시안 수정 횟수 카운트 증가
✅ 카톡 알림 전송 여부 로깅

## 관련 파일

- DB 스키마: `docs/database/schema.md` (EmbroideryDesign 모델)
- 비즈니스 규칙: `docs/domain/business-rules.md` (1. 자수 / 마킹)
- API 명세: `docs/api/endpoints.md` (자수 관련 API)
- 디자인 시안: `/mnt/user-data/outputs/workwear/16_embroidery_guide.html`, `17_simulator.html`
