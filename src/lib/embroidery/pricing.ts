import { EMBROIDERY_TYPES, SIZE_MULTIPLIERS, type EmbroideryTypeKey, type EmbroiderySizeKey, type EmbroideryPositionKey } from "@/constants/embroidery";

interface CalculatePriceParams {
  type: EmbroideryTypeKey;
  size: EmbroiderySizeKey;
  positions: EmbroideryPositionKey[];
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
  if (isBulkOrder && quantity >= 100 && EMBROIDERY_TYPES[type].bulkFree) {
    return 0;
  }

  const basePrice = EMBROIDERY_TYPES[type].basePrice;
  const sizeMultiplier = SIZE_MULTIPLIERS[size];
  const positionCount = positions.length || 1;

  return Math.round(basePrice * sizeMultiplier * positionCount * quantity);
}

export function calculateUnitPrice({
  type,
  size,
  positions,
}: Omit<CalculatePriceParams, "quantity" | "isBulkOrder">): number {
  const basePrice = EMBROIDERY_TYPES[type].basePrice;
  const sizeMultiplier = SIZE_MULTIPLIERS[size];
  const positionCount = positions.length || 1;
  return Math.round(basePrice * sizeMultiplier * positionCount);
}

// 컬러수(도수)에 따른 추가 배율
// 1도: 기본, 2도: +20%, 3~4도: +40%, 5~6도: +60%, 7~9도: +90%, 10도 이상: +130%
export const COLOR_MULTIPLIER: Record<number, number> = {
  1:  1.0,
  2:  1.2,
  3:  1.4,
  4:  1.4,
  5:  1.6,
  6:  1.6,
  7:  1.9,
  8:  1.9,
  9:  1.9,
  10: 2.3,
  11: 2.3,
  12: 2.3,
};

export function getColorMultiplier(colorCount: number): number {
  if (colorCount <= 0) return 1.0;
  if (colorCount >= 13) return 2.8;
  return COLOR_MULTIPLIER[colorCount] ?? 2.3;
}

// 견적 자동 계산 (컬러수 포함)
export function calculateQuotePrice({
  type,
  size,
  positions,
  quantity,
  colorCount,
}: {
  type: EmbroideryTypeKey;
  size: EmbroiderySizeKey;
  positions: EmbroideryPositionKey[];
  quantity: number;
  colorCount: number;
}): number {
  const basePrice = EMBROIDERY_TYPES[type].basePrice;
  const sizeMultiplier = SIZE_MULTIPLIERS[size];
  const positionCount = positions.length || 1;
  const colorMult = getColorMultiplier(colorCount);
  return Math.round(basePrice * sizeMultiplier * positionCount * colorMult * quantity);
}

// 가격표 레이블 (홈페이지 가격표 기준)
export const COLOR_RANGE_LABELS = [
  { range: "1도",      colorCount: 1  },
  { range: "2도",      colorCount: 2  },
  { range: "3~6도",    colorCount: 4  },
  { range: "7~12도",   colorCount: 9  },
  { range: "12도 이상", colorCount: 13 },
] as const;
