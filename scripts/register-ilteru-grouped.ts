/**
 * 일터루 2026 춘하 카탈로그 — 그룹 등록 스크립트
 *
 * 같은 카탈로그 페이지 + 같은 카테고리 → 1개 상품으로 묶음
 * ProductOption.modelCode 로 세부 품목코드 구분 (IT-616, IT-617 ...)
 *
 * 사용법:
 *   npx tsx scripts/register-ilteru-grouped.ts clean    # 기존 일터루 상품 삭제
 *   npx tsx scripts/register-ilteru-grouped.ts register # 그룹 등록
 *   npx tsx scripts/register-ilteru-grouped.ts all      # 삭제 후 재등록
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import * as fs from "fs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const SCAN_FILE = resolve(process.cwd(), "scripts/ilteru-catalog-scan.json");
const URL_MAP_FILE = resolve(process.cwd(), "scripts/ilteru-catalog-image-urls.json");

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// ── 카테고리 ID 매핑 ──────────────────────────────────────────────
const CATEGORY_MAP: Record<string, string> = {
  상의:   "cmofjwncd0001tdi5xiibm4ms",
  하의:   "cmofjwnct0002tdi50fz8q675",
  세트:   "cmofjwnd60003tdi5aqt39smo",
  조끼:   "cmofjwndk0004tdi542ffqqjp",
  안전화: "cmofjwnfi0008tdi5c3ms0krs",
};

function getCategoryKey(category: string): string {
  if (["점퍼", "셔츠", "티셔츠", "경비복"].includes(category)) return "상의";
  if (["조끼", "특수조끼", "아이스조끼", "신호수조끼"].includes(category)) return "조끼";
  if (["바지"].includes(category)) return "하의";
  if (["작업복세트", "클린룸웨어", "정비복"].includes(category)) return "세트";
  if (["안전화"].includes(category)) return "안전화";
  return "상의";
}

function getCategoryId(category: string): string {
  return CATEGORY_MAP[getCategoryKey(category)];
}

// 카테고리별 표시 이름
const CATEGORY_LABEL: Record<string, string> = {
  상의: "상의",
  하의: "바지",
  세트: "작업복 세트",
  조끼: "조끼",
  안전화: "안전화",
  점퍼: "점퍼",
  셔츠: "셔츠",
  티셔츠: "티셔츠",
  경비복: "경비복",
  조끼특수: "특수 조끼",
  아이스조끼: "아이스 조끼",
  신호수조끼: "신호수 조끼",
  작업복세트: "작업복 세트",
  클린룸웨어: "클린룸웨어",
  정비복: "정비복",
  바지: "바지",
  안전화_: "안전화",
};

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
  "FREE SIZE": "#cccccc",
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

// 그룹 상품명 결정
function groupProductName(catKey: string, products: CatalogProduct[], page: string): string {
  const label = products[0].name || catKey;
  if (products.length === 1) return `일터루 ${products[0].code} ${label}`;

  const codes = products.map(p => p.code);
  // 코드가 비슷한 시리즈면 범위로 표현
  const codeStr = codes.length <= 3 ? codes.join("/") : `${codes[0]} 외 ${codes.length - 1}종`;
  return `일터루 ${label} (${codeStr})`;
}

// 카테고리 → ASCII 슬러그 매핑
const CAT_SLUG: Record<string, string> = {
  상의: "top", 하의: "bottom", 세트: "set",
  조끼: "vest", 안전화: "shoes",
};

// 슬러그 생성
function makeSlug(page: string, catKey: string): string {
  const catSlug = CAT_SLUG[catKey] ?? catKey.toLowerCase().replace(/[^a-z0-9]/g, "-");
  return `ilteru-p${page}-${catSlug}`;
}

// ── Phase 1: 기존 일터루 상품 삭제 ───────────────────────────────
async function cleanIlteru() {
  const brand = await prisma.brand.findFirstOrThrow({ where: { slug: "ilteru" } });
  const products = await prisma.product.findMany({
    where: { brandId: brand.id },
    select: { id: true, name: true },
  });
  console.log(`삭제 대상: ${products.length}개 일터루 상품`);
  if (products.length === 0) { console.log("없음."); return; }

  await prisma.product.deleteMany({ where: { brandId: brand.id } });
  console.log(`✅ ${products.length}개 삭제 완료`);
}

// ── Phase 2: 그룹 등록 ────────────────────────────────────────────
async function registerGrouped(urlMap: Record<string, string>) {
  const pages: CatalogPage[] = JSON.parse(fs.readFileSync(SCAN_FILE, "utf-8"));
  const brand = await prisma.brand.findFirstOrThrow({ where: { slug: "ilteru" } });

  // (page, categoryKey) 별로 그룹핑
  type Group = { page: string; catKey: string; products: CatalogProduct[] };
  const groups: Group[] = [];
  const seenCodes = new Set<string>(); // 코드 중복 제거 (같은 코드가 여러 페이지)

  for (const p of pages) {
    // 페이지 내 카테고리별로 묶기
    const byCategory: Record<string, CatalogProduct[]> = {};
    for (const prod of p.products) {
      if (seenCodes.has(prod.code)) continue; // 이미 다른 페이지에서 처리한 코드
      seenCodes.add(prod.code);
      const catKey = getCategoryKey(prod.category);
      if (!byCategory[catKey]) byCategory[catKey] = [];
      byCategory[catKey].push(prod);
    }
    for (const [catKey, prods] of Object.entries(byCategory)) {
      groups.push({ page: p.page, catKey, products: prods });
    }
  }

  console.log(`\n그룹 수: ${groups.length}개 상품 생성 예정`);
  console.log(`(단일 상품: ${groups.filter(g => g.products.length === 1).length}개, 복수 상품: ${groups.filter(g => g.products.length > 1).length}개)\n`);

  let created = 0, failed = 0;

  for (const group of groups) {
    const imgKey = `${group.page}.jpg`;
    const imgUrl = urlMap[imgKey];
    if (!imgUrl) {
      console.log(`  ⚠️  페이지 ${group.page} 이미지 없음`);
      continue;
    }

    const slug = makeSlug(group.page, group.catKey);
    const name = groupProductName(group.catKey, group.products, group.page);
    const catId = getCategoryId(group.products[0].category);
    const codes = group.products.map(p => p.code).join("/");
    const fabrics = [...new Set(group.products.map(p => p.fabric).filter(Boolean))].join(", ");
    const isMulti = group.products.length > 1;
    const isShoes = group.catKey === "안전화";

    try {
      await prisma.$transaction(async (tx) => {
        const prod = await tx.product.create({
          data: {
            slug,
            brandId: brand.id,
            name,
            shortDescription: isMulti ? `${codes} | ${fabrics}` : fabrics || undefined,
            basePrice: 0,
            salePrice: 0,
            catalogPage: group.page,
            embroideryAvailable: !isShoes,
            bulkOrderAvailable: true,
            status: "ACTIVE",
            isNew: true,
          },
        });

        await tx.productCategory.create({
          data: { productId: prod.id, categoryId: catId },
        });

        await tx.productImage.create({
          data: {
            productId: prod.id,
            url: imgUrl,
            altText: name,
            isMain: true,
            sortOrder: 0,
          },
        });

        // 옵션: modelCode × color × size
        const options: {
          productId: string;
          modelCode: string;
          color: string;
          colorHex: string | null;
          size: string;
          sku: string;
          stockQuantity: number;
          isActive: boolean;
        }[] = [];

        for (const p of group.products) {
          for (const color of p.colors) {
            for (const size of p.sizes) {
              const sku = `${p.code}-${color.replace(/\s+/g, "")}-${size}`.toUpperCase();
              options.push({
                productId: prod.id,
                modelCode: p.code,
                color,
                colorHex: COLOR_HEX[color] ?? null,
                size,
                sku,
                stockQuantity: 999,
                isActive: true,
              });
            }
          }
        }

        if (options.length > 0) {
          await tx.productOption.createMany({ data: options });
        }
      });

      created++;
      const tag = isMulti ? `[${group.products.length}종]` : "      ";
      process.stdout.write(`\r  [${created}] P${group.page} ${tag} ${name.slice(0, 40)}    `);
    } catch (e: any) {
      console.error(`\n  ❌ 페이지 ${group.page} ${group.catKey}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n\n완료! 등록: ${created}, 실패: ${failed}`);
}

// ── 메인 ──────────────────────────────────────────────────────────
async function main() {
  const cmd = process.argv[2] ?? "all";
  try {
    if (cmd === "clean" || cmd === "all") {
      console.log("=== 1단계: 기존 일터루 상품 삭제 ===");
      await cleanIlteru();
    }
    if (cmd === "register" || cmd === "all") {
      console.log("\n=== 2단계: 그룹 등록 ===");
      const urlMap = JSON.parse(fs.readFileSync(URL_MAP_FILE, "utf-8"));
      await registerGrouped(urlMap);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
