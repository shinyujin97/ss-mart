export const EMBROIDERY_TYPES = {
  COMPUTER:   { name: "컴퓨터 자수",   basePrice: 5000,  bulkFree: true  },
  PATCH:      { name: "패치 자수",      basePrice: 8000,  bulkFree: true  },
  APPLIQUE:   { name: "아플리케 자수",  basePrice: 12000, bulkFree: false },
  REAL_PATCH: { name: "실사 패치",      basePrice: 15000, bulkFree: false },
  VELCRO:     { name: "벨크로 패치",    basePrice: 18000, bulkFree: false },
  CHARACTER:  { name: "캐릭터 디자인",  basePrice: 20000, bulkFree: false },
  SILK_PRINT: { name: "실크 인쇄",      basePrice: 3000,  bulkFree: true  },
} as const;

export const SIZE_MULTIPLIERS = {
  SMALL:   1.0,
  MEDIUM:  1.3,
  LARGE:   1.6,
  XLARGE:  2.2,
  XXLARGE: 3.0,
} as const;

export const SIZE_LABELS = {
  SMALL:   "S  (5×5cm)",
  MEDIUM:  "M  (8×8cm)",
  LARGE:   "L  (10×10cm)",
  XLARGE:  "XL (15×15cm)",
  XXLARGE: "2XL (20×20cm)",
} as const;

export const POSITION_LABELS = {
  LEFT_CHEST:  "왼가슴",
  RIGHT_CHEST: "오른가슴",
  BACK_CENTER: "등판 중앙",
  BACK_TOP:    "등 상단",
  LEFT_SLEEVE: "왼팔",
  RIGHT_SLEEVE:"오른팔",
  MULTIPLE:    "여러 곳",
} as const;

export type EmbroideryTypeKey  = keyof typeof EMBROIDERY_TYPES;
export type EmbroiderySizeKey  = keyof typeof SIZE_MULTIPLIERS;
export type EmbroideryPositionKey = keyof typeof POSITION_LABELS;
