import "dotenv/config";
import * as path from "path";
import * as XLSX from "xlsx";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// 엑셀 카테고리명 → DB 슬러그 매핑
// 기존 DB 슬러그에 매핑 가능한 것은 매핑, 나머지는 새로 생성
const CATEGORY_SLUG_MAP: Record<string, string> = {
  신발: "shoes",
  "APT용품": "apt-supplies",
  건설교통: "construction-transport",
  "공구&철물": "tools-hardware",
  "도장&호흡기보호": "painting-respiratory",
  "동하계&액세서리": "seasonal-accessories",
  "사무용품&잡화": "office-supplies",
  "소방&재난": "fire-disaster",
  "시력보호&1회용": "eye-protection",
  용접: "welding",
  "장갑(작업용)": "work-gloves",
  "제전&근골격보호": "static-musculoskeletal",
  "청소&위생": "cleaning-hygiene",
  "추락&청력보호": "fall-hearing-protection",
  "포장자재&비닐": "packaging-materials",
  근무복: "work-uniform",
};

// 이미지 파일명 브랜드 키 → { name, nameKr, slug }
const BRAND_MAP: Record<string, { slug: string; name: string; nameKr: string }> = {
  semong: { slug: "semong", name: "SEMONG", nameKr: "세몽" },
  K2: { slug: "k2", name: "K2", nameKr: "K2" },
  KOLON: { slug: "kolon-sport", name: "KOLON", nameKr: "코오롱" },
  kolon: { slug: "kolon-sport", name: "KOLON", nameKr: "코오롱" },
  PROSPECS: { slug: "prospecs", name: "PROSPECS", nameKr: "프로스펙스" },
  YAK: { slug: "yak", name: "YAK", nameKr: "야크" },
  ZIBEN: { slug: "ziben", name: "ZIBEN", nameKr: "지벤" },
  campline: { slug: "campline", name: "CAMPLINE", nameKr: "캠프라인" },
  lecaf: { slug: "lecaf", name: "LECAF", nameKr: "르카프" },
  vicstop: { slug: "vicstop", name: "VICSTOP", nameKr: "빅스탑" },
  dupont: { slug: "dupont", name: "DUPONT", nameKr: "듀폰" },
  "3M": { slug: "3m", name: "3M", nameKr: "3M" },
  NEPA: { slug: "nepa", name: "NEPA", nameKr: "네파" },
  Piozen: { slug: "piozen", name: "PIOZEN", nameKr: "피오젠" },
  EPYUNHAN: { slug: "epyunhan", name: "EPYUNHAN", nameKr: "이평한" },
  GMG: { slug: "gmg", name: "GMG", nameKr: "GMG" },
  ILTERU: { slug: "ilteru", name: "ILTERU", nameKr: "일터루" },
  KARA: { slug: "kara", name: "KARA", nameKr: "카라" },
  OTOS: { slug: "otos", name: "OTOS", nameKr: "오토스" },
  SAFERS: { slug: "safers", name: "SAFERS", nameKr: "세이퍼스" },
  safers: { slug: "safers", name: "SAFERS", nameKr: "세이퍼스" },
  SH: { slug: "sh-safety", name: "SH", nameKr: "SH" },
  SMART: { slug: "smart-safety", name: "SMART", nameKr: "스마트" },
  TECHLINE: { slug: "techline", name: "TECHLINE", nameKr: "테크라인" },
  YK: { slug: "yk", name: "YK", nameKr: "YK" },
  bulls: { slug: "bulls", name: "BULLS", nameKr: "불스" },
  cleantop: { slug: "cleantop", name: "CLEANTOP", nameKr: "클린탑" },
  dongmyung: { slug: "dongmyung", name: "DONGMYUNG", nameKr: "동명" },
  kleenguard: { slug: "kleenguard", name: "KLEENGUARD", nameKr: "클린가드" },
  ssangsol: { slug: "ssangsol", name: "SSANGSOL", nameKr: "쌍솔" },
  starzen: { slug: "starzen", name: "STARZEN", nameKr: "스타젠" },
  withus: { slug: "withus", name: "WITHUS", nameKr: "위드어스" },
  yuhan: { slug: "yuhan", name: "YUHAN", nameKr: "유한" },
  yuhankimberly: { slug: "yuhan-kimberly", name: "YUHAN KIMBERLY", nameKr: "유한킴벌리" },
};

// 기타 브랜드 (매핑 실패 시 사용)
const FALLBACK_BRAND = { slug: "etc-brand", name: "ETC", nameKr: "기타" };

function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  return parseInt(String(priceStr).replace(/[^0-9]/g, ""), 10) || 0;
}

function extractBrandKeyFromFilename(filename: string): string | null {
  if (!filename) return null;
  const base = filename.replace(/\.jpg$/i, "").replace(/\.png$/i, "");
  const parts = base.split("_");
  // 형식: p0001_main1_{category}_{brand}_T_{code}
  if (parts.length >= 4) return parts[3];
  return null;
}

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function ensureCategories(): Promise<Map<string, string>> {
  const idMap = new Map<string, string>(); // 카테고리명 → id

  // 상위 카테고리 "상품 전체" 확인 또는 생성
  const rootCat = await prisma.category.upsert({
    where: { slug: "all-products" },
    update: {},
    create: { slug: "all-products", name: "상품 전체", level: 0, sortOrder: 99 },
  });

  for (const [name, slug] of Object.entries(CATEGORY_SLUG_MAP)) {
    const cat = await prisma.category.upsert({
      where: { slug },
      update: { name },
      create: { slug, name, parentId: rootCat.id, level: 1, sortOrder: 0 },
    });
    idMap.set(name, cat.id);
  }

  return idMap;
}

