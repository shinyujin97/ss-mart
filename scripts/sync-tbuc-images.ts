/**
 * T-BUC 이미지 동기화 스크립트
 *
 * 사용법:
 *   npx tsx scripts/sync-tbuc-images.ts scrape   # 1단계: 상세페이지까지 스크래핑
 *   npx tsx scripts/sync-tbuc-images.ts match    # 2단계: 매칭 확인 (dry-run)
 *   npx tsx scripts/sync-tbuc-images.ts update   # 3단계: 이미지 교체 + 단종 상품 삭제
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

const CATEGORIES = [
  { ca_id: "1010", label: "봄여름/점퍼" },
  { ca_id: "1020", label: "봄여름/상하작업복" },
  { ca_id: "1030", label: "봄여름/제전복" },
  { ca_id: "1040", label: "봄여름/정비복" },
  { ca_id: "1050", label: "봄여름/경비복" },
  { ca_id: "1060", label: "봄여름/조끼" },
  { ca_id: "1070", label: "봄여름/셔츠티셔츠" },
  { ca_id: "1080", label: "봄여름/바지" },
  { ca_id: "2010", label: "가을겨울/점퍼" },
  { ca_id: "2020", label: "가을겨울/파카" },
  { ca_id: "2030", label: "가을겨울/상하작업복" },
  { ca_id: "2040", label: "가을겨울/정비복" },
  { ca_id: "2050", label: "가을겨울/경비복" },
  { ca_id: "2060", label: "가을겨울/조끼" },
  { ca_id: "2070", label: "가을겨울/셔츠티셔츠" },
  { ca_id: "2080", label: "가을겨울/바지" },
  { ca_id: "3010", label: "사계절/상하작업복" },
  { ca_id: "3020", label: "사계절/제전복" },
  { ca_id: "3030", label: "사계절/방염복" },
  { ca_id: "3040", label: "사계절/바지" },
  { ca_id: "4010", label: "안전화/인젝션" },
  { ca_id: "4030", label: "안전화/6인치고급형" },
  { ca_id: "4040", label: "안전화/6인치기본형" },
  { ca_id: "4060", label: "안전화/4인치" },
  { ca_id: "4070", label: "안전화/다목적" },
  { ca_id: "4080", label: "안전화/방한화" },
];

interface ScrapedProduct {
  itId: string;
  name: string;
  galleryImageUrls: string[];  // data/item/_640x800 상품 갤러리 이미지 (여러 장)
  descImageUrls: string[];     // data/editor 상세 설명 이미지 (스펙 시트)
  category: string;
}

// ── 유틸 ──────────────────────────────────────────────────────
async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", "Referer": BASE_URL },
  });
  return res.text();
}

function cleanUrl(url: string): string {
  return url.split("?")[0];
}

function fullUrl(url: string): string {
  if (!url) return "";
  return url.startsWith("http") ? url : `${BASE_URL}${url}`;
}

// ── Phase 1: 스크래핑 ──────────────────────────────────────────
async function scrapeDetailPage(itId: string): Promise<{ mainImageUrl: string; detailImageUrls: string[] }> {
  const html = await fetchHtml(`${BASE_URL}/shop/item.php?it_id=${itId}`);
  const $ = cheerio.load(html);

  // 상품 이미지: data/item/{itId}/thumb-*_640x800.jpg (여러 장)
  const itemImages: string[] = [];
  const seen640 = new Set<string>();
  $("img").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (src.includes(`/data/item/${itId}/`) && src.includes("_640x800")) {
      const clean = cleanUrl(fullUrl(src));
      if (!seen640.has(clean)) { seen640.add(clean); itemImages.push(clean); }
    }
  });
  // 640x800 없으면 원본 이미지 시도
  if (itemImages.length === 0) {
    const seenOrig = new Set<string>();
    $("img").each((_, el) => {
      const src = $(el).attr("src") || "";
      if (src.includes(`/data/item/${itId}/`) && !src.includes("_80x80") && !src.includes("_70x70")) {
        const clean = cleanUrl(fullUrl(src));
        if (!seenOrig.has(clean)) { seenOrig.add(clean); itemImages.push(clean); }
      }
    });
  }

  // data/editor 상세 설명 이미지 (스펙 시트)
  const descImageUrls: string[] = [];
  $("img").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (src.includes("/data/editor/")) {
      const clean = cleanUrl(fullUrl(src));
      if (!descImageUrls.includes(clean)) descImageUrls.push(clean);
    }
  });

  return { galleryImageUrls: itemImages, descImageUrls };
}

async function getMaxPage(caId: string): Promise<number> {
  const html = await fetchHtml(`${BASE_URL}/shop/list.php?ca_id=${caId}`);
  const $ = cheerio.load(html);
  let maxPage = 1;
  $("a[href*='page=']").each((_, el) => {
    const match = ($(el).attr("href") || "").match(/page=(\d+)/);
    if (match) maxPage = Math.max(maxPage, parseInt(match[1]));
  });
  return maxPage;
}

async function scrapeListPage(caId: string, page: number): Promise<Array<{ itId: string; name: string; thumbUrl: string }>> {
  const html = await fetchHtml(`${BASE_URL}/shop/list.php?ca_id=${caId}&page=${page}`);
  const $ = cheerio.load(html);
  const items: Array<{ itId: string; name: string; thumbUrl: string }> = [];

  $("a[href*='item.php?it_id=']").each((_, el) => {
    const href = $(el).attr("href") || "";
    const match = href.match(/it_id=(\d+)/);
    if (!match) return;
    const itId = match[1];
    const thumbUrl = cleanUrl(fullUrl($(el).find("img").first().attr("src") || ""));
    const name = $(el).find("p.tit").first().text().trim();
    if (name) items.push({ itId, name, thumbUrl });
  });

  return items;
}

async function runScrape() {
  console.log("🕷️  T-BUC 스크래핑 시작 (상세 이미지 포함)...\n");

  // 기존 파일 있으면 로드 (재시작 지원)
  const existing: Map<string, ScrapedProduct> = new Map();
  if (fs.existsSync(SCRAPED_FILE)) {
    const arr: ScrapedProduct[] = JSON.parse(fs.readFileSync(SCRAPED_FILE, "utf-8"));
    arr.forEach(p => existing.set(p.itId, p));
    console.log(`  기존 데이터 ${existing.size}개 로드\n`);
  }

  const allProducts: ScrapedProduct[] = [...existing.values()];
  const seen = new Set(allProducts.map(p => p.itId));

  for (const cat of CATEGORIES) {
    const maxPage = await getMaxPage(cat.ca_id);
    process.stdout.write(`  [${cat.label}] ${maxPage}p `);

    for (let page = 1; page <= maxPage; page++) {
      const listItems = await scrapeListPage(cat.ca_id, page);

      for (const item of listItems) {
        if (seen.has(item.itId)) { process.stdout.write("."); continue; }
        seen.add(item.itId);

        await new Promise(r => setTimeout(r, 250));
        const { galleryImageUrls, descImageUrls } = await scrapeDetailPage(item.itId);

        allProducts.push({
          itId: item.itId,
          name: item.name,
          galleryImageUrls: galleryImageUrls.length > 0 ? galleryImageUrls : [item.thumbUrl],
          descImageUrls,
          category: cat.label,
        });
        process.stdout.write("*");

        // 100개마다 중간 저장
        if (allProducts.length % 100 === 0) {
          fs.writeFileSync(SCRAPED_FILE, JSON.stringify(allProducts, null, 2));
        }
      }
      await new Promise(r => setTimeout(r, 300));
    }
    console.log(` (누적 ${allProducts.length}개)`);
  }

  fs.writeFileSync(SCRAPED_FILE, JSON.stringify(allProducts, null, 2));
  console.log(`\n✅ 완료: ${allProducts.length}개 → ${SCRAPED_FILE}`);
}

// ── Phase 2/3: 매칭 + 업데이트 ────────────────────────────────
function extractModelCode(name: string): string {
  const clean = name.replace(/^\(단예\)/, "").trim();
  const idx = clean.indexOf("/");
  return (idx > 0 ? clean.substring(0, idx) : clean).trim();
}

function normalize(code: string): string {
  return code.toUpperCase().replace(/[\s\-_()\[\]]/g, "");
}

async function runMatchOrUpdate(doUpdate: boolean) {
  if (!fs.existsSync(SCRAPED_FILE)) {
    console.error("❌ tbuc-scraped.json 없음. 먼저 scrape 실행하세요.");
    process.exit(1);
  }

  const scraped: ScrapedProduct[] = JSON.parse(fs.readFileSync(SCRAPED_FILE, "utf-8"));
  console.log(`📂 스크래핑 데이터: ${scraped.length}개`);

  const scrapedMap = new Map<string, ScrapedProduct>();
  for (const p of scraped) scrapedMap.set(normalize(p.name), p);

  const adapter = new PrismaPg(process.env.DATABASE_URL!);
  const prisma = new PrismaClient({ adapter });

  const brand = await prisma.brand.findFirstOrThrow({ where: { slug: "tbuc" } });
  const dbProducts = await prisma.product.findMany({
    where: { brandId: brand.id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  console.log(`📦 DB T-BUC 상품: ${dbProducts.length}개\n`);

  // Supabase
  let supabase: ReturnType<typeof createClient> | null = null;
  if (doUpdate) {
    const anyImg = await prisma.productImage.findFirst({ where: { product: { brandId: brand.id } } });
    const supabaseUrl = anyImg
      ? new URL(anyImg.url).origin
      : process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
    supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!.trim());
  }

  const matchedIds: string[] = [];
  const unmatchedIds: string[] = [];

  for (const dbProd of dbProducts) {
    const code = extractModelCode(dbProd.name);
    const normDb = normalize(code);

    let found = scrapedMap.get(normDb);
    if (!found) {
      for (const [key, val] of scrapedMap) {
        if (normDb.startsWith(key) || key.startsWith(normDb)) { found = val; break; }
      }
    }

    if (!found) { unmatchedIds.push(dbProd.id); continue; }
    matchedIds.push(dbProd.id);
    if (!doUpdate) continue;

    // ── 갤러리 이미지 교체 ─────────────────────────────────────
    // 구 형식(mainImageUrl + detailImageUrls) 및 신 형식(galleryImageUrls) 모두 지원
    const legacyDetail = (found as any).detailImageUrls as string[] | undefined;
    const galleryUrls = [
      ...(found.galleryImageUrls ?? ((found as any).mainImageUrl ? [(found as any).mainImageUrl as string] : [])),
      ...(legacyDetail?.filter(u => u.includes("/data/item/")) ?? []),
    ].filter(Boolean);

    // 기존 이미지 Supabase + DB 삭제
    for (const img of dbProd.images) {
      try {
        const pathMatch = new URL(img.url).pathname.split(`/public/${BUCKET}/`)[1];
        if (pathMatch) await supabase!.storage.from(BUCKET).remove([pathMatch]);
      } catch {}
    }
    await prisma.productImage.deleteMany({ where: { productId: dbProd.id } });

    // 갤러리 이미지 업로드 → ProductImage
    for (let i = 0; i < galleryUrls.length; i++) {
      const imgUrl = galleryUrls[i];
      try {
        const res = await fetch(imgUrl, { headers: { "User-Agent": "Mozilla/5.0", "Referer": BASE_URL } });
        if (!res.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        const ext = imgUrl.split(".").pop()?.toLowerCase() ?? "jpg";
        const filename = `tbuc/${dbProd.id}_${i}.${ext}`;

        const { error } = await supabase!.storage.from(BUCKET).upload(filename, buf, {
          contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
          upsert: true,
        });
        if (error) { console.log(`  ⚠️  갤러리 업로드 실패: ${filename}`); continue; }

        const { data: { publicUrl } } = supabase!.storage.from(BUCKET).getPublicUrl(filename);
        await prisma.productImage.create({
          data: { productId: dbProd.id, url: publicUrl, isMain: i === 0, sortOrder: i },
        });
      } catch (e: any) {
        console.log(`  ⚠️  ${code} 갤러리 ${i}: ${e.message}`);
      }
      await new Promise(r => setTimeout(r, 100));
    }

    // ── 상세 설명 이미지 → product.description에 HTML로 저장 ──
    const descUrls = [
      ...(found.descImageUrls ?? []),
      ...(legacyDetail?.filter(u => u.includes("/data/editor/")) ?? []),
    ].filter(Boolean);
    if (descUrls.length > 0) {
      const descHtml = descUrls
        .map(url => `<img src="${url}" alt="${code} 상세" style="width:100%;max-width:860px;display:block;" />`)
        .join("\n");
      await prisma.product.update({
        where: { id: dbProd.id },
        data: { description: descHtml },
      });
    }
  }

  console.log(`📊 결과:`);
  console.log(`  매칭 성공: ${matchedIds.length}개`);
  console.log(`  단종(미매칭): ${unmatchedIds.length}개`);

  if (!doUpdate) {
    console.log(`\n실제 업데이트: npx tsx scripts/sync-tbuc-images.ts update`);
    await prisma.$disconnect();
    return;
  }

  // ── 단종 상품 삭제 ─────────────────────────────────────────
  console.log(`\n단종 상품 ${unmatchedIds.length}개 삭제 중...`);
  // 이미지 Supabase 삭제
  const oldImgs = await prisma.productImage.findMany({ where: { productId: { in: unmatchedIds } } });
  const paths = oldImgs.map(img => {
    try { return new URL(img.url).pathname.split(`/public/${BUCKET}/`)[1]; } catch { return null; }
  }).filter(Boolean) as string[];
  if (paths.length > 0) {
    for (let i = 0; i < paths.length; i += 100)
      await supabase!.storage.from(BUCKET).remove(paths.slice(i, i + 100));
  }
  const { count: delCount } = await prisma.product.deleteMany({ where: { id: { in: unmatchedIds } } });
  console.log(`  삭제 완료: ${delCount}개`);

  console.log(`\n✅ 모든 작업 완료!`);
  console.log(`  이미지 업데이트: ${matchedIds.length}개`);
  console.log(`  단종 삭제: ${delCount}개`);
  await prisma.$disconnect();
}

// ── Main ──────────────────────────────────────────────────────
const cmd = process.argv[2];
if (cmd === "scrape") runScrape().catch(e => { console.error("❌", e); process.exit(1); });
else if (cmd === "match") runMatchOrUpdate(false).catch(e => { console.error("❌", e); process.exit(1); });
else if (cmd === "update") runMatchOrUpdate(true).catch(e => { console.error("❌", e); process.exit(1); });
else {
  console.log("사용법:");
  console.log("  npx tsx scripts/sync-tbuc-images.ts scrape   # 상세 이미지 포함 스크래핑");
  console.log("  npx tsx scripts/sync-tbuc-images.ts match    # 매칭 확인");
  console.log("  npx tsx scripts/sync-tbuc-images.ts update   # 이미지 교체 + 단종 삭제");
}
