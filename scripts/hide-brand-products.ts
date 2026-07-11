/**
 * K2 / 피오존 / 블랙야크 상품을 HIDDEN 처리 (이미지는 이미 전체 삭제됨)
 * 브랜드/상품 레코드는 유지, 사이트에서만 안 보이게. 나중에 새 품목으로 업데이트 예정.
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const TARGET_BRAND_SLUGS = ["k2", "piozen", "blackyak"];

async function main() {
  for (const slug of TARGET_BRAND_SLUGS) {
    const brand = await prisma.brand.findFirst({ where: { slug } });
    if (!brand) {
      console.log(`[${slug}] 브랜드 없음, 스킵`);
      continue;
    }

    const result = await prisma.product.updateMany({
      where: { brandId: brand.id, status: { not: "HIDDEN" } },
      data: { status: "HIDDEN" },
    });

    console.log(`=== ${slug} (${brand.name}) === HIDDEN 처리: ${result.count}개`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ 오류:", e);
  process.exit(1);
});
