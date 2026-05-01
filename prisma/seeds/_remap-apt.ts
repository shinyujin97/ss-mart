import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });
async function main() {
  const safetyEquipment = await prisma.category.findUnique({ where: { slug: "safety-equipment" } });
  if (!safetyEquipment) throw new Error("안전용품 카테고리 없음");

  // APT용품 하위 카테고리 재생성
  const aptCat = await prisma.category.upsert({
    where: { slug: "apt-supplies" },
    update: { name: "APT용품", parentId: safetyEquipment.id, level: 1 },
    create: { slug: "apt-supplies", name: "APT용품", parentId: safetyEquipment.id, level: 1, sortOrder: 10 },
  });
  console.log("APT용품 카테고리 생성:", aptCat.id);

  // 현재 안전용품에 직접 연결된 상품 중 원래 APT용품 상품 찾기
  // → 안전용품에 연결된 상품을 APT용품으로 옮김 (중복 제거)
  // 단, 원래부터 안전용품 하위(안전모/마스크/안전조끼/장갑)에 속한 건 제외
  const subCatIds = await prisma.category.findMany({
    where: { parentId: safetyEquipment.id, slug: { not: "apt-supplies" } },
    select: { id: true },
  });
  const subIds = subCatIds.map(c => c.id);

  // 안전용품 직접 연결 상품 중, 다른 안전용품 하위에도 없는 상품 = APT용품 출신
  const directRows = await prisma.productCategory.findMany({
    where: { categoryId: safetyEquipment.id },
  });

  let moved = 0;
  for (const row of directRows) {
    const hasSubCat = subIds.length > 0 && await prisma.productCategory.count({
      where: { productId: row.productId, categoryId: { in: subIds } }
    }) > 0;

    if (!hasSubCat) {
      // APT용품 출신 → APT용품 하위로 이동
      await prisma.productCategory.delete({
        where: { productId_categoryId: { productId: row.productId, categoryId: safetyEquipment.id } },
      });
      await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: row.productId, categoryId: aptCat.id } },
        update: {},
        create: { productId: row.productId, categoryId: aptCat.id },
      });
      moved++;
    }
  }

  console.log(`✅ 완료 — APT용품 하위로 이동: ${moved}개`);
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
