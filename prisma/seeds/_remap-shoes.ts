import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });
async function main() {
  const shoesCat = await prisma.category.findUnique({ where: { slug: "shoes" } });
  const safetyShoesCat = await prisma.category.findUnique({ where: { slug: "safety-shoes" } });
  if (!shoesCat || !safetyShoesCat) throw new Error("카테고리 없음");

  const count = await prisma.productCategory.count({ where: { categoryId: shoesCat.id } });
  console.log(`신발 → 안전화 이동 대상: ${count}개`);

  // 안전화에 이미 있는 상품 제외하고 이동
  const rows = await prisma.productCategory.findMany({ where: { categoryId: shoesCat.id } });
  let moved = 0, skipped = 0;
  for (const row of rows) {
    await prisma.productCategory.delete({
      where: { productId_categoryId: { productId: row.productId, categoryId: shoesCat.id } },
    });
    await prisma.productCategory.upsert({
      where: { productId_categoryId: { productId: row.productId, categoryId: safetyShoesCat.id } },
      update: {},
      create: { productId: row.productId, categoryId: safetyShoesCat.id },
    });
    moved++;
  }

  await prisma.category.delete({ where: { slug: "shoes" } });
  console.log(`✅ 완료 — 이동: ${moved}개 / 신발 카테고리 삭제`);
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
