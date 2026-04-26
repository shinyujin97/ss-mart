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
