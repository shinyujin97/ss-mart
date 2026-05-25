/**
 * 상세 이미지 없는 T-BUC 상품 재스크래핑 + 업데이트
 * 사용법:
 *   npx tsx scripts/rescrape-desc.ts check   # 재스크래핑 후 찾은 것만 출력
 *   npx tsx scripts/rescrape-desc.ts update  # DB 상세 업데이트
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

function normalize(code: string): string {
  return code.toUpperCase().replace(/[\s\-_()\[\]]/g, "");
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "Referer": BASE_URL } });
  return res.text();
}

async function main(doUpdate: boolean) {
  const scraped: any[] = JSON.parse(fs.readFileSync(SCRAPED_FILE, "utf-8"));
  const scrapedByName = new Map<string, any>();
  for (const p of scraped) scrapedByName.set(normalize(p.name), p);

  const adapter = new PrismaPg(process.env.DATABASE_URL!);
  const prisma = new PrismaClient({ adapter });

  const brand = await prisma.brand.findFirstOrThrow({ where: { slug: "tbuc" } });
  const noDesc = await prisma.product.findMany({
    where: { brandId: brand.id, description: null },
    orderBy: { name: "asc" },
  });
  console.log(`상세 없는 상품: ${noDesc.length}개 — T-BUC 재스크래핑 시작\n`);

  let found = 0;
  let truly_none = 0;

  for (const prod of noDesc) {
    const norm = normalize(prod.name);
    let sp = scrapedByName.get(norm);
    if (!sp) {
      for (const [k, v] of scrapedByName) {
        if (norm.startsWith(k) || k.startsWith(norm)) { sp = v; break; }
      }
    }
    if (!sp) { truly_none++; continue; }

    // 재스크래핑
    let descUrls: string[] = [];
    try {
      const html = await fetchHtml(`${BASE_URL}/shop/item.php?it_id=${sp.itId}`);
      const $ = cheerio.load(html);

      // data/editor 이미지
      $("img").each((_, el) => {
        const src = $(el).attr("src") || "";
        if (src.includes("/data/editor/")) {
          const u = (src.startsWith("http") ? src : `${BASE_URL}${src}`).split("?")[0];
          if (!descUrls.includes(u)) descUrls.push(u);
        }
      });

      // data/editor 없으면 sit_info 안 img 도 시도
      if (descUrls.length === 0) {
        const infoEl = $("#sit_info, .item_explan, .item_detail, [class*='detail']");
        infoEl.find("img").each((_, el) => {
          const src = $(el).attr("src") || "";
          if (src && !src.includes("_80x80") && !src.includes("_70x70")) {
            const u = (src.startsWith("http") ? src : `${BASE_URL}${src}`).split("?")[0];
            if (!descUrls.includes(u)) descUrls.push(u);
          }
        });
      }
    } catch { truly_none++; continue; }

    if (descUrls.length === 0) { truly_none++; continue; }

    found++;
    console.log(`✅ ${prod.name}: ${descUrls.length}장`);
    descUrls.forEach(u => console.log(`   ${u}`));

    if (doUpdate) {
      const html = descUrls
        .map(u => `<img src="${u}" alt="${prod.name} 상세" style="width:100%;max-width:860px;display:block;" />`)
        .join("\n");
      await prisma.product.update({ where: { id: prod.id }, data: { description: html } });
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n결과: 상세 발견 ${found}개 / 원본 없음 ${truly_none}개`);
  if (!doUpdate && found > 0) console.log("업데이트: npx tsx scripts/rescrape-desc.ts update");

  await prisma.$disconnect();
}

const cmd = process.argv[2];
if (cmd === "check") main(false).catch(e => { console.error("❌", e); process.exit(1); });
else if (cmd === "update") main(true).catch(e => { console.error("❌", e); process.exit(1); });
else console.log("사용법: npx tsx scripts/rescrape-desc.ts [check|update]");
