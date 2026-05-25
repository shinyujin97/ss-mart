import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const brand = await prisma.brand.findFirstOrThrow({ where: { slug: "tbuc" } });

  // TB-101 중복 확인
  const tb101 = await prisma.product.findMany({
    where: { brandId: brand.id, name: { contains: "TB-101" } },
    include: { images: { take: 1 } },
  });
  console.log("=== TB-101 관련 상품 ===");
  tb101.forEach(p => console.log(`  [${p.id}] "${p.name}" | 이미지:${p.images.length} | URL:${p.images[0]?.url?.substring(0, 80) ?? "없음"}`));

  // TB-751, TB-773 URL 확인
  const targets = ["TB-751", "TB-773", "TB-355", "TB-356"];
  console.log("\n=== 지정 상품 이미지 URL ===");
  for (const t of targets) {
    const p = await prisma.product.findFirst({
      where: { brandId: brand.id, name: { contains: t } },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });
    if (!p) { console.log(`  ${t}: 없음`); continue; }
    console.log(`  ${t}: "${p.name}"`);
    p.images.forEach((img, i) => console.log(`    [${i}] isMain:${img.isMain} | ${img.url}`));
  }

  // Supabase URL 패턴 분석
  const allImgs = await prisma.productImage.findMany({
    where: { product: { brandId: brand.id } },
    take: 5,
    orderBy: { createdAt: "asc" },
  });
  console.log("\n=== 가장 오래된 이미지 URL (이전 것) ===");
  allImgs.forEach(img => console.log(`  ${img.url}`));

  await prisma.$disconnect();
}
main().catch(console.error);
