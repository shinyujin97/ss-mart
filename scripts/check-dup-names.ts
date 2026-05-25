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
  const all = await prisma.product.findMany({
    where: { brandId: brand.id },
    select: { id: true, name: true, slug: true },
  });

  const nameCount = new Map<string, number>();
  for (const p of all) nameCount.set(p.name, (nameCount.get(p.name) ?? 0) + 1);

  const dups = [...nameCount.entries()].filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]);
  console.log(`중복 이름 ${dups.length}종 (총 ${dups.reduce((s, [, c]) => s + c - 1, 0)}개 중복 레코드):\n`);
  dups.forEach(([name, count]) => console.log(`  "${name}": ${count}개`));

  await prisma.$disconnect();
}
main().catch(console.error);
