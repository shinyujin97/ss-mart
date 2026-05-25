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
  const img = await prisma.productImage.findFirst({
    where: { product: { brandId: brand.id } },
    orderBy: { createdAt: "desc" },
  });
  console.log("Full URL:", img?.url);

  // Check description sample
  const withDesc = await prisma.product.findFirst({
    where: { brandId: brand.id, description: { not: null } },
    select: { name: true, description: true },
  });
  if (withDesc) {
    console.log("\nSample desc product:", withDesc.name);
    console.log("Desc preview:", withDesc.description?.substring(0, 200));
  }
  await prisma.$disconnect();
}
main().catch(console.error);
