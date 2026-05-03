import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 현재 workwear 하위 카테고리 순서 확인
  const workwear = await prisma.category.findUnique({
    where: { slug: "workwear" },
    include: { children: { orderBy: { sortOrder: "asc" } } },
  });
  console.log("현재 workwear 하위:", workwear?.children.map(c => `${c.sortOrder} ${c.slug}`));

  // 원하는 순서: 상의 → 하의 → 상하세트 → 조끼 → 방한복 → 나머지
  const ORDER = [
    "workwear-top",
    "workwear-bottom",
    "workwear-set",
    "workwear-vest",
    "workwear-winter",
  ];

  const children = workwear?.children ?? [];
  const others = children.filter(c => !ORDER.includes(c.slug));

  const allOrdered = [...ORDER, ...others.map(c => c.slug)];
  for (let i = 0; i < allOrdered.length; i++) {
    const slug = allOrdered[i];
    const cat = children.find(c => c.slug === slug);
    if (cat) {
      await prisma.category.update({ where: { id: cat.id }, data: { sortOrder: i + 1 } });
      console.log(`  ${i + 1} → ${slug}`);
    }
  }
  console.log("sortOrder 업데이트 완료");
}

main().catch(console.error).finally(() => prisma.$disconnect());
