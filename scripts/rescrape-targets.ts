/**
 * 특정 T-BUC 상품 상세 이미지 재스크래핑 + DB 업데이트
 * 사용법: npx tsx scripts/rescrape-targets.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import * as fs from "fs";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const SCRAPED_FILE = resolve(process.cwd(), "scripts/tbuc-scraped.json");
const BASE_URL = "https://www.tbuc.co.kr";
const BUCKET = "products";

const TARGET_NAMES = ["TB-751","TB-773","TB-774","TB-775","TB-1243","TB-342","TB-355","TB-356","TB-357"];

interface ScrapedProduct {
  itId: string;
  name: string;
  [key: string]: unknown;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "Referer": BASE_URL } });
  return res.text();
}
function cleanUrl(url: string): string { return url.split("?")[0]; }
function fullUrl(url: string): string {
  return url.startsWith("http") ? url : `${BASE_URL}${url}`;
}

async function scrapeDetail(itId: string) {
  const html = await fetchHtml(`${BASE_URL}/shop/item.php?it_id=${itId}`);
  const $ = cheerio.load(html);

  const galleryUrls: string[] = [];
  const seen = new Set<string>();
  $("img").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (src.includes(`/data/item/${itId}/`) && src.includes("_640x800")) {
      const u = cleanUrl(fullUrl(src));
      if (!seen.has(u)) { seen.add(u); galleryUrls.push(u); }
    }
  });
  if (galleryUrls.length === 0) {
    $("img").each((_, el) => {
      const src = $(el).attr("src") || "";
      if (src.includes(`/data/item/${itId}/`) && !src.includes("_80x80") && !src.includes("_70x70")) {
        const u = cleanUrl(fullUrl(src));
        if (!seen.has(u)) { seen.add(u); galleryUrls.push(u); }
      }
    });
  }

  const descUrls: string[] = [];
  $("img").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (src.includes("/data/editor/")) {
      const u = cleanUrl(fullUrl(src));
      if (!descUrls.includes(u)) descUrls.push(u);
    }
  });

  return { galleryUrls, descUrls };
}

async function main() {
  const scraped: ScrapedProduct[] = JSON.parse(fs.readFileSync(SCRAPED_FILE, "utf-8"));
  const scrapedMap = new Map<string, ScrapedProduct>();
  for (const p of scraped) scrapedMap.set(p.name.toUpperCase().replace(/[\s\-_()\[\]]/g, ""), p);

  const adapter = new PrismaPg(process.env.DATABASE_URL!);
  const prisma = new PrismaClient({ adapter });

  const brand = await prisma.brand.findFirstOrThrow({ where: { slug: "tbuc" } });
  const anyImg = await prisma.productImage.findFirst({ where: { product: { brandId: brand.id } } });
  const supabaseUrl = anyImg ? new URL(anyImg.url).origin : process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!.trim());

  for (const targetName of TARGET_NAMES) {
    const norm = targetName.toUpperCase().replace(/[\s\-_()\[\]]/g, "");
    let sp = scrapedMap.get(norm);
    if (!sp) {
      for (const [k, v] of scrapedMap) {
        if (norm.startsWith(k) || k.startsWith(norm)) { sp = v; break; }
      }
    }
    if (!sp) { console.log(`⚠️  ${targetName}: 스크래핑 데이터 없음`); continue; }

    // DB 상품 (이름이 같은 첫번째 - 대표 1개)
    const dbProd = await prisma.product.findFirst({
      where: { brandId: brand.id, name: targetName },
      include: { images: true },
    });
    if (!dbProd) { console.log(`⚠️  ${targetName}: DB에 없음`); continue; }

    console.log(`\n🔍 ${targetName} (itId: ${sp.itId})`);
    const { galleryUrls, descUrls } = await scrapeDetail(sp.itId);
    console.log(`   갤러리: ${galleryUrls.length}장 | 상세: ${descUrls.length}장`);

    // 상세 이미지만 업데이트 (description이 없는 경우)
    if (descUrls.length > 0 && !dbProd.description) {
      const descHtml = descUrls
        .map(url => `<img src="${url}" alt="${targetName} 상세" style="width:100%;max-width:860px;display:block;" />`)
        .join("\n");
      await prisma.product.update({ where: { id: dbProd.id }, data: { description: descHtml } });
      console.log(`   ✅ 상세 이미지 ${descUrls.length}장 저장`);
    } else if (descUrls.length === 0) {
      console.log(`   ℹ️  T-BUC 사이트에 상세 이미지 없음`);
    } else {
      console.log(`   ℹ️  이미 상세 있음`);
    }

    await new Promise(r => setTimeout(r, 300));
  }

  // TB-101 중복 현황
  console.log("\n=== TB-101 중복 상품 ===");
  const tb101s = await prisma.product.findMany({
    where: { brandId: brand.id, name: "TB-101" },
    include: { images: { take: 1 } },
    orderBy: { createdAt: "asc" },
  });
  console.log(`총 ${tb101s.length}개`);
  // 대표 1개 제외하고 나머지 slug 출력
  if (tb101s.length > 1) {
    console.log("중복 목록 (대표 1개 제외):");
    tb101s.slice(1).forEach(p => console.log(`  [${p.id}] slug:${p.slug}`));
  }

  await prisma.$disconnect();
}
main().catch(console.error);
