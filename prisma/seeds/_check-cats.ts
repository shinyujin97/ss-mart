import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });
async function main() {
  const yuhan = await prisma.brand.findUnique({ where: { slug: "yuhan" } });
  const yuhanKimberly = await prisma.brand.findUnique({ where: { slug: "yuhan-kimberly" } });
  const result = await prisma.product.updateMany({
    where: { brandId: yuhan!.id },
    data: { brandId: yuhanKimberly!.id },
  });
  await prisma.brand.delete({ where: { slug: "yuhan" } });
  console.log(`✅ 유한 → 유한킴벌리 ${result.count}개 이동 / 유한 브랜드 삭제`);
}
main().finally(() => prisma.$disconnect());
