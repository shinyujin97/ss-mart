/**
 * 일터루 2026 춘하 카탈로그 등록 스크립트
 *
 * 1단계: 이미지 Supabase Storage 업로드
 *   npx tsx scripts/register-ilteru-catalog.ts upload
 *
 * 2단계: DB 상품 등록
 *   npx tsx scripts/register-ilteru-catalog.ts register
 *
 * 전체 한번에:
 *   npx tsx scripts/register-ilteru-catalog.ts all
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import * as fs from "fs";
import * as path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const IMAGES_DIR = "/mnt/c/Users/ssy66/Downloads/ilteru_2026_spring_summer";
const SCAN_FILE = resolve(process.cwd(), "scripts/ilteru-catalog-scan.json");
const URL_MAP_FILE = resolve(process.cwd(), "scripts/ilteru-catalog-image-urls.json");
const BUCKET = "products";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// ── 카테고리 ID 매핑 ──────────────────────────────────────────────
const CATEGORY_MAP: Record<string, string> = {
  "상의":       "cmofjwncd0001tdi5xiibm4ms",
  "하의":       "cmofjwnct0002tdi50fz8q675",
  "세트":       "cmofjwnd60003tdi5aqt39smo",
  "조끼":       "cmofjwndk0004tdi542ffqqjp",
  "안전화":     "cmofjwnfi0008tdi5c3ms0krs",
};

function getCategoryId(category: string): string {
  if (["점퍼", "셔츠", "티셔츠", "경비복"].includes(category)) return CATEGORY_MAP["상의"];
  if (["조끼", "특수조끼", "아이스조끼", "신호수조끼"].includes(category)) return CATEGORY_MAP["조끼"];
  if (["바지"].includes(category)) return CATEGORY_MAP["하의"];
  if (["작업복세트", "클린룸웨어", "정비복"].includes(category)) return CATEGORY_MAP["세트"];
  if (["안전화"].includes(category)) return CATEGORY_MAP["안전화"];
  return CATEGORY_MAP["상의"]; // fallback
}

// ── 색상 → HEX 근사치 ─────────────────────────────────────────────
const COLOR_HEX: Record<string, string> = {
  "DARK NAVY": "#1a2340", "NAVY": "#1f3060", "NAVY BLUE": "#1f3a7a",
  "BLUE GRAY": "#6b7fa3", "GRAY": "#808080", "CHARCOAL": "#36454f",
  "BLACK": "#111111", "WHITE": "#ffffff", "IVORY": "#fffff0",
  "BEIGE": "#f5f0e8", "KHAKI": "#8b7355", "OLIVE": "#6b7c5a",
  "ORANGE": "#ff6600", "RED": "#cc0000", "WINE": "#722f37",
  "YELLOW": "#ffd400", "GREEN": "#2d6e2d",
  "FLUORESCENCE": "#ccff00", "FLUORESCENCE YELLOW": "#ccff00",
  "FLUORESCENCE ORANGE": "#ff9900", "FLUORESCENCE GREEN": "#00ff80",
  "SILVER": "#c0c0c0", "LIGHT GRAY": "#d0d0d0",
  "BLUE": "#0055aa", "SKY BLUE": "#87ceeb",
  "BROWN": "#8b4513", "DARK BROWN": "#5c3317",
};

interface CatalogProduct {
  code: string;
  name: string;
  fabric: string;
  colors: string[];
  sizes: string[];
  sizeType: string;
  category: string;
}

interface CatalogPage {
  page: string;
  products: CatalogProduct[];
}

// ── 유틸 ─────────────────────────────────────────────────────────
function slug(code: string): string {
  return `ilteru-${code.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
}

// ── Phase 1: 이미지 업로드 ────────────────────────────────────────
async function uploadImages() {
  // Supabase URL은 기존 이미지에서 추출
  const anyImg = await prisma.productImage.findFirst({ select: { url: true } });
  if (!anyImg) throw new Error("DB에 이미지가 없습니다. Supabase URL을 확인할 수 없습니다.");
  const supabaseUrl = new URL(anyImg.url).origin;
  const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!.trim());

  const files = fs.readdirSync(IMAGES_DIR)
    .filter(f => /^0[0-9]{2}\.jpg$/i.test(f) && f !== "001.jpg")
    .sort();

  console.log(`이미지 ${files.length}장 업로드 시작...`);

  const urlMap: Record<string, string> = {};
  let done = 0, skipped = 0, failed = 0;

  for (let i = 0; i < files.length; i += 5) {
    const batch = files.slice(i, i + 5);
    await Promise.all(batch.map(async (file) => {
      const storagePath = `ilteru/catalog-2026-ss/${file}`;
      const localPath = path.join(IMAGES_DIR, file);
      const buf = fs.readFileSync(localPath);

      // 이미 존재 여부 확인
      const { data: existing } = await supabase.storage.from(BUCKET).list("ilteru/catalog-2026-ss", { search: file });
      if (existing && existing.some((f: any) => f.name === file)) {
        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
        urlMap[file] = publicUrl;
        skipped++;
        return;
      }

      const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buf, {
        contentType: "image/jpeg",
        upsert: true,
      });
      if (error) {
        console.error(`\n  ❌ ${file}: ${error.message}`);
        failed++;
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      urlMap[file] = publicUrl;
      done++;
    }));

    const pct = (((done + skipped + failed) / files.length) * 100).toFixed(1);
    process.stdout.write(`\r진행: ${pct}% | 업로드: ${done} | 스킵: ${skipped} | 실패: ${failed}`);
  }

  console.log(`\n\n완료! 업로드: ${done}, 스킵: ${skipped}, 실패: ${failed}`);
  fs.writeFileSync(URL_MAP_FILE, JSON.stringify(urlMap, null, 2));
  console.log(`URL 맵 저장: ${URL_MAP_FILE}`);
  return urlMap;
}

// ── Phase 2: DB 등록 ──────────────────────────────────────────────
async function registerProducts(urlMap: Record<string, string>) {
  const pages: CatalogPage[] = JSON.parse(fs.readFileSync(SCAN_FILE, "utf-8"));

  // ILTERU 브랜드 ID
  const brand = await prisma.brand.findFirstOrThrow({ where: { slug: "ilteru" } });

  // 기존 일터루 상품 슬러그 목록 (중복 방지)
  const existing = await prisma.product.findMany({
    where: { brandId: brand.id },
    select: { slug: true },
  });
  const existingSlugs = new Set(existing.map((p) => p.slug));

  // 유니크 코드 → 첫 번째 등장 페이지 기준으로 dedup
  const seenCodes = new Set<string>();
  const products: Array<{ page: string; product: CatalogProduct }> = [];

  for (const page of pages) {
    for (const prod of page.products) {
      if (!seenCodes.has(prod.code)) {
        seenCodes.add(prod.code);
        products.push({ page: page.page, product: prod });
      }
    }
  }

  // 같은 페이지에 여러 상품이 있는 페이지 목록
  const pageGroups: Record<string, string[]> = {};
  for (const page of pages) {
    if (page.products.length > 1) {
      pageGroups[page.page] = page.products.map((p) => p.code);
    }
  }

  console.log(`\n등록 대상: ${products.length}개 상품 (유니크 코드 기준)`);

  let created = 0, skipped = 0, failed = 0;

  for (const { page, product } of products) {
    const productSlug = slug(product.code);

    if (existingSlugs.has(productSlug)) {
      process.stdout.write(`\r  스킵 (이미 존재): ${product.code}                    `);
      skipped++;
      continue;
    }

    // 이미지 URL 결정 (파일명: 페이지번호.jpg)
    const imgKey = `${page}.jpg`;
    const imgUrl = urlMap[imgKey];
    if (!imgUrl) {
      console.log(`\n  ⚠️  ${product.code}: 이미지 URL 없음 (페이지 ${page})`);
      failed++;
      continue;
    }

    // 같은 페이지의 다른 상품들 (catalogPage 그룹핑용)
    const pageHasMultiple = pageGroups[page] && pageGroups[page].length > 1;

    try {
      await prisma.$transaction(async (tx) => {
        const created_product = await tx.product.create({
          data: {
            slug: productSlug,
            brandId: brand.id,
            name: `일터루 ${product.code} ${product.name}`,
            shortDescription: product.fabric,
            basePrice: 0,
            salePrice: 0,
            catalogPage: page,
            embroideryAvailable: !["안전화"].includes(product.category),
            bulkOrderAvailable: true,
            status: "ACTIVE",
            isNew: true,
          },
        });

        // 카테고리 연결
        const catId = getCategoryId(product.category);
        await tx.productCategory.create({
          data: { productId: created_product.id, categoryId: catId },
        });

        // 상품 이미지
        await tx.productImage.create({
          data: {
            productId: created_product.id,
            url: imgUrl,
            altText: `일터루 ${product.code} ${product.name}`,
            isMain: true,
            sortOrder: 0,
          },
        });

        // 상품 옵션 (색상 × 사이즈)
        const options = [];
        for (const color of product.colors) {
          for (const size of product.sizes) {
            options.push({
              productId: created_product.id,
              color,
              colorHex: COLOR_HEX[color] ?? null,
              size,
              sku: `${product.code}-${color.replace(/\s/g, "")}-${size}`.toUpperCase(),
              stockQuantity: 999,
              isActive: true,
            });
          }
        }
        if (options.length > 0) {
          await tx.productOption.createMany({ data: options });
        }
      });

      created++;
      process.stdout.write(`\r  [${created}/${products.length}] ${product.code} 등록 완료 (페이지 ${page}${pageHasMultiple ? ", 멀티상품" : ""})     `);
    } catch (e: any) {
      console.error(`\n  ❌ ${product.code}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n\n완료! 등록: ${created}, 스킵: ${skipped}, 실패: ${failed}`);
  console.log(`\n같은 페이지 복수상품 (드롭다운 대상): ${Object.keys(pageGroups).length}개 페이지`);
}

// ── 메인 ──────────────────────────────────────────────────────────
async function main() {
  const cmd = process.argv[2] ?? "all";

  try {
    if (cmd === "upload" || cmd === "all") {
      console.log("=== 1단계: 이미지 업로드 ===");
      await uploadImages();
    }

    if (cmd === "register" || cmd === "all") {
      console.log("\n=== 2단계: DB 등록 ===");
      let urlMap: Record<string, string> = {};
      if (fs.existsSync(URL_MAP_FILE)) {
        urlMap = JSON.parse(fs.readFileSync(URL_MAP_FILE, "utf-8"));
        console.log(`URL 맵 로드: ${Object.keys(urlMap).length}개`);
      } else {
        throw new Error("URL 맵 파일 없음. 먼저 upload를 실행하세요.");
      }
      await registerProducts(urlMap);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
