import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 모든 카테고리 조회
  const categories = await prisma.category.findMany({ select: { id: true, slug: true } });

  let total = 0;
  for (const cat of categories) {
    // 해당 카테고리의 상품들을 createdAt 기준으로 조회
    const entries = await prisma.productCategory.findMany({
      where: { categoryId: cat.id },
      include: { product: { select: { createdAt: true } } },
      orderBy: { product: { createdAt: "asc" } },
    });

    // createdAt 오름차순으로 1번부터 번호 부여
    for (let i = 0; i < entries.length; i++) {
      await prisma.productCategory.update({
        where: { productId_categoryId: { productId: entries[i].productId, categoryId: cat.id } },
        data: { sortOrder: i + 1 },
      });
    }
    if (entries.length > 0) {
      console.log(`${cat.slug}: ${entries.length}개 번호 부여`);
      total += entries.length;
    }
  }
  console.log(`\n총 ${total}개 완료`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
