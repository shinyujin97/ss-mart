export function calculateBulkDiscountRate(quantity: number): number {
  if (quantity >= 500) return 0.30;
  if (quantity >= 200) return 0.25;
  if (quantity >= 100) return 0.20;
  return 0;
}

export function isBulkEligible(quantity: number, embroideryRequested: boolean): boolean {
  if (quantity >= 100) return true;
  if (embroideryRequested && quantity >= 50) return true;
  return false;
}

const EMBROIERY_FREE_TYPES = ["COMPUTER", "PATCH", "SILK_PRINT"] as const;

export function calculateBulkPrice({
  basePricePerUnit,
  quantity,
  embroideryRequested,
  embroideryType,
  embroideryUnitFee = 0,
}: {
  basePricePerUnit: number;
  quantity: number;
  embroideryRequested: boolean;
  embroideryType?: string;
  embroideryUnitFee?: number;
}) {
  const discountRate = calculateBulkDiscountRate(quantity);
  const discountedUnitPrice = Math.round(basePricePerUnit * (1 - discountRate));
  const subtotal = discountedUnitPrice * quantity;

  const embFree =
    embroideryRequested &&
    quantity >= 100 &&
    embroideryType &&
    (EMBROIERY_FREE_TYPES as readonly string[]).includes(embroideryType);

  const embroideryFee = embFree ? 0 : embroideryRequested ? embroideryUnitFee * quantity : 0;

  const taxableAmount = subtotal + embroideryFee;
  const taxAmount = Math.round(taxableAmount * 0.1);

  return {
    discountRate,
    unitPrice: discountedUnitPrice,
    subtotal,
    embroideryFee,
    embroideryFree: !!embFree,
    taxAmount,
    totalAmount: taxableAmount + taxAmount,
  };
}
