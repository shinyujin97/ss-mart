import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedCategories } from "./categories";
import { seedBrands } from "./brands";
import { seedCoupons } from "./coupons";
import { seedProducts } from "./products";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 시드 데이터 생성 시작...\n");

  await seedCategories(prisma);
  await seedBrands(prisma);
  await seedCoupons(prisma);

  if (process.env.NODE_ENV !== "production") {
    await seedProducts(prisma);
  }

  console.log("\n✅ 모든 시드 데이터 생성 완료!");
}

main()
  .catch((e) => {
    console.error("❌ 시드 실패:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
