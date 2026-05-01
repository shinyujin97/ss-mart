import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔄 ETC 품번 기준 재분류\n");

  const etcBrand = await prisma.brand.findUnique({ where: { slug: "etc-brand" } });
  const tbucBrand = await prisma.brand.findUnique({ where: { slug: "tbuc" } });
  const m3Brand = await prisma.brand.findUnique({ where: { slug: "3m" } });

  if (!etcBrand || !tbucBrand || !m3Brand) throw new Error("브랜드 없음");

  const products = await prisma.product.findMany({
    where: { brandId: etcBrand.id },
    select: { id: true, name: true },
  });

  // T-BUC 품번 접두사
  const TBUC_PREFIXES = ["TBS", "TJS", "TLS", "PKG", "MK", "TL", "TB"];

  let tbucCount = 0;
  let m3Count = 0;

  const tbucIds: string[] = [];
  const m3Ids: string[] = [];

  for (const p of products) {
    const code = p.name.split("/")[0].trim().toUpperCase();
    const isTbuc = TBUC_PREFIXES.some(prefix => code.startsWith(prefix));
    const is3M = p.name.includes("3M");

    if (isTbuc) tbucIds.push(p.id);
    else if (is3M) m3Ids.push(p.id);
  }

  // T-BUC 이동
  if (tbucIds.length > 0) {
    await prisma.product.updateMany({
      where: { id: { in: tbucIds } },
      data: { brandId: tbucBrand.id },
    });
    tbucCount = tbucIds.length;
  }

  // 3M 이동
  if (m3Ids.length > 0) {
    await prisma.product.updateMany({
      where: { id: { in: m3Ids } },
      data: { brandId: m3Brand.id },
    });
    m3Count = m3Ids.length;
  }

  const remaining = await prisma.product.count({ where: { brandId: etcBrand.id } });

  console.log(`  ✓ T-BUC (TBS/TJS/TLS/PKG/MK/TL/TB): ${tbucCount}개`);
  console.log(`  ✓ 3M: ${m3Count}개`);
  console.log(`\n✅ 총 ${tbucCount + m3Count}개 이동 / ETC 잔여: ${remaining}개`);
}

main()
  .catch(e => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
