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
  const total = await prisma.product.count({ where: { brandId: brand.id } });
  const withImages = await prisma.productImage.count({ where: { product: { brandId: brand.id } } });
  const withDesc = await prisma.product.count({ where: { brandId: brand.id, description: { not: null } } });

  const sample = await prisma.productImage.findMany({
    where: { product: { brandId: brand.id } },
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  console.log("Products:", total);
  console.log("Total images in DB:", withImages);
  console.log("Products with description:", withDesc);
  console.log("Recent image URLs:");
  sample.forEach(img => console.log(" ", img.url.substring(0, 100)));

  // Check TB-356 specifically
  const tb356 = await prisma.product.findFirst({
    where: { brandId: brand.id, name: { contains: "TB-356" } },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (tb356) {
    console.log("\nTB-356:", tb356.name);
    console.log("  images:", tb356.images.length);
    console.log("  description length:", tb356.description?.length ?? 0);
    if (tb356.description) console.log("  desc preview:", tb356.description.substring(0, 120));
  }

  await prisma.$disconnect();
}
main().catch(console.error);
