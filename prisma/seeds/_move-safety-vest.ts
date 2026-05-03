import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const safetyVest = await prisma.category.findUnique({ where: { slug: "safety-vest" } });
  const workwearVest = await prisma.category.findUnique({ where: { slug: "workwear-vest" } });

  if (!safetyVest) { console.log("safety-vest 없음 — 이미 처리됨"); return; }
  if (!workwearVest) { console.log("workwear-vest 없음"); return; }

  console.log(`safety-vest id: ${safetyVest.id}`);
  console.log(`workwear-vest id: ${workwearVest.id}`);

  // 안전조끼 카테고리에 연결된 상품들 workwear-vest로 재연결
  const result = await prisma.productCategory.updateMany({
    where: { categoryId: safetyVest.id },
    data: { categoryId: workwearVest.id },
  });
  console.log(`${result.count}개 상품 workwear-vest로 이동`);

  // 중복 제거 (같은 상품이 이미 workwear-vest에 있을 경우)
  const allInVest = await prisma.productCategory.findMany({
    where: { categoryId: workwearVest.id },
    orderBy: { productId: "asc" },
  });
  const seen = new Set<string>();
  let dupeCount = 0;
  for (const row of allInVest) {
    if (seen.has(row.productId)) {
      await prisma.productCategory.delete({ where: { id: row.id } });
      dupeCount++;
    } else {
      seen.add(row.productId);
    }
  }
  console.log(`${dupeCount}개 중복 제거`);

  // safety-vest 카테고리 삭제
  await prisma.category.delete({ where: { id: safetyVest.id } });
  console.log("safety-vest 카테고리 삭제 완료");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
