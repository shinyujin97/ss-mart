import { PrismaClient } from "../../src/generated/prisma/client";

export async function seedCoupons(prisma: PrismaClient) {
  console.log("  쿠폰 시드 시작...");

  const now = new Date();
  const oneYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  const coupons = [
    {
      code: "SS-WELCOME10",
      name: "신규 가입 10% 할인 쿠폰",
      type: "SIGNUP_WELCOME" as const,
      discountType: "PERCENTAGE" as const,
      discountValue: 10,
      minOrderAmount: 10000,
      maxDiscountAmount: 50000,
      validFrom: now,
      validUntil: oneYear,
      perMemberLimit: 1,
    },
    {
      code: "SS-FIRST2000",
      name: "첫 구매 2,000원 할인",
      type: "FIRST_PURCHASE" as const,
      discountType: "FIXED_AMOUNT" as const,
      discountValue: 2000,
      minOrderAmount: 20000,
      validFrom: now,
      validUntil: oneYear,
      perMemberLimit: 1,
    },
    {
      code: "SS-BIRTH5000",
      name: "생일 축하 5,000원 쿠폰",
      type: "BIRTHDAY" as const,
      discountType: "FIXED_AMOUNT" as const,
      discountValue: 5000,
      minOrderAmount: 30000,
      validFrom: now,
      validUntil: oneYear,
      perMemberLimit: 1,
    },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }

  console.log("  ✓ 쿠폰 시드 완료");
}
