import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function moveToParent(fromSlug: string, toSlug: string) {
  const from = await prisma.category.findUnique({ where: { slug: fromSlug } });
  const to = await prisma.category.findUnique({ where: { slug: toSlug } });
  if (!from || !to) { console.log(`  ⚠ 스킵: ${fromSlug} 또는 ${toSlug} 없음`); return 0; }

  // 카테고리 부모 변경
  await prisma.category.update({
    where: { slug: fromSlug },
    data: { parentId: to.id, level: 1 },
  });
  const count = await prisma.productCategory.count({ where: { categoryId: from.id } });
  console.log(`  ✓ [${from.name}] → [${to.name}] 하위 (${count}개)`);
  return count;
}

async function promoteToL0(slug: string, sortOrder: number) {
  const cat = await prisma.category.findUnique({ where: { slug } });
  if (!cat) { console.log(`  ⚠ 스킵: ${slug} 없음`); return; }
  await prisma.category.update({
    where: { slug },
    data: { parentId: null, level: 0, sortOrder },
  });
  const count = await prisma.productCategory.count({ where: { categoryId: cat.id } });
  console.log(`  ✓ [${cat.name}] → L0 대분류 승격 (${count}개 상품)`);
}

async function main() {
  console.log("🔄 전체 카테고리 재정리 시작\n");

  // 1. 안전용품 하위로 이동
  console.log("─ 안전용품 하위로 이동:");
  await moveToParent("eye-protection", "safety-equipment");
  await moveToParent("painting-respiratory", "safety-equipment");
  await moveToParent("welding", "safety-equipment");
  await moveToParent("work-gloves", "safety-equipment");
  await moveToParent("static-musculoskeletal", "safety-equipment");
  await moveToParent("cleaning-hygiene", "safety-equipment");
  await moveToParent("fall-hearing-protection", "safety-equipment");
  await moveToParent("fire-disaster", "safety-equipment");

  // 2. 작업복 하위로 이동
  console.log("\n─ 작업복 하위로 이동:");
  await moveToParent("seasonal-accessories", "workwear");

  // 3. 새 L0 대분류로 승격
  console.log("\n─ 새 L0 대분류로 승격:");
  await promoteToL0("construction-transport", 6);
  await promoteToL0("tools-hardware", 7);
  await promoteToL0("office-supplies", 8);
  await promoteToL0("packaging-materials", 9);

  // 4. all-products 하위에 남은 etc-products도 L0으로
  await promoteToL0("etc-products", 99);

  console.log("\n✅ 완료!");
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
