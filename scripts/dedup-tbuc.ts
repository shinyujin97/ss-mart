/**
 * T-BUC 중복 상품명 정리
 * - 이미지 많은 것 1개 보존, 나머지 Supabase 이미지 + DB 레코드 삭제
 * 사용법:
 *   npx tsx scripts/dedup-tbuc.ts check   # 삭제 예정 목록 확인
 *   npx tsx scripts/dedup-tbuc.ts delete  # 실제 삭제
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const BUCKET = "products";

async function main(doDelete: boolean) {
  const adapter = new PrismaPg(process.env.DATABASE_URL!);
  const prisma = new PrismaClient({ adapter });

  const brand = await prisma.brand.findFirstOrThrow({ where: { slug: "tbuc" } });
  const all = await prisma.product.findMany({
    where: { brandId: brand.id },
    include: { images: true, options: true },
    orderBy: { createdAt: "asc" },
  });

  // 이름별 그룹
  const groups = new Map<string, typeof all>();
  for (const p of all) {
    const g = groups.get(p.name) ?? [];
    g.push(p);
    groups.set(p.name, g);
  }

  const toDelete: typeof all = [];
  for (const [name, group] of groups) {
    if (group.length <= 1) continue;
    // 이미지 많은 순 정렬, 같으면 옵션 많은 순
    group.sort((a, b) => (b.images.length - a.images.length) || (b.options.length - a.options.length));
    const keep = group[0];
    const remove = group.slice(1);
    console.log(`"${name}": ${group.length}개 → 보존:[${keep.id.slice(-6)}] 삭제:${remove.length}개`);
    toDelete.push(...remove);
  }

  console.log(`\n삭제 예정: ${toDelete.length}개`);
  if (!doDelete) {
    console.log("\n실제 삭제: npx tsx scripts/dedup-tbuc.ts delete");
    await prisma.$disconnect();
    return;
  }

  // Supabase 이미지 삭제
  const anyImg = await prisma.productImage.findFirst({ where: { product: { brandId: brand.id } } });
  const supabaseUrl = anyImg ? new URL(anyImg.url).origin : process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!.trim());

  const allImgs = toDelete.flatMap(p => p.images);
  const paths = allImgs.map(img => {
    try { return new URL(img.url).pathname.split(`/public/${BUCKET}/`)[1]; } catch { return null; }
  }).filter((p): p is string => !!p);

  if (paths.length > 0) {
    for (let i = 0; i < paths.length; i += 100)
      await supabase.storage.from(BUCKET).remove(paths.slice(i, i + 100));
    console.log(`  Supabase 이미지 ${paths.length}개 삭제`);
  }

  const ids = toDelete.map(p => p.id);
  const { count } = await prisma.product.deleteMany({ where: { id: { in: ids } } });
  console.log(`  DB 상품 ${count}개 삭제 완료`);
  await prisma.$disconnect();
}

const cmd = process.argv[2];
if (cmd === "check") main(false).catch(e => { console.error("❌", e); process.exit(1); });
else if (cmd === "delete") main(true).catch(e => { console.error("❌", e); process.exit(1); });
else console.log("사용법: npx tsx scripts/dedup-tbuc.ts [check|delete]");
