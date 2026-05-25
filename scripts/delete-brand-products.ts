/**
 * 안전화 브랜드 상품 삭제 (상품/옵션/카테고리연결 전부)
 * 브랜드 레코드는 유지
 *
 * 사용법:
 *   npx tsx scripts/delete-brand-products.ts          # dry-run
 *   npx tsx scripts/delete-brand-products.ts --delete  # 실제 삭제
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DRY_RUN = !process.argv.includes("--delete");

const TARGET_BRAND_SLUGS = [
  "blackyak",
  "bulls",
  "campline",
  "etc-brand",
  "lecaf",
  "prospecs",
  "semong",
  "techline",
];

const SAFETY_SHOES_CATEGORY_SLUGS = [
  "safety-shoes",
  "safety-shoes-4inch",
  "safety-shoes-5inch",
  "safety-shoes-6inch",
  "safety-shoes-8inch",
  "safety-shoes-misc",
  "winter-safety-shoes",
  "waterproof-shoes",
  "welding-shoes",
  "walking-shoes",
  "insulated-shoes",
];

async function main() {
  console.log(DRY_RUN ? "🔍 DRY-RUN 모드 (실제 삭제 없음)" : "🗑️  실제 삭제 모드");
  console.log("");

  const adapter = new PrismaPg(process.env.DATABASE_URL!);
  const prisma = new PrismaClient({ adapter });

  const categories = await prisma.category.findMany({
    where: { slug: { in: SAFETY_SHOES_CATEGORY_SLUGS } },
    select: { id: true },
  });
  const categoryIds = categories.map((c) => c.id);

  const brands = await prisma.brand.findMany({
    where: { slug: { in: TARGET_BRAND_SLUGS } },
    orderBy: { name: "asc" },
  });

  const allProductIds: string[] = [];

  for (const brand of brands) {
    const products = await prisma.product.findMany({
      where: {
        brandId: brand.id,
        categories: { some: { categoryId: { in: categoryIds } } },
      },
      select: { id: true },
    });
    console.log(`  📦 ${brand.name} — ${products.length}개 상품`);
    allProductIds.push(...products.map((p) => p.id));
  }

  console.log(`\n총 삭제 대상: ${allProductIds.length}개 상품`);

  if (DRY_RUN) {
    console.log(`\n✅ DRY-RUN 완료`);
    console.log(`   삭제 예정: 상품 ${allProductIds.length}개 (옵션/카테고리연결 포함 cascade)`);
    console.log(`\n실제 삭제: npx tsx scripts/delete-brand-products.ts --delete`);
    await prisma.$disconnect();
    return;
  }

  const { count } = await prisma.product.deleteMany({
    where: { id: { in: allProductIds } },
  });

  console.log(`\n✅ 완료! 상품 ${count}개 삭제됨 (브랜드 레코드 유지)`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ 오류:", e);
  process.exit(1);
});
