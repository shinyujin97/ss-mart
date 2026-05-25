/**
 * 에이스유니폼 (ACE UNIFORM) 스크래핑 + DB 등록
 * http://www.aceuniform.co.kr
 *
 * 사용법:
 *   npx tsx scripts/sync-aceuniform.ts scrape   # 1단계: 스크래핑
 *   npx tsx scripts/sync-aceuniform.ts create   # 2단계: DB 등록 + 이미지 업로드
 *   npx tsx scripts/sync-aceuniform.ts delete   # 브랜드+상품 전체 삭제 (초기화)
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

const SCRAPED_FILE = resolve(process.cwd(), "scripts/aceuniform-scraped.json");
const BASE_URL = "http://www.aceuniform.co.kr";
const BUCKET = "products";
const BRAND_SLUG = "aceuniform";

const CATEGORIES: { ca_id: string; name: string }[] = [
  { ca_id: "1010", name: "춘하복" },
  { ca_id: "1020", name: "추동복" },
  { ca_id: "1030", name: "용접복" },
  { ca_id: "2010", name: "안전화-4인치" },
  { ca_id: "2020", name: "안전화-6인치" },
  { ca_id: "2030", name: "안전화-8인치" },
  { ca_id: "2040", name: "안전화-기능성" },
  { ca_id: "2050", name: "안전용품" },
];

interface ScrapedProduct {
  itId: string;
  name: string;
  category: string;
  imageUrls: string[];  // 600x600 thumb URLs
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Referer": BASE_URL,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const buf = await res.arrayBuffer();
  // EUC-KR 디코딩
  return new TextDecoder("euc-kr").decode(buf);
}

function toAbsUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${BASE_URL}${url}`;
}

function makeSlug(name: string, itId: string): string {
  return `ace-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${itId}`;
}

// ── Phase 1: 스크래핑 ──────────────────────────────────────────
async function scrapeDetailImages(itId: string): Promise<string[]> {
  const url = `${BASE_URL}/shop/item.php?it_id=${itId}`;
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const seen = new Set<string>();
  const imgs: string[] = [];

  // 600x600 이미지만 수집 (60x60 제외)
  $("img").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (src.includes("/data/item/") && src.includes("600x600")) {
      const u = toAbsUrl(src).split("?")[0];
      if (!seen.has(u)) { seen.add(u); imgs.push(u); }
    }
  });

  return imgs;
}

async function runScrape() {
  console.log("🕷️  에이스유니폼 스크래핑 시작...\n");

  const existing: Map<string, ScrapedProduct> = new Map();
  if (fs.existsSync(SCRAPED_FILE)) {
    const arr: ScrapedProduct[] = JSON.parse(fs.readFileSync(SCRAPED_FILE, "utf-8"));
    arr.forEach(p => existing.set(p.itId, p));
    console.log(`  기존 데이터 ${existing.size}개 로드\n`);
  }

  const allProducts: ScrapedProduct[] = [...existing.values()];
  const seenIds = new Set(allProducts.map(p => p.itId));

  for (const cat of CATEGORIES) {
    const url = `${BASE_URL}/shop/list.php?ca_id=${cat.ca_id}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const links: { itId: string; name: string }[] = [];
    $("li.sct_li").each((_, el) => {
      const href = $(el).find("a.sct_a").first().attr("href") || "";
      const m = href.match(/it_id=(\d+)/);
      if (!m) return;
      const itId = m[1];
      // 이름: sct_txt 텍스트 또는 img alt
      const name = $(el).find(".sct_txt a").text().trim() ||
        $(el).find("img").attr("alt")?.trim() || itId;
      if (!links.find(l => l.itId === itId)) links.push({ itId, name });
    });

    process.stdout.write(`  [${cat.name}] ${links.length}개 `);

    for (const link of links) {
      if (seenIds.has(link.itId)) { process.stdout.write("."); continue; }
      seenIds.add(link.itId);

      await new Promise(r => setTimeout(r, 250));
      try {
        const imageUrls = await scrapeDetailImages(link.itId);
        allProducts.push({ itId: link.itId, name: link.name, category: cat.name, imageUrls });
        process.stdout.write("*");
      } catch (e: any) {
        console.log(`\n  ⚠️  ${link.itId} 실패: ${e.message}`);
      }

      if (allProducts.length % 30 === 0)
        fs.writeFileSync(SCRAPED_FILE, JSON.stringify(allProducts, null, 2));
    }
    console.log(` (누적 ${allProducts.length}개)`);
    await new Promise(r => setTimeout(r, 300));
  }

  fs.writeFileSync(SCRAPED_FILE, JSON.stringify(allProducts, null, 2));
  const withImg = allProducts.filter(p => p.imageUrls.length > 0).length;
  console.log(`\n✅ 완료: ${allProducts.length}개 (이미지있음: ${withImg}개) → ${SCRAPED_FILE}`);
}

// ── Phase 2: DB 등록 + Supabase 업로드 ────────────────────────
async function runCreate() {
  if (!fs.existsSync(SCRAPED_FILE)) {
    console.error("❌ aceuniform-scraped.json 없음. 먼저 scrape 실행하세요.");
    process.exit(1);
  }

  const scraped: ScrapedProduct[] = JSON.parse(fs.readFileSync(SCRAPED_FILE, "utf-8"));
  console.log(`📂 스크래핑 데이터: ${scraped.length}개`);

  const adapter = new PrismaPg(process.env.DATABASE_URL!);
  const prisma = new PrismaClient({ adapter });

  // 브랜드 생성/확인
  let brand = await prisma.brand.findUnique({ where: { slug: BRAND_SLUG } });
  if (!brand) {
    brand = await prisma.brand.create({
      data: {
        slug: BRAND_SLUG,
        name: "ACE UNIFORM",
        nameKr: "에이스유니폼",
        isActive: true,
        sortOrder: 0,
      },
    });
    console.log(`✅ 브랜드 생성: ${brand.name}`);
  } else {
    console.log(`📌 기존 브랜드 사용: ${brand.name}`);
  }

  // Supabase 클라이언트 (기존 이미지 URL에서 origin 추출)
  const anyImg = await prisma.productImage.findFirst({ where: { url: { contains: "supabase.co" } } });
  if (!anyImg) { console.error("❌ Supabase URL 추출 실패 (기존 이미지 없음)"); process.exit(1); }
  const supabaseUrl = new URL(anyImg.url).origin;
  const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!.trim());

  let created = 0;
  let skipped = 0;

  for (const sp of scraped) {
    if (sp.imageUrls.length === 0) { skipped++; continue; }

    // 이미 등록된 상품인지 확인 (itId 기반 슬러그)
    const slug = makeSlug(sp.name, sp.itId);
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) { process.stdout.write("."); skipped++; continue; }

    // 상품 생성
    const product = await prisma.product.create({
      data: {
        slug,
        brandId: brand.id,
        name: sp.name,
        basePrice: 0,
        salePrice: 0,
        embroideryAvailable: true,
        bulkOrderAvailable: true,
        bulkMinQuantity: 100,
        status: "ACTIVE",
      },
    });

    // 이미지 업로드
    for (let i = 0; i < sp.imageUrls.length; i++) {
      const imgUrl = sp.imageUrls[i];
      try {
        const res = await fetch(imgUrl, {
          headers: { "User-Agent": "Mozilla/5.0", "Referer": BASE_URL },
        });
        if (!res.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        const ext = imgUrl.split(".").pop()?.toLowerCase() ?? "jpg";
        const filename = `aceuniform/${product.id}_${i}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(filename, buf, {
          contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
          upsert: true,
        });
        if (error) { console.log(`\n  ⚠️  업로드 실패: ${filename} - ${error.message}`); continue; }
        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename);
        await prisma.productImage.create({
          data: { productId: product.id, url: publicUrl, isMain: i === 0, sortOrder: i },
        });
      } catch (e: any) {
        console.log(`\n  ⚠️  ${sp.name} 이미지 ${i}: ${e.message}`);
      }
      await new Promise(r => setTimeout(r, 80));
    }

    process.stdout.write("*");
    created++;

    if (created % 20 === 0) console.log(` (${created}개 완료)`);
  }

  console.log(`\n\n✅ 완료!`);
  console.log(`  생성: ${created}개 | 건너뜀: ${skipped}개`);

  const total = await prisma.product.count({ where: { brandId: brand.id } });
  const imgTotal = await prisma.productImage.count({ where: { product: { brandId: brand.id } } });
  console.log(`  총 상품: ${total}개 | 총 이미지: ${imgTotal}개`);

  await prisma.$disconnect();
}

// ── 초기화 ────────────────────────────────────────────────────
async function runDelete() {
  const adapter = new PrismaPg(process.env.DATABASE_URL!);
  const prisma = new PrismaClient({ adapter });

  const brand = await prisma.brand.findUnique({ where: { slug: BRAND_SLUG } });
  if (!brand) { console.log("브랜드 없음"); await prisma.$disconnect(); return; }

  const imgs = await prisma.productImage.findMany({ where: { product: { brandId: brand.id } } });
  if (imgs.length > 0) {
    const supabaseUrl = new URL(imgs[0].url).origin;
    const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!.trim());
    const paths = imgs.map(i => { try { return new URL(i.url).pathname.split("/public/products/")[1]; } catch { return null; } }).filter(Boolean) as string[];
    for (let i = 0; i < paths.length; i += 50) await supabase.storage.from(BUCKET).remove(paths.slice(i, i + 50));
    console.log(`Supabase ${paths.length}개 삭제`);
  }

  const products = await prisma.product.findMany({ where: { brandId: brand.id }, select: { id: true } });
  await prisma.productImage.deleteMany({ where: { productId: { in: products.map(p => p.id) } } });
  await prisma.product.deleteMany({ where: { brandId: brand.id } });
  await prisma.brand.delete({ where: { slug: BRAND_SLUG } });
  console.log(`✅ 에이스유니폼 브랜드 + ${products.length}개 상품 삭제 완료`);

  await prisma.$disconnect();
}

const cmd = process.argv[2];
if (cmd === "scrape") runScrape().catch(e => { console.error("❌", e); process.exit(1); });
else if (cmd === "create") runCreate().catch(e => { console.error("❌", e); process.exit(1); });
else if (cmd === "delete") runDelete().catch(e => { console.error("❌", e); process.exit(1); });
else {
  console.log("사용법:");
  console.log("  npx tsx scripts/sync-aceuniform.ts scrape   # 스크래핑");
  console.log("  npx tsx scripts/sync-aceuniform.ts create   # DB 등록 + 이미지 업로드");
  console.log("  npx tsx scripts/sync-aceuniform.ts delete   # 전체 삭제 (초기화)");
}
