import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });
async function main() {
  const result = await prisma.productImage.deleteMany({
    where: { isMain: false, url: { not: { contains: "_dt" } } }
  });
  console.log(`✅ ${result.count}개 비교 이미지 삭제 완료`);
  const remaining = await prisma.productImage.count();
  console.log(`남은 이미지: ${remaining}개 (대표 이미지 + 상세 이미지)`);
}
main().finally(() => prisma.$disconnect());
