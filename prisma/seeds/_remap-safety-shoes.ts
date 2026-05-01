import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// 우선순위 순서로 분류
function classifySafetyShoe(name: string): string {
  const n = name;
  if (/용접화/.test(n)) return "welding-shoes";
  if (/절연/.test(n)) return "insulated-shoes";
  if (/방수|고어텍스|심파텍스|방수내피/.test(n)) return "waterproof-shoes";
  if (/방한|겨울|동절|방풍/.test(n)) return "winter-safety-shoes";
  if (/워킹화|활동화|다목적화/.test(n)) return "walking-shoes";
  if (/8인치/.test(n)) return "safety-shoes-8inch";
  if (/6인치/.test(n)) return "safety-shoes-6inch";
  if (/5인치/.test(n)) return "safety-shoes-5inch";
  if (/4인치/.test(n)) return "safety-shoes-4inch";
  return "safety-shoes-misc";
}

async function main() {
  console.log("👟 안전화 카테고리 분류 시작\n");

  const parent = await prisma.category.findUnique({ where: { slug: "safety-shoes" } });
  if (!parent) throw new Error("안전화 카테고리 없음");

  // 새 서브카테고리 추가
  const newSubs = [
    { slug: "safety-shoes-4inch", name: "4인치", sortOrder: 2 },
    { slug: "safety-shoes-5inch", name: "5인치", sortOrder: 3 },
    { slug: "welding-shoes",      name: "용접화", sortOrder: 6 },
    { slug: "walking-shoes",      name: "워킹/활동화", sortOrder: 7 },
    { slug: "safety-shoes-misc",  name: "기타 안전화", sortOrder: 99 },
  ];

  for (const sub of newSubs) {
    await prisma.category.upsert({
      where: { slug: sub.slug },
      update: { name: sub.name },
      create: { slug: sub.slug, name: sub.name, parentId: parent.id, level: 1, sortOrder: sub.sortOrder },
    });
  }
  console.log("✓ 새 서브카테고리 생성 완료\n");

  // 안전화 직접 연결 상품 전부 재분류
  const rows = await prisma.productCategory.findMany({
    where: { categoryId: parent.id },
    include: { product: { select: { id: true, name: true } } },
  });
  console.log(`총 ${rows.length}개 상품 분류 시작...\n`);

  const summary: Record<string, number> = {};
  for (const row of rows) {
    const newSlug = classifySafetyShoe(row.product.name);
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

  const labelMap: Record<string, string> = {
    "welding-shoes":       "용접화",
    "insulated-shoes":     "절연화",
    "waterproof-shoes":    "방수화",
    "winter-safety-shoes": "방한 안전화",
    "walking-shoes":       "워킹/활동화",
    "safety-shoes-8inch":  "8인치",
    "safety-shoes-6inch":  "6인치",
    "safety-shoes-5inch":  "5인치",
    "safety-shoes-4inch":  "4인치",
    "safety-shoes-misc":   "기타 안전화",
  };

  console.log("✅ 분류 완료!\n");
  Object.entries(summary)
    .sort((a, b) => b[1] - a[1])
    .forEach(([slug, cnt]) => console.log(`   ${labelMap[slug] ?? slug}: ${cnt}개`));
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
