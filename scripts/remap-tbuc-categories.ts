/**
 * T-BUC 카테고리 재매핑
 * tbuc-scraped.json의 category 필드를 기반으로 DB 카테고리 연결 정확히 재설정
 *
 * 사용법: npx tsx scripts/remap-tbuc-categories.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import * as fs from "fs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const SCRAPED_FILE = resolve(process.cwd(), "scripts/tbuc-scraped.json");

// T-BUC 카테고리 → DB category slug 매핑
const CAT_MAP: Record<string, string[]> = {
  "봄여름/점퍼":       ["workwear-top"],
  "봄여름/셔츠티셔츠":  ["workwear-top"],
  "봄여름/조끼":       ["workwear-vest"],
  "봄여름/상하작업복":  ["workwear-set"],
  "봄여름/바지":       ["workwear-bottom"],
  "봄여름/정비복":     ["workwear-set"],
  "봄여름/경비복":     ["workwear-top"],
  "봄여름/제전복":     ["workwear-top"],
  "가을겨울/점퍼":     ["workwear-winter"],
  "가을겨울/셔츠티셔츠": ["workwear-top"],
  "가을겨울/조끼":     ["workwear-vest"],
  "가을겨울/상하작업복": ["workwear-set"],
  "가을겨울/바지":     ["workwear-bottom"],
  "가을겨울/정비복":   ["workwear-set"],
  "가을겨울/경비복":   ["workwear-winter"],
  "가을겨울/파카":     ["workwear-winter"],
  "사계절/상하작업복":  ["workwear-set"],
  "사계절/제전복":     ["workwear-top"],
  "사계절/방염복":     ["workwear-top"],
  "안전화/4인치":      ["safety-shoes-4inch"],
  "안전화/6인치고급형":  ["safety-shoes-6inch"],
  "안전화/6인치기본형":  ["safety-shoes-6inch"],
  "안전화/다목적":     ["safety-shoes-misc"],
  "안전화/인젝션":     ["safety-shoes-misc"],
  "안전화/방한화":     ["winter-safety-shoes"],
};

function normalize(s: string) {
  return s.toUpperCase().replace(/[\s\-_\[\]\/()]/g, "");
}

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  if (!fs.existsSync(SCRAPED_FILE)) {
    console.error("❌ tbuc-scraped.json 없음"); process.exit(1);
  }

  const scraped: any[] = JSON.parse(fs.readFileSync(SCRAPED_FILE, "utf-8"));
  console.log(`📂 스크래핑 데이터: ${scraped.length}개`);

  // sitTitle / name → category 맵
  const titleCatMap = new Map<string, string>();
  for (const p of scraped) {
    const key = (p.sitTitle || p.name || "").trim();
    if (key && p.category) titleCatMap.set(normalize(key), p.category);
  }

  // DB 카테고리 ID 로드
  const allSlugs = [...new Set(Object.values(CAT_MAP).flat())];
  const dbCats = await prisma.category.findMany({ where: { slug: { in: allSlugs } } });
  const catIdMap = new Map(dbCats.map(c => [c.slug, c.id]));
  console.log(`카테고리 로드: ${dbCats.length}개`);

  const brand = await prisma.brand.findFirstOrThrow({ where: { slug: "tbuc" } });
  const products = await prisma.product.findMany({ where: { brandId: brand.id } });
  console.log(`T-BUC 상품: ${products.length}개\n`);

  // 기존 카테고리 전체 삭제
  const { count: delCount } = await prisma.productCategory.deleteMany({
    where: { product: { brandId: brand.id } },
  });
  console.log(`기존 카테고리 연결 ${delCount}개 삭제\n`);

  let matched = 0;
  let unmatched = 0;

  for (const prod of products) {
    const normName = normalize(prod.name);
    const tbucCat = titleCatMap.get(normName);

    if (!tbucCat) {
      // 부분 매칭 시도
      let found: string | undefined;
      for (const [key, cat] of titleCatMap) {
        if (normName.startsWith(key.slice(0, 6)) || key.startsWith(normName.slice(0, 6))) {
          found = cat; break;
        }
      }
      if (!found) { unmatched++; continue; }
      const dbSlugs = CAT_MAP[found];
      if (!dbSlugs) { unmatched++; continue; }
      for (const slug of dbSlugs) {
        const catId = catIdMap.get(slug);
        if (catId) await prisma.productCategory.create({ data: { productId: prod.id, categoryId: catId } });
      }
      matched++;
      continue;
    }

    const dbSlugs = CAT_MAP[tbucCat];
    if (!dbSlugs) { unmatched++; continue; }

    for (const slug of dbSlugs) {
      const catId = catIdMap.get(slug);
      if (catId) await prisma.productCategory.create({ data: { productId: prod.id, categoryId: catId } });
    }
    matched++;
  }

  console.log(`✅ 매칭 성공: ${matched}개 | 미매칭: ${unmatched}개\n`);

  // 결과 확인
  const byCat = await prisma.productCategory.groupBy({
    by: ["categoryId"],
    where: { product: { brandId: brand.id } },
    _count: true,
  });
  const cats = await prisma.category.findMany({ where: { id: { in: byCat.map(b => b.categoryId) } } });
  const catNameMap = new Map(cats.map(c => [c.id, c.name]));
  console.log("카테고리별 상품 수:");
  byCat.sort((a, b) => b._count - a._count).forEach(b => {
    console.log(`  ${(catNameMap.get(b.categoryId) ?? "?").padEnd(20)} ${b._count}개`);
  });

  await prisma.$disconnect();
}

main().catch(e => { console.error("❌", e); process.exit(1); });
