import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

function classifyWorkwear(name: string): string {
  const n = name.toLowerCase();

  // 앞치마 먼저 체크 (패딩 앞치마가 방한복으로 잘못 분류되는 것 방지)
  if (/앞치마|에이프런/.test(n)) return "apron";

  // 우의/우비
  if (/우의|우비|레인/.test(n)) return "rainwear";

  // 작업복 세트
  if (/세트|상하복|상하세트/.test(n)) return "workwear-set";

  // 방한복
  if (/방한|패딩|다운|동복|기모|플리스/.test(n)) return "workwear-winter";

  // 조끼 → 안전조끼 카테고리
  if (/조끼|베스트/.test(n)) return "safety-vest";

  // 하의
  if (/하의|바지|팬츠/.test(n)) return "workwear-bottom";

  // 상의 (자켓, 점퍼, 셔츠, 티셔츠 등)
  if (/상의|자켓|재킷|점퍼|잠바|점바|윈드|파카|아노락|후드|셔츠|티셔츠|반팔|긴팔|티shirt|상의/.test(n)) return "workwear-top";

  return "etc-products";
}

async function main() {
  console.log("🔄 근무복 카테고리 재분류 시작\n");

  // 1. 새 카테고리 생성
  console.log("  1단계: 새 카테고리 생성...");

  const workwearCat = await prisma.category.findUnique({ where: { slug: "workwear" } });
  const allProductsCat = await prisma.category.findUnique({ where: { slug: "all-products" } });

  if (!workwearCat || !allProductsCat) {
    throw new Error("작업복 또는 상품 전체 카테고리가 DB에 없습니다.");
  }

  // 앞치마 (작업복 하위)
  await prisma.category.upsert({
    where: { slug: "apron" },
    update: { name: "앞치마" },
    create: { slug: "apron", name: "앞치마", parentId: workwearCat.id, level: 1, sortOrder: 10 },
  });

  // 우의/우비 (작업복 하위)
  await prisma.category.upsert({
    where: { slug: "rainwear" },
    update: { name: "우의/우비" },
    create: { slug: "rainwear", name: "우의/우비", parentId: workwearCat.id, level: 1, sortOrder: 11 },
  });

  // 기타 (상품 전체 하위)
  await prisma.category.upsert({
    where: { slug: "etc-products" },
    update: { name: "기타" },
    create: { slug: "etc-products", name: "기타", parentId: allProductsCat.id, level: 1, sortOrder: 99 },
  });

  console.log("  ✓ 앞치마, 우의/우비, 기타 카테고리 생성 완료\n");

  // 2. 필요한 카테고리 ID 조회
  console.log("  2단계: 카테고리 ID 조회...");
  const cats = await prisma.category.findMany({
    where: {
      slug: {
        in: [
          "workwear-top", "workwear-bottom", "workwear-set", "workwear-winter",
          "safety-vest", "apron", "rainwear", "etc-products", "work-uniform",
        ],
      },
    },
  });
  const catMap = new Map(cats.map((c) => [c.slug, c.id]));

  const requiredSlugs = ["workwear-top", "workwear-bottom", "workwear-set", "workwear-winter", "safety-vest", "apron", "rainwear", "etc-products", "work-uniform"];
  for (const slug of requiredSlugs) {
    if (!catMap.has(slug)) throw new Error(`카테고리 없음: ${slug}`);
  }
  console.log("  ✓ 카테고리 ID 조회 완료\n");

  // 3. work-uniform 카테고리에 속한 상품 전체 조회
  console.log("  3단계: 근무복 상품 조회...");
  const workUniformCatId = catMap.get("work-uniform")!;
  const productCategories = await prisma.productCategory.findMany({
    where: { categoryId: workUniformCatId },
    include: { product: { select: { id: true, name: true } } },
  });
  console.log(`  총 ${productCategories.length}개 상품 재분류 시작...\n`);

  // 4. 각 상품 재분류
  const summary: Record<string, number> = {};
  let processed = 0;

  for (const pc of productCategories) {
    const { productId, product } = pc;
    const newSlug = classifyWorkwear(product.name);
    const newCatId = catMap.get(newSlug)!;

    summary[newSlug] = (summary[newSlug] || 0) + 1;

    // 기존 work-uniform 연결 삭제
    await prisma.productCategory.delete({
      where: { productId_categoryId: { productId, categoryId: workUniformCatId } },
    });

    // 새 카테고리 연결 (중복 방지)
    await prisma.productCategory.upsert({
      where: { productId_categoryId: { productId, categoryId: newCatId } },
      update: {},
      create: { productId, categoryId: newCatId },
    });

    // 조끼는 안전용품 상위도 추가
    if (newSlug === "safety-vest") {
      const safetyEquipmentCat = await prisma.category.findUnique({ where: { slug: "safety-equipment" } });
      if (safetyEquipmentCat) {
        await prisma.productCategory.upsert({
          where: { productId_categoryId: { productId, categoryId: safetyEquipmentCat.id } },
          update: {},
          create: { productId, categoryId: safetyEquipmentCat.id },
        });
      }
    }

    processed++;
    if (processed % 100 === 0) {
      console.log(`  ... ${processed}/${productCategories.length} 처리 중`);
    }
  }

  // 5. work-uniform 카테고리 삭제 (비워졌으므로)
  const remaining = await prisma.productCategory.count({ where: { categoryId: workUniformCatId } });
  if (remaining === 0) {
    await prisma.category.delete({ where: { slug: "work-uniform" } });
    console.log("\n  ✓ 빈 work-uniform 카테고리 삭제 완료");
  }

  // 6. 결과 출력
  const labelMap: Record<string, string> = {
    "workwear-top": "작업복 상의",
    "workwear-bottom": "작업복 하의",
    "workwear-set": "작업복 세트",
    "workwear-winter": "방한복",
    "safety-vest": "안전조끼",
    "apron": "앞치마",
    "rainwear": "우의/우비",
    "etc-products": "기타",
  };

  console.log("\n✅ 재분류 완료!\n");
  Object.entries(summary)
    .sort((a, b) => b[1] - a[1])
    .forEach(([slug, cnt]) => {
      console.log(`   ${labelMap[slug] || slug}: ${cnt}개`);
    });
}

main()
  .catch((e) => {
    console.error("❌ 실패:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
