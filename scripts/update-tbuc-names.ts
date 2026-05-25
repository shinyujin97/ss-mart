/**
 * T-BUC 상품명 업데이트
 * tbuc-scraped.json 의 itId로 상세 페이지 재방문 → h2#sit_title 추출 → DB 반영
 *
 * 사용법:
 *   npx tsx scripts/update-tbuc-names.ts fetch   # sit_title 스크래핑 후 JSON 저장
 *   npx tsx scripts/update-tbuc-names.ts update  # DB 상품명 업데이트
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import * as fs from "fs";
import * as cheerio from "cheerio";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const SCRAPED_FILE = resolve(process.cwd(), "scripts/tbuc-scraped.json");
const BASE_URL = "https://www.tbuc.co.kr";

interface ScrapedProduct {
  itId: string;
  name: string;
  sitTitle?: string;   // h2#sit_title 텍스트
  [key: string]: unknown;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": BASE_URL },
  });
  return res.text();
}

function extractModelCode(name: string): string {
  const clean = name.replace(/^\(단예\)/, "").trim();
  const idx = clean.indexOf("/");
  return (idx > 0 ? clean.substring(0, idx) : clean).trim();
}

function normalize(code: string): string {
  return code.toUpperCase().replace(/[\s\-_()\[\]]/g, "");
}

// ── Phase 1: sit_title 스크래핑 ────────────────────────────────
async function runFetch() {
  if (!fs.existsSync(SCRAPED_FILE)) {
    console.error("❌ tbuc-scraped.json 없음. 먼저 sync-tbuc-images.ts scrape 실행하세요.");
    process.exit(1);
  }

  const scraped: ScrapedProduct[] = JSON.parse(fs.readFileSync(SCRAPED_FILE, "utf-8"));
  const needFetch = scraped.filter(p => !p.sitTitle);
  console.log(`📂 전체: ${scraped.length}개 | 제목 미수집: ${needFetch.length}개\n`);

  let done = 0;
  for (const p of scraped) {
    if (p.sitTitle) { done++; continue; }

    try {
      const html = await fetchHtml(`${BASE_URL}/shop/item.php?it_id=${p.itId}`);
      const $ = cheerio.load(html);
      const titleEl = $("#sit_title");
      // span.sound_only 제거 후 텍스트
      titleEl.find(".sound_only").remove();
      const title = titleEl.text().trim();
      p.sitTitle = title || p.name;
    } catch {
      p.sitTitle = p.name;
    }

    done++;
    if (done % 50 === 0) {
      process.stdout.write(`  ${done}/${scraped.length} `);
      fs.writeFileSync(SCRAPED_FILE, JSON.stringify(scraped, null, 2));
    }
    await new Promise(r => setTimeout(r, 200));
  }

  fs.writeFileSync(SCRAPED_FILE, JSON.stringify(scraped, null, 2));
  console.log(`\n✅ 완료: ${scraped.length}개 → ${SCRAPED_FILE}`);
  const sample = scraped.filter(p => p.sitTitle).slice(0, 5);
  sample.forEach(p => console.log(`  ${p.name} → ${p.sitTitle}`));
}

// ── Phase 2: DB 상품명 업데이트 ────────────────────────────────
async function runUpdate() {
  if (!fs.existsSync(SCRAPED_FILE)) {
    console.error("❌ tbuc-scraped.json 없음.");
    process.exit(1);
  }
  const scraped: ScrapedProduct[] = JSON.parse(fs.readFileSync(SCRAPED_FILE, "utf-8"));
  const hasTitles = scraped.filter(p => p.sitTitle).length;
  if (hasTitles === 0) {
    console.error("❌ sitTitle 없음. 먼저 fetch 실행하세요.");
    process.exit(1);
  }

  const scrapedMap = new Map<string, ScrapedProduct>();
  for (const p of scraped) scrapedMap.set(normalize(p.name), p);

  const adapter = new PrismaPg(process.env.DATABASE_URL!);
  const prisma = new PrismaClient({ adapter });

  const brand = await prisma.brand.findFirstOrThrow({ where: { slug: "tbuc" } });
  const dbProducts = await prisma.product.findMany({ where: { brandId: brand.id } });
  console.log(`📦 DB T-BUC 상품: ${dbProducts.length}개\n`);

  let updated = 0;
  let skipped = 0;

  for (const dbProd of dbProducts) {
    const code = extractModelCode(dbProd.name);
    const normDb = normalize(code);

    let found = scrapedMap.get(normDb);
    if (!found) {
      for (const [key, val] of scrapedMap) {
        if (normDb.startsWith(key) || key.startsWith(normDb)) { found = val; break; }
      }
    }
    if (!found || !found.sitTitle) { skipped++; continue; }

    const newName = found.sitTitle;
    if (newName === dbProd.name) { skipped++; continue; }

    await prisma.product.update({
      where: { id: dbProd.id },
      data: { name: newName },
    });
    updated++;
    if (updated <= 10) console.log(`  ${code} → ${newName}`);
  }

  console.log(`\n✅ 완료: 업데이트 ${updated}개 / 스킵 ${skipped}개`);
  await prisma.$disconnect();
}

const cmd = process.argv[2];
if (cmd === "fetch") runFetch().catch(e => { console.error("❌", e); process.exit(1); });
else if (cmd === "update") runUpdate().catch(e => { console.error("❌", e); process.exit(1); });
else {
  console.log("사용법:");
  console.log("  npx tsx scripts/update-tbuc-names.ts fetch   # sit_title 스크래핑");
  console.log("  npx tsx scripts/update-tbuc-names.ts update  # DB 상품명 업데이트");
}
