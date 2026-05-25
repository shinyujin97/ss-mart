import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import * as fs from "fs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const SCRAPED_FILE = resolve(process.cwd(), "scripts/tbuc-scraped.json");

function extractModelCode(name: string): string {
  const clean = name.replace(/^\(단예\)/, "").trim();
  const idx = clean.indexOf("/");
  return (idx > 0 ? clean.substring(0, idx) : clean).trim();
}
function normalize(code: string): string {
  return code.toUpperCase().replace(/[\s\-_()\[\]]/g, "");
}

async function main() {
  const scraped: any[] = JSON.parse(fs.readFileSync(SCRAPED_FILE, "utf-8"));
  const scrapedMap = new Map<string, any>();
  for (const p of scraped) scrapedMap.set(normalize(p.name), p);

  const brand = await prisma.brand.findFirstOrThrow({ where: { slug: "tbuc" } });
  const dbProducts = await prisma.product.findMany({
    where: { brandId: brand.id },
    include: { images: true },
    orderBy: { name: "asc" },
  });

  // 특정 상품 확인
  const targets = ["TB-751","TB-773","TB-774","TB-775","TB-1243","TB-342","TB-355","TB-356","TB-357","TB-101"];
  console.log("=== 지정 상품 확인 ===");
  for (const t of targets) {
    const match = dbProducts.find(p => p.name.includes(t));
    if (!match) { console.log(`  ${t}: DB에 없음`); continue; }
    const scrapedMatch = (() => {
      const code = extractModelCode(match.name);
      const norm = normalize(code);
      let f = scrapedMap.get(norm);
      if (!f) for (const [k, v] of scrapedMap) { if (norm.startsWith(k) || k.startsWith(norm)) { f = v; break; } }
      return f;
    })();
    console.log(`  ${t}: DB="${match.name}" | 이미지:${match.images.length} | 상세:${match.description ? "O" : "X"} | 스크래핑="${scrapedMatch?.name ?? "미매칭"}" 갤러리:${scrapedMatch?.galleryImageUrls?.length ?? scrapedMatch?.mainImageUrl ? 1 : 0} 상세:${scrapedMatch?.descImageUrls?.length ?? scrapedMatch?.detailImageUrls?.filter((u: string)=>u.includes('/data/editor/')).length ?? 0}`);
  }

  console.log("\n=== 이미지 없는 T-BUC 상품 ===");
  const noImg = dbProducts.filter(p => p.images.length === 0);
  console.log(`총 ${noImg.length}개`);
  noImg.forEach(p => console.log(`  ${p.name}`));

  console.log("\n=== 상세설명 없는 T-BUC 상품 ===");
  const noDesc = dbProducts.filter(p => !p.description);
  console.log(`총 ${noDesc.length}개 (전체 ${dbProducts.length}개 중)`);
  // 스크래핑 데이터에 editor 이미지가 있는데 DB에 없는 것
  let missingDesc = 0;
  for (const p of noDesc) {
    const code = extractModelCode(p.name);
    const norm = normalize(code);
    let f = scrapedMap.get(norm);
    if (!f) for (const [k, v] of scrapedMap) { if (norm.startsWith(k) || k.startsWith(norm)) { f = v; break; } }
    const editorImgs = f?.detailImageUrls?.filter((u: string) => u.includes('/data/editor/')) ?? f?.descImageUrls ?? [];
    if (editorImgs.length > 0) {
      missingDesc++;
      if (missingDesc <= 15) console.log(`  ${p.name} | 스크래핑 editor: ${editorImgs.length}장`);
    }
  }
  if (missingDesc > 15) console.log(`  ... 외 ${missingDesc - 15}개`);
  console.log(`  (스크래핑에 editor 이미지 있는데 DB 상세 없는 것: ${missingDesc}개)`);

  await prisma.$disconnect();
}
main().catch(console.error);