async function ensureBrands(): Promise<Map<string, string>> {
  const idMap = new Map<string, string>(); // brand slug → id

  const upsertBrand = async (slug: string, name: string, nameKr: string): Promise<string> => {
    // 이름으로 먼저 찾기 (다른 슬러그로 이미 존재할 수 있음)
    const byName = await prisma.brand.findFirst({ where: { name } });
    if (byName) return byName.id;
    // 슬러그로 찾기
    const bySlug = await prisma.brand.findUnique({ where: { slug } });
    if (bySlug) return bySlug.id;
    // 없으면 생성
    const rec = await prisma.brand.create({ data: { slug, name, nameKr } });
    return rec.id;
  };

  // 기타 브랜드 먼저
  const fbId = await upsertBrand(FALLBACK_BRAND.slug, FALLBACK_BRAND.name, FALLBACK_BRAND.nameKr);
  idMap.set(FALLBACK_BRAND.slug, fbId);

  // 중복 슬러그 제거 후 처리
  const seen = new Set<string>();
  for (const b of Object.values(BRAND_MAP)) {
    if (seen.has(b.slug)) continue;
    seen.add(b.slug);
    const id = await upsertBrand(b.slug, b.name, b.nameKr);
    idMap.set(b.slug, id);
  }

  return idMap;
}

async function main() {
  console.log("📦 엑셀 상품 임포트 시작\n");

  const filePath = "/mnt/c/React/piozen_output/products_with_category.xlsx";
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][];

  // 헤더 제외
  const dataRows = rows.slice(1).filter((r) => r[0] != null);
  console.log(`  총 ${dataRows.length}개 상품 처리 예정\n`);

  console.log("  1단계: 카테고리 준비...");
  const categoryIdMap = await ensureCategories();
  console.log(`  ✓ 카테고리 ${categoryIdMap.size}개 준비 완료\n`);

  console.log("  2단계: 브랜드 준비...");
  const brandIdMap = await ensureBrands();
  console.log(`  ✓ 브랜드 ${brandIdMap.size}개 준비 완료\n`);

  console.log("  3단계: 상품 임포트...");
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const no = row[0];
    const productCode = String(row[1] || "").trim();
    const name = String(row[2] || "").trim();
    const priceStr = String(row[3] || "0");
    const mainImagesRaw = String(row[6] || "");
    const detailImagesRaw = String(row[7] || "");
    const categoriesRaw = String(row[8] || "");

    if (!name || !productCode) {
      skipped++;
      continue;
    }

    const slug = `p-${productCode}`;
    const price = parsePrice(priceStr);
    if (price === 0) {
      skipped++;
      continue;
    }

    // 브랜드 결정 (첫 번째 메인 이미지 파일명에서 추출)
    const mainImages = mainImagesRaw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const detailImages = detailImagesRaw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const firstImg = mainImages[0] || "";
    const brandKey = extractBrandKeyFromFilename(firstImg);
    const brandInfo = brandKey ? BRAND_MAP[brandKey] : null;
    const brandSlug = brandInfo?.slug ?? FALLBACK_BRAND.slug;
    const brandId = brandIdMap.get(brandSlug) ?? brandIdMap.get(FALLBACK_BRAND.slug)!;

    // 카테고리 결정
    const categoryNames = categoriesRaw.split(",").map((s) => s.trim()).filter(Boolean);
    const categoryIds = categoryNames
      .map((cn) => categoryIdMap.get(cn))
      .filter((id): id is string => !!id);

    try {
      const existing = await prisma.product.findUnique({ where: { slug } });
      if (existing) {
        skipped++;
        continue;
      }

      const product = await prisma.product.create({
        data: {
          slug,
          brandId,
          name,
          shortDescription: name,
          basePrice: price,
          salePrice: price,
          embroideryAvailable: true,
          bulkOrderAvailable: true,
          status: "ACTIVE",
          categories: categoryIds.length > 0
            ? { create: categoryIds.map((id) => ({ categoryId: id })) }
            : undefined,
        },
      });

      // 메인 이미지
      for (let idx = 0; idx < mainImages.length; idx++) {
        const fname = mainImages[idx];
        if (!fname) continue;
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: `/products/${fname}`,
            altText: name,
            isMain: idx === 0,
            sortOrder: idx,
          },
        });
      }

      // 상세 이미지
      for (let idx = 0; idx < detailImages.length; idx++) {
        const fname = detailImages[idx];
        if (!fname) continue;
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: `/products/${fname}`,
            altText: `${name} 상세`,
            isMain: false,
            sortOrder: mainImages.length + idx,
          },
        });
      }

      created++;
    } catch (e: any) {
      errors++;
      console.error(`  ✗ 오류 (row ${i + 2}, ${name}):`, e.message);
    }

    // 진행상황 출력 (100개마다)
    if ((i + 1) % 100 === 0) {
      console.log(`  ... ${i + 1}/${dataRows.length} 처리 중 (생성: ${created}, 스킵: ${skipped}, 오류: ${errors})`);
    }
  }

  console.log(`\n✅ 임포트 완료!`);
  console.log(`   생성: ${created}개`);
  console.log(`   스킵: ${skipped}개 (중복 또는 가격 없음)`);
  console.log(`   오류: ${errors}개`);
}

main()
  .catch((e) => {
    console.error("❌ 임포트 실패:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
