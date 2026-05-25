/**
 * 일터루 (ILTERU) 이미지 동기화 — buyflex.co.kr
 *
 * 사용법:
 *   npx tsx scripts/sync-ilteru-images.ts scrape   # 1단계: 스크래핑
 *   npx tsx scripts/sync-ilteru-images.ts match    # 2단계: 매칭 확인
 *   npx tsx scripts/sync-ilteru-images.ts update   # 3단계: 이미지 교체 + 이름/상세 업데이트
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

const SCRAPED_FILE = resolve(process.cwd(), "scripts/ilteru-scraped.json");
const BASE_URL = "https://buyflex.co.kr";
const CATEGORY_URL = `${BASE_URL}/category/%EC%9D%BC%ED%84%B0%EB%A3%A8/92/`;
const CDN = "https://ecimg.cafe24img.com";
const BUCKET = "products";

interface ScrapedProduct {
  productNo: string;     // buyflex 상품번호 (URL에서)
  slug: string;          // URL 슬러그
  siteName: string;      // H1 제목 (예: "일터루 ITW-907 동계 일체형 정비복...")
  modelCode: string;     // 추출 모델코드 (예: "ITW-907")
  galleryImageUrls: string[];   // product/big/ 이미지
  descImageUrls: string[];      // NNEditor/ 상세 이미지
}

// ── 유틸 ──────────────────────────────────────────────────────
function toAbsUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  return `${BASE_URL}${url}`;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Referer": BASE_URL,
      "Accept": "text/html,application/xhtml+xml",
    },
  });
  return res.text();
}

function extractModelCode(siteName: string): string {
  // "일터루 ITW-907 동계 ..." → "ITW-907"
  const name = siteName.replace(/^일터루\s*/i, "").trim();
  return name.split(/\s/)[0].trim();
}

function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/[\s\-_()\[\]\/]/g, "");
}

// ── Phase 1: 스크래핑 ──────────────────────────────────────────
async function scrapeDetailPage(productNo: string, slug: string): Promise<{
  siteName: string; modelCode: string; galleryImageUrls: string[]; descImageUrls: string[];
}> {
  const url = `${BASE_URL}/product/${slug}/${productNo}/category/92/display/1/`;
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  // 상품명 (H1)
  const siteName = $("h1").first().text().trim() ||
    $(".prdName, .goods_name, .product_name").first().text().trim();

  // 갤러리 이미지 — product/big/ 경로
  const galleryUrls: string[] = [];
  const seenGallery = new Set<string>();
  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || "";
    if (src.includes("/product/big/") || src.includes("/product/medium/")) {
      const u = toAbsUrl(src.replace("/medium/", "/big/")).split("?")[0];
      if (!seenGallery.has(u)) { seenGallery.add(u); galleryUrls.push(u); }
    }
  });

  // 상세 이미지 — #prdDetail 또는 .prdDetail 안의 이미지 (ec-data-src / data-src / src)
  const descUrls: string[] = [];
  const seenDesc = new Set<string>();
  const detailSection = $("#prdDetail, .prdDetail, #goods_detail, .goods-detail").first();
  const descTarget = detailSection.length ? detailSection : $("body");

  descTarget.find("img").each((_, el) => {
    const src = $(el).attr("ec-data-src") || $(el).attr("data-src") || $(el).attr("src") || "";
    if (!src) return;
    // 전체 레이아웃 배너 제외
    if (src.includes("category/logo") || src.includes("v2_53894b7179ce")) return;
    // 공용 레이아웃 이미지 제외 (상품 이미지 아닌 것)
    if (src.includes("/skin/") || src.includes("/layout/")) return;
    const u = toAbsUrl(src).split("?")[0];
    if (u && !seenDesc.has(u)) { seenDesc.add(u); descUrls.push(u); }
  });

  return {
    siteName,
    modelCode: extractModelCode(siteName),
    galleryImageUrls: galleryUrls,
    descImageUrls: descUrls,
  };
}

