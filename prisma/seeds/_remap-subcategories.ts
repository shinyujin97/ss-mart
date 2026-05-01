import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// 상품명에서 서브카테고리 결정
function classifyConstructionTransport(name: string): string {
  const n = name;
  if (/천막|타포린|차광망|휘장망|분진망|캐노피|방진망/.test(n)) return "tarpaulin-tent";
  if (/신호봉|호루라기|호각|신호수|신호조끼|신호봉/.test(n)) return "signal-equipment";
  if (/표지판|갈매기|LED|점멸|앙카|매립|차량진입|버팀목|가림막|코너보호|휀스|펜스|바리케|웨빙띠|접근금지|차단봉/.test(n)) return "traffic-safety";
  return "construction-misc";
}

function classifyToolsHardware(name: string): string {
  const n = name;
  if (/테이프|실리콘|접착|본드/.test(n)) return "adhesive-tape-hw";
  if (/누전|차단기|접촉기|릴레이|퓨즈|히터선|CATV|리셉터클|간판등|환풍기|콘센트|전기|동파|모듈러/.test(n)) return "electrical-materials";
  return "tools-etc";
}

function classifyOfficeSupplies(name: string): string {
  const n = name;
  if (/커피|맥심|카누|홍차|메밀|둥굴레|현미녹차|음료|차[0-9]|T\//.test(n) || /[0-9]+T\//.test(n)) return "beverage-food";
  return "office-stationery";
}

function classifyPackagingMaterials(name: string): string {
  const n = name;
  if (/통비닐|비닐/.test(n)) return "vinyl";
  if (/스트레치필름|자동랩/.test(n)) return "stretch-film";
  if (/논슬립|보호테이프|엠보/.test(n)) return "package-tape";
  if (/철밴드|코드스트랩|밴드|버클/.test(n)) return "packing-band";
  return "stretch-film";
}

async function createSub(slug: string, name: string, parentSlug: string, sortOrder: number) {
  const parent = await prisma.category.findUnique({ where: { slug: parentSlug } });
  if (!parent) throw new Error(`부모 없음: ${parentSlug}`);
  return prisma.category.upsert({
    where: { slug },
    update: { name, parentId: parent.id, level: 1 },
    create: { slug, name, parentId: parent.id, level: 1, sortOrder },
  });
}

async function reclassify(
  parentSlug: string,
  classifier: (name: string) => string
) {
  const parent = await prisma.category.findUnique({ where: { slug: parentSlug } });
  if (!parent) return;

  const rows = await prisma.productCategory.findMany({
    where: { categoryId: parent.id },
    include: { product: { select: { id: true, name: true } } },
  });

  const summary: Record<string, number> = {};
  for (const row of rows) {
    const newSlug = classifier(row.product.name);
    const newCat = await prisma.category.findUnique({ where: { slug: newSlug } });
    if (!newCat) continue;

    await prisma.productCategory.delete({
      where: { productId_categoryId: { productId: row.product.id, categoryId: parent.id } },
    });
    await prisma.productCategory.upsert({
      where: { productId_categoryId: { productId: row.product.id, categoryId: newCat.id } },
      update: {},
      create: { productId: row.product.id, categoryId: newCat.id },
    });
    summary[newSlug] = (summary[newSlug] || 0) + 1;
  }

  Object.entries(summary).sort((a, b) => b[1] - a[1]).forEach(([slug, cnt]) =>
    console.log(`    ${slug}: ${cnt}개`)
  );
}

async function main() {
  console.log("🔄 4개 카테고리 서브분류 시작\n");

  // ── 건설교통 ──
  console.log("─ 건설교통 서브카테고리 생성...");
  await createSub("traffic-safety", "교통안전시설", "construction-transport", 1);
  await createSub("tarpaulin-tent", "천막&덮개류", "construction-transport", 2);
  await createSub("signal-equipment", "신호용품", "construction-transport", 3);
  await createSub("construction-misc", "현장안전기타", "construction-transport", 4);
  console.log("  분류 결과:");
  await reclassify("construction-transport", classifyConstructionTransport);

  // ── 공구&철물 ──
  console.log("\n─ 공구&철물 서브카테고리 생성...");
  await createSub("electrical-materials", "전기자재", "tools-hardware", 1);
  await createSub("adhesive-tape-hw", "접착&테이프", "tools-hardware", 2);
  await createSub("tools-etc", "공구&기타", "tools-hardware", 3);
  console.log("  분류 결과:");
  await reclassify("tools-hardware", classifyToolsHardware);

  // ── 사무용품&잡화 ──
  console.log("\n─ 사무용품&잡화 서브카테고리 생성...");
  await createSub("beverage-food", "음료&식품", "office-supplies", 1);
  await createSub("office-stationery", "사무용품", "office-supplies", 2);
  console.log("  분류 결과:");
  await reclassify("office-supplies", classifyOfficeSupplies);

  // ── 포장자재&비닐 ──
  console.log("\n─ 포장자재&비닐 서브카테고리 생성...");
  await createSub("vinyl", "비닐류", "packaging-materials", 1);
  await createSub("stretch-film", "포장필름", "packaging-materials", 2);
  await createSub("package-tape", "테이프류", "packaging-materials", 3);
  await createSub("packing-band", "밴드류", "packaging-materials", 4);
  console.log("  분류 결과:");
  await reclassify("packaging-materials", classifyPackagingMaterials);

  console.log("\n✅ 전체 완료!");
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
