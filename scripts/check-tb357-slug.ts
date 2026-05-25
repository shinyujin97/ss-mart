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
  const prod = await prisma.product.findFirst({
    where: { brandId: brand.id, name: "TB-357" },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!prod) { console.log("TB-357 없음"); return; }
  console.log(`name: ${prod.name}`);
  console.log(`slug: ${prod.slug}`);
  console.log(`status: ${prod.status}`);
  console.log(`이미지 ${prod.images.length}개:`);
  prod.images.forEach(img => console.log(`  isMain:${img.isMain} sortOrder:${img.sortOrder} → ${img.url}`));
  await prisma.$disconnect();
}
main().catch(console.error);
