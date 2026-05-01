import "dotenv/config";
import * as fs from "fs";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });
async function main() {
  const dir = "./public/brands";
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".png"));
  let updated = 0;
  for (const file of files) {
    const slug = file.replace(".png", "");
    const result = await prisma.brand.updateMany({
      where: { slug },
      data: { logoUrl: `/brands/${file}` },
    });
    if (result.count > 0) { updated++; }
  }
  console.log(`✅ ${updated}개 브랜드 logoUrl 업데이트 완료`);
}
main().finally(() => prisma.$disconnect());
