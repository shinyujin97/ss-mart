import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import * as fs from "fs";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const BASE_URL = "https://www.tbuc.co.kr";
const BUCKET = "products";
const SCRAPED_FILE = resolve(process.cwd(), "scripts/tbuc-scraped.json");

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const brand = await prisma.brand.findFirstOrThrow({ where: { slug: "tbuc" } });

  const prod = await prisma.product.findFirst({
    where: { brandId: brand.id, name: { contains: "TB-357" } },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!prod) { console.log("TB-357 DB에 없음"); return; }

  console.log(`DB: "${prod.name}" | 이미지: ${prod.images.length}개`);
  prod.images.forEach((img, i) => console.log(`  [${i}] isMain:${img.isMain} | ${img.url}`));

  // 이미지 URL HTTP 상태 확인
  for (const img of prod.images) {
    const res = await fetch(img.url, { method: "HEAD" });
    console.log(`  → HTTP ${res.status} (${img.url.slice(-40)})`);
  }

  // 스크래핑 데이터에서 itId 찾기
  const scraped: any[] = JSON.parse(fs.readFileSync(SCRAPED_FILE, "utf-8"));
  const sp = scraped.find(p => p.name === "TB-357" || p.name.startsWith("TB-357"));
  console.log(`\n스크래핑: ${sp ? `itId=${sp.itId}, 갤러리: ${(sp.galleryImageUrls ?? (sp.mainImageUrl ? [sp.mainImageUrl] : [])).length}장` : "없음"}`);
  if (sp) {
    const galleryUrls = [
      ...(sp.galleryImageUrls ?? (sp.mainImageUrl ? [sp.mainImageUrl] : [])),
      ...(sp.detailImageUrls?.filter((u: string) => u.includes("/data/item/")) ?? []),
    ];
    console.log("갤러리 URLs:", galleryUrls);

    // 실제 T-BUC 사이트 재스크래핑
    console.log("\nT-BUC 사이트 재스크래핑...");
    const html = await fetch(`${BASE_URL}/shop/item.php?it_id=${sp.itId}`, {
      headers: { "User-Agent": "Mozilla/5.0", "Referer": BASE_URL },
    }).then(r => r.text());
    const $ = cheerio.load(html);
    const imgs: string[] = [];
    $("img").each((_, el) => {
      const src = $(el).attr("src") || "";
      if (src.includes("/data/item/") && !src.includes("_80x80") && !src.includes("_70x70"))
        imgs.push(src.startsWith("http") ? src : `${BASE_URL}${src}`);
    });
    console.log("사이트 이미지:", imgs);

    // Supabase에 재업로드
    if (imgs.length > 0) {
      const anyImg = prod.images[0];
      const supabaseUrl = new URL(anyImg.url).origin;
      const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!.trim());

      // 기존 삭제
      const paths = prod.images.map(img => {
        try { return new URL(img.url).pathname.split(`/public/${BUCKET}/`)[1]; } catch { return null; }
      }).filter(Boolean) as string[];
      if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
      await prisma.productImage.deleteMany({ where: { productId: prod.id } });

      // 재업로드
      const galleryOnly = imgs.filter(u => u.includes("_640x800")).length > 0
        ? imgs.filter(u => u.includes("_640x800"))
        : imgs;

      for (let i = 0; i < galleryOnly.length; i++) {
        const imgUrl = galleryOnly[i];
        const res = await fetch(imgUrl, { headers: { "User-Agent": "Mozilla/5.0", "Referer": BASE_URL } });
        if (!res.ok) { console.log(`  ⚠️  다운로드 실패: ${imgUrl}`); continue; }
        const buf = Buffer.from(await res.arrayBuffer());
        const ext = imgUrl.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "jpg";
        const filename = `tbuc/${prod.id}_${i}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(filename, buf, {
          contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
          upsert: true,
        });
        if (error) { console.log(`  ⚠️  업로드 실패: ${error.message}`); continue; }
        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename);
        await prisma.productImage.create({
          data: { productId: prod.id, url: publicUrl, isMain: i === 0, sortOrder: i },
        });
        console.log(`  ✅ 업로드: ${filename} → ${publicUrl.slice(-50)}`);
      }
    }
  }

  await prisma.$disconnect();
}
main().catch(console.error);
