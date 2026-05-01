import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });
async function main() {
  const slugs = ["workwear-top","workwear-bottom","safety-shoes-6inch","safety-shoes-4inch","apt-supplies","welding","workwear-winter","safety-vest","mask","gloves"];
  const seen = new Set<string>(), usedBrands = new Set<string>(), mixed: any[] = [];
  for (const slug of slugs) {
    if (mixed.length >= 8) break;
    const cat = await prisma.category.findUnique({ where: { slug } });
    if (!cat) continue;
    const candidates = await prisma.product.findMany({
      where: { status: "ACTIVE", categories: { some: { categoryId: cat.id } }, images: { some: { isMain: true } } },
      take: 5, include: { brand: { select: { name: true } }, images: { where: { isMain: true }, take: 1 } },
      orderBy: { id: "asc" },
    });
    const pick = candidates.find(p => !seen.has(p.id) && !usedBrands.has(p.brandId)) ?? candidates.find(p => !seen.has(p.id));
    if (pick) { seen.add(pick.id); usedBrands.add(pick.brandId); mixed.push(pick); }
  }
  console.log(`총 ${mixed.length}개`);
  mixed.forEach((p, i) => console.log(`${i+1}. [${p.brand.name}] ${p.name.substring(0,40)} | 이미지: ${p.images[0]?.url ?? '없음'}`));
}
main().finally(() => prisma.$disconnect());
