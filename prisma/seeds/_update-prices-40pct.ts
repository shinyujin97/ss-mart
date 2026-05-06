import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("상품 가격 40% 인상 시작...");

  const products = await prisma.product.findMany({
    select: { id: true, name: true, basePrice: true, salePrice: true },
  });

  console.log(`총 ${products.length}개 상품 업데이트`);

  let updated = 0;
  for (const p of products) {
    // 40% 인상 후 100원 단위 반올림
    const newBasePrice = Math.round((p.basePrice * 1.4) / 100) * 100;
    const newSalePrice = Math.round((p.salePrice * 1.4) / 100) * 100;

    await prisma.product.update({
      where: { id: p.id },
      data: { basePrice: newBasePrice, salePrice: newSalePrice },
    });
    updated++;
    if (updated % 100 === 0) console.log(`  ${updated}/${products.length} 완료`);
  }

  console.log(`✅ 완료: ${updated}개 상품 가격 40% 인상`);

  // 샘플 확인
  const samples = await prisma.product.findMany({
    take: 5,
    select: { name: true, basePrice: true, salePrice: true },
    orderBy: { createdAt: "desc" },
  });
  console.log("\n[샘플 확인]");
  samples.forEach((s) =>
    console.log(`  ${s.name}: 정가 ${s.basePrice.toLocaleString()}원 / 판매가 ${s.salePrice.toLocaleString()}원`)
  );
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