async function runScrape() {
  console.log("🕷️  일터루 buyflex 스크래핑 시작...\n");

  const existing: Map<string, ScrapedProduct> = new Map();
  if (fs.existsSync(SCRAPED_FILE)) {
    const arr: ScrapedProduct[] = JSON.parse(fs.readFileSync(SCRAPED_FILE, "utf-8"));
    arr.forEach(p => existing.set(p.productNo, p));
    console.log(`  기존 데이터 ${existing.size}개 로드\n`);
  }

  const allProducts: ScrapedProduct[] = [...existing.values()];
  const seenNos = new Set(allProducts.map(p => p.productNo));

  let page = 1;
  while (true) {
    const html = await fetchHtml(`${CATEGORY_URL}?page=${page}`);
    const $ = cheerio.load(html);

    // 상품 링크 수집 — /product/{slug}/{no}/
    const links: { slug: string; productNo: string }[] = [];
    $("a[href*='/product/']").each((_, el) => {
      const href = $(el).attr("href") || "";
      const m = href.match(/\/product\/([^/]+)\/(\d+)\//);
      if (m && m[1] !== "recent_view_product") {
        const obj = { slug: m[1], productNo: m[2] };
        if (!links.find(l => l.productNo === obj.productNo)) links.push(obj);
      }
    });

    if (links.length === 0) break;
    process.stdout.write(`  page ${page}: ${links.length}개 `);

    for (const link of links) {
      if (seenNos.has(link.productNo)) { process.stdout.write("."); continue; }
      seenNos.add(link.productNo);

      await new Promise(r => setTimeout(r, 300));
      const detail = await scrapeDetailPage(link.productNo, link.slug);
      allProducts.push({
        productNo: link.productNo,
        slug: link.slug,
        ...detail,
      });
      process.stdout.write("*");

      if (allProducts.length % 50 === 0)
        fs.writeFileSync(SCRAPED_FILE, JSON.stringify(allProducts, null, 2));
    }

    console.log(` (누적 ${allProducts.length}개)`);

    // 다음 페이지 있는지
    const hasNext = $(`a[href*='page=${page + 1}']`).length > 0;
    if (!hasNext) break;
    page++;
    await new Promise(r => setTimeout(r, 400));
  }

  fs.writeFileSync(SCRAPED_FILE, JSON.stringify(allProducts, null, 2));
  console.log(`\n✅ 완료: ${allProducts.length}개 → ${SCRAPED_FILE}`);
}

// ── Phase 2/3: 매칭 + 업데이트 ────────────────────────────────
function extractDbModelCode(name: string): string {
  // "IS-01/상의/..." → "IS-01"
  // "일터루 IS-21 근무..." → "IS-21" (already updated by previous run)
  let clean = name.replace(/^\(단예\)/, "").trim();
  clean = clean.replace(/^일터루\s*/i, "").trim();
  if (clean.includes("/")) return clean.split("/")[0].trim();
  return clean.split(/\s/)[0].trim();
}

async function runMatchOrUpdate(doUpdate: boolean) {
  if (!fs.existsSync(SCRAPED_FILE)) {
    console.error("❌ ilteru-scraped.json 없음. 먼저 scrape 실행하세요.");
    process.exit(1);
  }

  const scraped: ScrapedProduct[] = JSON.parse(fs.readFileSync(SCRAPED_FILE, "utf-8"));
  console.log(`📂 스크래핑 데이터: ${scraped.length}개`);

  // 정규화 코드 → 스크래핑 상품
  const scrapedMap = new Map<string, ScrapedProduct>();
  for (const p of scraped) scrapedMap.set(normalizeCode(p.modelCode), p);

  const adapter = new PrismaPg(process.env.DATABASE_URL!);
  const prisma = new PrismaClient({ adapter });

  const brand = await prisma.brand.findFirstOrThrow({ where: { slug: "ilteru" } });
  const dbProducts = await prisma.product.findMany({
    where: { brandId: brand.id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  console.log(`📦 DB 일터루 상품: ${dbProducts.length}개\n`);

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
    const code = extractDbModelCode(dbProd.name);
    const normDb = normalizeCode(code);

    let found = scrapedMap.get(normDb);
    if (!found) {
      for (const [key, val] of scrapedMap) {
        if (normDb.startsWith(key) || key.startsWith(normDb)) { found = val; break; }
      }
    }

    if (!found) { unmatchedIds.push(dbProd.id); continue; }
    matchedIds.push(dbProd.id);
    if (!doUpdate) continue;

    // ── 이름 업데이트 ──
    if (found.siteName && found.siteName !== dbProd.name) {
      await prisma.product.update({ where: { id: dbProd.id }, data: { name: found.siteName } });
    }

    // ── 갤러리 이미지 교체 ──
    const galleryUrls = found.galleryImageUrls.filter(Boolean);
    if (galleryUrls.length > 0) {
      // 기존 삭제
      for (const img of dbProd.images) {
        try {
          const path = new URL(img.url).pathname.split(`/public/${BUCKET}/`)[1];
          if (path) await supabase!.storage.from(BUCKET).remove([path]);
        } catch {}
      }
      await prisma.productImage.deleteMany({ where: { productId: dbProd.id } });

      // 신규 업로드
      for (let i = 0; i < galleryUrls.length; i++) {
        const imgUrl = galleryUrls[i];
        try {
          const res = await fetch(imgUrl, { headers: { "User-Agent": "Mozilla/5.0", "Referer": BASE_URL } });
          if (!res.ok) continue;
          const buf = Buffer.from(await res.arrayBuffer());
          const ext = imgUrl.split(".").pop()?.toLowerCase() ?? "jpg";
          const filename = `ilteru/${dbProd.id}_${i}.${ext}`;
          const { error } = await supabase!.storage.from(BUCKET).upload(filename, buf, {
            contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
            upsert: true,
          });
          if (error) { console.log(`  ⚠️  업로드 실패: ${filename}`); continue; }
          const { data: { publicUrl } } = supabase!.storage.from(BUCKET).getPublicUrl(filename);
          await prisma.productImage.create({
            data: { productId: dbProd.id, url: publicUrl, isMain: i === 0, sortOrder: i },
          });
        } catch (e: any) { console.log(`  ⚠️  ${code} 갤러리 ${i}: ${e.message}`); }
        await new Promise(r => setTimeout(r, 80));
      }
    }

    // ── 상세 이미지 → description ──
    const descUrls = found.descImageUrls.filter(Boolean);
    if (descUrls.length > 0) {
      const descHtml = descUrls
        .map(u => `<img src="${u}" alt="${found!.modelCode} 상세" style="width:100%;max-width:860px;display:block;" />`)
        .join("\n");
      await prisma.product.update({ where: { id: dbProd.id }, data: { description: descHtml } });
    }
  }

  console.log(`📊 결과:`);
  console.log(`  매칭 성공: ${matchedIds.length}개`);
  console.log(`  미매칭(DB에만 있음): ${unmatchedIds.length}개`);

  if (!doUpdate) {
    console.log(`\n실제 업데이트: npx tsx scripts/sync-ilteru-images.ts update`);
    await prisma.$disconnect();
    return;
  }

  console.log(`\n✅ 모든 작업 완료!`);
  console.log(`  업데이트: ${matchedIds.length}개`);
  await prisma.$disconnect();
}

const cmd = process.argv[2];
if (cmd === "scrape") runScrape().catch(e => { console.error("❌", e); process.exit(1); });
else if (cmd === "match") runMatchOrUpdate(false).catch(e => { console.error("❌", e); process.exit(1); });
else if (cmd === "update") runMatchOrUpdate(true).catch(e => { console.error("❌", e); process.exit(1); });
else {
  console.log("사용법:");
  console.log("  npx tsx scripts/sync-ilteru-images.ts scrape   # buyflex 스크래핑");
  console.log("  npx tsx scripts/sync-ilteru-images.ts match    # 매칭 확인 (dry-run)");
  console.log("  npx tsx scripts/sync-ilteru-images.ts update   # 이미지/이름/상세 업데이트");
}
