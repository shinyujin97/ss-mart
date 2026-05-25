import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const workwearSlugs = ["workwear", "workwear-top", "workwear-bottom", "workwear-set", "workwear-vest", "workwear-winter"];

  const categories = await prisma.category.findMany({
    where: { slug: { in: workwearSlugs } },
    select: { id: true, name: true },
  });
  const categoryIds = categories.map(c => c.id);

  // 브랜드별 작업복 상품 수
  const brands = await prisma.brand.findMany({
    where: { products: { some: { categories: { some: { categoryId: { in: categoryIds } } } } } },
    orderBy: { name: "asc" },
  });

  let total = 0;
  const rows: { name: string; count: number }[] = [];

  for (const b of brands) {
    const count = await prisma.product.count({
      where: { brandId: b.id, categories: { some: { categoryId: { in: categoryIds } } } },
    });
    total += count;
    rows.push({ name: b.name, count });
  }

  rows.sort((a, b) => b.count - a.count);
  for (const r of rows) {
    const pct = ((r.count / total) * 100).toFixed(1);
    console.log(`  ${r.name.padEnd(20)} ${String(r.count).padStart(4)}개  (${pct}%)`);
  }
  console.log(`\n  합계: ${total}개`);

  await prisma.$disconnect();
}
main().catch(console.error);
