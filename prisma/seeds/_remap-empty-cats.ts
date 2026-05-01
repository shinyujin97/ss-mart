import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function moveByKeyword(
  keywords: string[],
  targetSlug: string,
  label: string
) {
  const targetCat = await prisma.category.findUnique({ where: { slug: targetSlug } });
  if (!targetCat) { console.log(`  ⚠ 카테고리 없음: ${targetSlug}`); return; }

  // 키워드로 상품 검색
  const products = await prisma.product.findMany({
    where: { OR: keywords.map((k) => ({ name: { contains: k } })) },
    include: { categories: true },
  });

  let moved = 0;
  for (const p of products) {
    // 이미 targetCat에 있으면 스킵
    if (p.categories.some((c) => c.categoryId === targetCat.id)) continue;

    // 기존 카테고리 연결 삭제
    for (const pc of p.categories) {
      await prisma.productCategory.delete({
        where: { productId_categoryId: { productId: p.id, categoryId: pc.categoryId } },
      });
    }
    // 새 카테고리 연결
    await prisma.productCategory.create({
      data: { productId: p.id, categoryId: targetCat.id },
    });
    moved++;
  }
  console.log(`  ✓ ${label}: ${moved}개 → [${targetSlug}]`);
}

async function main() {
  console.log("🔄 빈 카테고리 채우기 시작\n");

  // 마스크 → mask
  await moveByKeyword(
    ["마스크", "방진마스크", "방독마스크", "KF94", "KF80", "방진필터"],
    "mask",
    "마스크"
  );

  // 장갑 → gloves
  await moveByKeyword(
    ["장갑", "글러브"],
    "gloves",
    "장갑/보호구"
  );

  // F&B / 조리복 → fnb-uniform
  await moveByKeyword(
    ["셰프", "조리복", "주방복", "셰프화", "chef", "주방화"],
    "fnb-uniform",
    "F&B 유니폼"
  );

  // 의료복 → medical-uniform
  await moveByKeyword(
    ["의료복", "간호복", "수술복", "스크럽", "환자복"],
    "medical-uniform",
    "의료/위생복"
  );

  // 조끼(작업용) 중 workwear-vest에 없는 것 → workwear-vest
  // (safety-vest는 안전조끼, workwear-vest는 작업조끼)
  // safety-vest에서 작업용 조끼만 workwear-vest로 분리는 이미 됐으므로 스킵

  console.log("\n✅ 완료!");

  // 결과 확인
  const targets = ["mask", "gloves", "fnb-uniform", "medical-uniform"];
  console.log("\n─ 최종 카테고리 상품 수:");
  for (const slug of targets) {
    const cat = await prisma.category.findUnique({
      where: { slug },
      include: { _count: { select: { products: true } } },
    });
    console.log(`  [${cat?.name}]: ${cat?._count.products}개`);
  }
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
