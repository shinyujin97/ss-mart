/**
 * 특정 브랜드의 안전화 카테고리 상품 이미지를 Supabase Storage + DB에서 삭제
 * 브랜드/상품 레코드 유지, 작업복 등 다른 카테고리 이미지는 유지
 *
 * 사용법:
 *   npx tsx scripts/delete-brand-images.ts          # dry-run
 *   npx tsx scripts/delete-brand-images.ts --delete  # 실제 삭제
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";

const DRY_RUN = !process.argv.includes("--delete");

// 안전화 삭제 대상 브랜드 (클라이언트 지시 기준)
const TARGET_BRAND_SLUGS = [
  "blackyak",  // Black Yak
  "bulls",     // Bulls
  "campline",  // Campline
  "etc-brand", // Etc
  "lecaf",     // Lecaf
  "prospecs",  // Prospecs
  "semong",    // Semong
  "techline",  // Techline
];

// 안전화 카테고리 슬러그 전체 (메인 + 서브)
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

const BUCKET = "products";
const CHUNK_SIZE = 100;

async function main() {
  console.log(DRY_RUN ? "🔍 DRY-RUN 모드 (실제 삭제 없음)" : "🗑️  실제 삭제 모드");
  console.log("대상 브랜드:", TARGET_BRAND_SLUGS.join(", "));
  console.log("카테고리: 안전화 전체");
  console.log("");

  const adapter = new PrismaPg(process.env.DATABASE_URL!);
  const prisma = new PrismaClient({ adapter });

  // 안전화 카테고리 ID 조회
  const categories = await prisma.category.findMany({
    where: { slug: { in: SAFETY_SHOES_CATEGORY_SLUGS } },
    select: { id: true, name: true, slug: true },
  });

  const categoryIds = categories.map((c) => c.id);
  console.log(`안전화 카테고리 ${categories.length}개: ${categories.map((c) => c.name).join(", ")}\n`);

  // 대상 브랜드 조회
  const brands = await prisma.brand.findMany({
    where: { slug: { in: TARGET_BRAND_SLUGS } },
    orderBy: { name: "asc" },
  });

  const allPaths: string[] = [];
  const allImageIds: string[] = [];
  let detectedSupabaseUrl = "";

  for (const brand of brands) {
    // 해당 브랜드 + 안전화 카테고리에 속한 상품 ID
    const products = await prisma.product.findMany({
      where: {
        brandId: brand.id,
        categories: { some: { categoryId: { in: categoryIds } } },
      },
      select: { id: true },
    });

    const productIds = products.map((p) => p.id);

    const images = await prisma.productImage.findMany({
      where: { productId: { in: productIds } },
      select: { id: true, url: true },
    });

    console.log(`  📦 ${brand.name} — 안전화 상품 ${products.length}개, 이미지 ${images.length}개`);

    for (const img of images) {
      try {
        const url = new URL(img.url);
        const pathParts = url.pathname.split(`/public/${BUCKET}/`);
        if (pathParts.length === 2) {
          allPaths.push(pathParts[1]);
          allImageIds.push(img.id);
          if (!detectedSupabaseUrl) detectedSupabaseUrl = url.origin;
        }
      } catch {
        console.log(`    ⚠️  URL 파싱 실패: ${img.url}`);
      }
    }
  }

  console.log(`\n총 삭제 대상: ${allImageIds.length}개 이미지`);

  if (DRY_RUN) {
    console.log(`\n✅ DRY-RUN 완료`);
    console.log(`   Storage 삭제 예정: ${allPaths.length}개`);
    console.log(`   DB 레코드 삭제 예정: ${allImageIds.length}개`);
    console.log(`   작업복 등 다른 카테고리 이미지: 유지`);
    console.log(`\n실제 삭제 명령:`);
    console.log(`   npx tsx scripts/delete-brand-images.ts --delete`);
    await prisma.$disconnect();
    return;
  }

  // ── 실제 삭제 ───────────────────────────────────────────────────
  // 이미지 URL에서 추출한 값 우선 (env var가 오염될 수 있음)
  const supabaseUrl = detectedSupabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

  if (serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    console.log("\nSupabase Storage 삭제 중...");
    let storageDeleted = 0;
    for (let i = 0; i < allPaths.length; i += CHUNK_SIZE) {
      const chunk = allPaths.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabase.storage.from(BUCKET).remove(chunk);
      if (error) {
        console.log(`  ⚠️  청크 오류:`, error.message);
      } else {
        storageDeleted += data?.length ?? 0;
        process.stdout.write(`  ${storageDeleted}/${allPaths.length} 완료\r`);
      }
    }
    console.log(`\n  Storage 삭제 완료: ${storageDeleted}개`);
  } else {
    console.log("\n⚠️  SUPABASE_SERVICE_ROLE_KEY 없음 → Storage 건너뜀");
    console.log("   SUPABASE_SERVICE_ROLE_KEY=xxx npx tsx scripts/delete-brand-images.ts --delete");
  }

  console.log("\nDB ProductImage 삭제 중...");
  const { count } = await prisma.productImage.deleteMany({
    where: { id: { in: allImageIds } },
  });
  console.log(`  DB 삭제 완료: ${count}개`);
  console.log(`\n✅ 완료! 브랜드/상품/작업복 이미지는 유지됨`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ 오류:", e);
  process.exit(1);
});
