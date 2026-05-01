import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔄 ETC 브랜드 — 상품명 기준 재분류\n");

  const etcBrand = await prisma.brand.findUnique({ where: { slug: "etc-brand" } });
  const allBrands = await prisma.brand.findMany({ select: { id: true, slug: true, name: true, nameKr: true } });

  const products = await prisma.product.findMany({
    where: { brandId: etcBrand!.id },
    select: { id: true, name: true },
  });

  let moved = 0;
  const summary: Record<string, number> = {};

  for (const p of products) {
    const parts = p.name.split("/").map(s => s.trim());

    // 2~5번째 파트에서 기존 브랜드명 매칭
    let matched = null;
    for (const part of parts.slice(1, 6)) {
      matched = allBrands.find(
        b => b.name.toUpperCase() === part.toUpperCase() ||
             b.nameKr === part
      );
      if (matched) break;
    }

    if (matched && matched.id !== etcBrand!.id) {
      await prisma.product.update({
        where: { id: p.id },
        data: { brandId: matched.id },
      });
      summary[matched.nameKr] = (summary[matched.nameKr] || 0) + 1;
      moved++;
    }
  }

  const remaining = await prisma.product.count({ where: { brandId: etcBrand!.id } });

  console.log("이동 결과:");
  Object.entries(summary).sort((a,b) => b[1]-a[1]).forEach(([name, cnt]) =>
    console.log(`  ✓ [${name}] ${cnt}개`)
  );
  console.log(`\n✅ 총 ${moved}개 이동 / ETC 잔여: ${remaining}개`);
}

main()
  .catch(e => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
