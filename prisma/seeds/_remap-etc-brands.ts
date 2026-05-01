import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// 새로 만들 브랜드 + 상품명 키워드 매핑
const BRAND_MAP = [
  { slug: "tbuc",      name: "T-BUC",     nameKr: "티뷰크",   keywords: ["티뷰크"] },
  { slug: "keitel",    name: "KEITEL",    nameKr: "케이텔",   keywords: ["케이텔"] },
  { slug: "blackyak",  name: "BLACKYAK",  nameKr: "블랙야크", keywords: ["블랙야크"] },
  { slug: "ls",        name: "LS",        nameKr: "LS",       keywords: ["/LS/"] },
  { slug: "suzuki-safety", name: "SUZUKI", nameKr: "스즈끼", keywords: ["스즈끼"] },
  { slug: "withus",    name: "WITHUS",    nameKr: "위드어스", keywords: ["위더스", "WITHUS"] },
  { slug: "myungjin",  name: "MYUNGJIN",  nameKr: "명진",     keywords: ["명진"] },
  { slug: "daewon",    name: "DAEWON",    nameKr: "대원",     keywords: ["대원"] },
  { slug: "superjam",  name: "SUPERJAM",  nameKr: "수퍼잼",   keywords: ["수퍼잼"] },
  { slug: "safers",    name: "SAFERS",    nameKr: "세이퍼스", keywords: ["SAFERS"] },
];

async function main() {
  console.log("🔄 ETC 브랜드 재분류 시작\n");

  const etcBrand = await prisma.brand.findUnique({ where: { slug: "etc-brand" } });
  if (!etcBrand) throw new Error("etc-brand 없음");

  let totalMoved = 0;

  for (const b of BRAND_MAP) {
    // 브랜드 upsert
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name, nameKr: b.nameKr },
      create: { slug: b.slug, name: b.name, nameKr: b.nameKr },
    });

    // ETC 브랜드 상품 중 키워드 매칭
    const products = await prisma.product.findMany({
      where: {
        brandId: etcBrand.id,
        OR: b.keywords.map(k => ({ name: { contains: k } })),
      },
      select: { id: true, name: true },
    });

    if (products.length > 0) {
      await prisma.product.updateMany({
        where: { id: { in: products.map(p => p.id) } },
        data: { brandId: brand.id },
      });
      console.log(`  ✓ [${b.nameKr}] → ${products.length}개 이동`);
      totalMoved += products.length;
    } else {
      console.log(`  ⬜ [${b.nameKr}] → 매칭 없음`);
    }
  }

  const remaining = await prisma.product.count({ where: { brandId: etcBrand.id } });
  console.log(`\n✅ 완료 — 총 ${totalMoved}개 이동 / ETC 잔여: ${remaining}개`);
}

main()
  .catch(e => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
