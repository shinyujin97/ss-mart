/**
 * T-BUC 360도 이미지 제거
 * 스크래핑 데이터 기준으로 360도 이미지 위치를 확인해 Supabase + DB에서 삭제
 *
 * 사용법:
 *   npx tsx scripts/remove-360-images.ts check   # 삭제 예정 목록
 *   npx tsx scripts/remove-360-images.ts delete  # 실제 삭제
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import * as fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const SCRAPED_FILE = resolve(process.cwd(), "scripts/tbuc-scraped.json");
const BUCKET = "products";

function normalize(s: string) { return s.toUpperCase().replace(/[\s\-_()\[\]\/]/g, ""); }

async function main(doDelete: boolean) {
  const scraped: any[] = JSON.parse(fs.readFileSync(SCRAPED_FILE, "utf-8"));

  // 이름 → 스크래핑 데이터 맵
  const scrapedMap = new Map<string, any>();
  for (const p of scraped) scrapedMap.set(normalize(p.name), p);

  const adapter = new PrismaPg(process.env.DATABASE_URL!);
  const prisma = new PrismaClient({ adapter });

  const brand = await prisma.brand.findFirstOrThrow({ where: { slug: "tbuc" } });
  const products = await prisma.product.findMany({
    where: { brandId: brand.id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });

  const toDelete: { id: string; url: string; productName: string; sortOrder: number }[] = [];

  for (const prod of products) {
    const norm = normalize(prod.name);
    let sp = scrapedMap.get(norm);
    if (!sp) {
      for (const [k, v] of scrapedMap) {
        if (norm.startsWith(k) || k.startsWith(norm)) { sp = v; break; }
      }
    }
    if (!sp) continue;

    // 원본 갤러리 URL 순서 재구성
    const legacyDetail: string[] = sp.detailImageUrls ?? [];
    const galleryUrls: string[] = [
      ...(sp.galleryImageUrls ?? (sp.mainImageUrl ? [sp.mainImageUrl] : [])),
      ...legacyDetail.filter((u: string) => u.includes("/data/item/")),
    ];

    // 각 sortOrder에 대응하는 원본 URL에서 360 여부 판단
    for (let i = 0; i < galleryUrls.length; i++) {
      const origUrl = galleryUrls[i];
      if (!origUrl.includes("360")) continue;

      // DB에서 해당 sortOrder의 이미지 찾기
      const dbImg = prod.images.find(img => img.sortOrder === i);
      if (!dbImg) continue;

      toDelete.push({
        id: dbImg.id,
        url: dbImg.url,
        productName: prod.name,
        sortOrder: i,
      });
    }
  }

  console.log(`삭제 예정: ${toDelete.length}개\n`);
  toDelete.forEach(img => console.log(`  ${img.productName} [sortOrder:${img.sortOrder}] → ${img.url.slice(-50)}`));

  if (!doDelete) {
    console.log("\n실제 삭제: npx tsx scripts/remove-360-images.ts delete");
    await prisma.$disconnect();
    return;
  }

  // Supabase 삭제
  const anyImg = await prisma.productImage.findFirst({ where: { product: { brandId: brand.id } } });
  const supabaseUrl = anyImg ? new URL(anyImg.url).origin : process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!.trim());

  const paths = toDelete.map(img => {
    try { return new URL(img.url).pathname.split(`/public/${BUCKET}/`)[1]; } catch { return null; }
  }).filter((p): p is string => !!p);

  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths);
    console.log(`\nSupabase ${paths.length}개 삭제`);
  }

  const ids = toDelete.map(img => img.id);
  const { count } = await prisma.productImage.deleteMany({ where: { id: { in: ids } } });
  console.log(`DB ${count}개 삭제 완료`);

  await prisma.$disconnect();
}

const cmd = process.argv[2];
if (cmd === "check") main(false).catch(e => { console.error("❌", e); process.exit(1); });
else if (cmd === "delete") main(true).catch(e => { console.error("❌", e); process.exit(1); });
else console.log("사용법: npx tsx scripts/remove-360-images.ts [check|delete]");
