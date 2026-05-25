import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const brand = await prisma.brand.findFirst({ where: { slug: "tbuc" } });
  if (!brand) { console.log("T-BUC 브랜드 없음"); return; }

  const products = await prisma.product.findMany({
    where: { brandId: brand.id },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
    take: 30,
  });

  console.log(`T-BUC 상품 샘플 (총 ${await prisma.product.count({ where: { brandId: brand.id } })}개):\n`);
  for (const p of products) {
    const imgCount = await prisma.productImage.count({ where: { productId: p.id } });
    console.log(`  ${p.name.padEnd(30)} | 이미지: ${imgCount}`);
  }
  await prisma.$disconnect();
}
main().catch(console.error);
