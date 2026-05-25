/**
 * T-BUC 상세 이미지 수정 — /tbuc/{MODEL}.jpg 패턴
 * 스크래퍼가 /data/editor/ 만 찾고 /tbuc/ 경로를 놓친 것 보완
 *
 * 사용법: npx tsx scripts/fix-desc-tbuc-path.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const BASE_URL = "https://www.tbuc.co.kr";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

function extractModelCode(name: string): string {
  // "TB-357" or "TL-301J/P(BK) / 경량패딩상하복" → "TL-301J" (첫 토큰)
  return name.split(/[\s\/]/)[0].trim();
}

async function headOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0" } });
    return res.ok;
  } catch { return false; }
}

async function main() {
  const brand = await prisma.brand.findFirstOrThrow({ where: { slug: "tbuc" } });
  const noDesc = await prisma.product.findMany({
    where: { brandId: brand.id, description: null },
    orderBy: { name: "asc" },
  });
  console.log(`상세 없는 상품: ${noDesc.length}개\n`);

  let updated = 0;
  let missing = 0;

  for (const prod of noDesc) {
    const model = extractModelCode(prod.name);

    // /tbuc/{MODEL}.jpg 시도
    const candidates = [
      `${BASE_URL}/tbuc/${model}.jpg`,
      `${BASE_URL}/tbuc/${model}.JPG`,
      `${BASE_URL}/tbuc/${model}.png`,
    ];

    let found: string | null = null;
    for (const url of candidates) {
      if (await headOk(url)) { found = url; break; }
    }

    if (!found) {
      // HTML 파싱으로 /tbuc/ 경로 이미지 직접 찾기
      try {
        const html = await fetch(`${BASE_URL}/shop/item.php?it_id=` + (await findItId(prod.name)), {
          headers: { "User-Agent": "Mozilla/5.0", "Referer": BASE_URL },
        }).then(r => r.text());
        const m = html.match(/src=["'](https:\/\/www\.tbuc\.co\.kr\/tbuc\/[^"']+)["']/);
        if (m) found = m[1];
      } catch {}
    }

    if (found) {
      const descHtml = `<img src="${found}" alt="${model} 상세" style="width:100%;max-width:860px;display:block;" />`;
      await prisma.product.update({ where: { id: prod.id }, data: { description: descHtml } });
      console.log(`✅ ${prod.name} → ${found}`);
      updated++;
    } else {
      missing++;
    }

    await new Promise(r => setTimeout(r, 150));
  }

  console.log(`\n✅ 완료: 업데이트 ${updated}개 / 이미지 없음 ${missing}개`);
  await prisma.$disconnect();
}

// 상품명으로 스크래핑 데이터에서 itId 찾기 (간소화)
import * as fs from "fs";
const SCRAPED_FILE = resolve(process.cwd(), "scripts/tbuc-scraped.json");

function normalize(s: string) { return s.toUpperCase().replace(/[\s\-_()\[\]\/]/g, ""); }

async function findItId(name: string): Promise<string> {
  const scraped: any[] = JSON.parse(fs.readFileSync(SCRAPED_FILE, "utf-8"));
  const norm = normalize(extractModelCode(name));
  let found = scraped.find(p => normalize(p.name) === norm);
  if (!found) found = scraped.find(p => normalize(p.name).startsWith(norm) || norm.startsWith(normalize(p.name)));
  return found?.itId ?? "";
}

main().catch(e => { console.error("❌", e); process.exit(1); });
