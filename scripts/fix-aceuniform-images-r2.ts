/**
 * aceuniform 이미지 복구 — 원본(aceuniform.co.kr) 다운로드 → R2 업로드 → DB 교체
 *
 * aceuniform 원본은 http라 hotlink 불가(mixed-content) → R2에 재호스팅 필수.
 * 매핑: 상품 slug(ace-...-{itId}) → aceuniform-scraped.json 의 imageUrls[idx]
 *       (이미지 키 products/aceuniform/{productId}_{idx}.jpg 의 idx = imageUrls 순번)
 *
 *   npx tsx scripts/fix-aceuniform-images-r2.ts          # 드라이런(매핑+원본 도달성)
 *   npx tsx scripts/fix-aceuniform-images-r2.ts --apply  # 다운로드+R2업로드+DB교체
 */
import { config } from "dotenv";
import { resolve, extname } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import * as fs from "fs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const APPLY = process.argv.includes("--apply");
const SB = "https://rreymhbhjrdadxkegheh.supabase.co/storage/v1/object/public/";
const R2_PUBLIC = "https://pub-6ae5048278f24ad48b62dc77072943aa.r2.dev/";
const BUCKET = "ss-mart-products";
const MIME: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
});

const scraped: any[] = JSON.parse(fs.readFileSync("scripts/aceuniform-scraped.json", "utf8"));
const byItId = new Map<string, any>();
for (const s of scraped) if (s.itId) byItId.set(String(s.itId), s);

const itIdOf = (slug: string) => { const m = slug.match(/(\d+)\s*$/); return m ? m[1] : null; };
const idxOf = (key: string) => { const m = key.match(/_(\d+)\.[a-z]+$/i); return m ? parseInt(m[1], 10) : null; };

async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const j = i++; out[j] = await fn(items[j], j); }
  }));
  return out;
}
async function head(url: string) { try { const r = await fetch(url, { method: "HEAD" }); return r.ok; } catch { return false; } }

interface Item { id: string; key: string; orig: string; }

async function main() {
  console.log(`모드: ${APPLY ? "★ APPLY (다운로드+R2업로드+DB교체)" : "드라이런"}\n`);
  const imgs = await prisma.productImage.findMany({
    where: { url: { contains: "/aceuniform/" } },
    select: { id: true, url: true, product: { select: { slug: true } } },
  });

  const items: Item[] = [];
  let noMatch = 0, noUrl = 0;
  for (const im of imgs) {
    const key = im.url.slice(SB.length); // products/aceuniform/xxx_0.jpg
    const itId = itIdOf(im.product.slug);
    const idx = idxOf(key);
    const s = itId ? byItId.get(itId) : null;
    if (!s) { noMatch++; continue; }
    const orig = s.imageUrls?.[idx ?? 0];
    if (!orig) { noUrl++; continue; }
    items.push({ id: im.id, key, orig });
  }
  console.log(`aceuniform ${imgs.length}개 → 매핑 ${items.length} / itId미스 ${noMatch} / 이미지순번없음 ${noUrl}`);

  if (!APPLY) {
    // 원본 도달성 표본 점검
    const sample = items.filter((_, i) => i % Math.max(1, Math.floor(items.length / 40)) === 0).slice(0, 40);
    let ok = 0; await mapLimit(sample, 16, async (it) => { if (await head(it.orig)) ok++; });
    console.log(`원본 도달성 표본: ${ok}/${sample.length} OK`);
    console.log("\n드라이런 종료. --apply 로 다운로드+업로드 실행.");
    await prisma.$disconnect(); return;
  }

  let uploaded = 0, skipped = 0, failed = 0, done = 0;
  const updates: Item[] = [];
  await mapLimit(items, 12, async (it) => {
    try {
      // 이미 R2에 있으면 업로드 스킵
      let exists = false;
      try { await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: it.key })); exists = true; } catch {}
      if (!exists) {
        const res = await fetch(it.orig);
        if (!res.ok) throw new Error("download " + res.status);
        const buf = Buffer.from(await res.arrayBuffer());
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET, Key: it.key, Body: buf,
          ContentType: MIME[extname(it.key).toLowerCase()] ?? "image/jpeg",
          CacheControl: "public, max-age=31536000, immutable",
        }));
        uploaded++;
      } else skipped++;
      updates.push(it);
    } catch (e: any) { failed++; if (failed <= 10) console.error("\n실패", it.key, e.message); }
    if (++done % 100 === 0) process.stdout.write(`\r  처리 ${done}/${items.length} (업로드 ${uploaded}/스킵 ${skipped}/실패 ${failed})`);
  });
  process.stdout.write(`\r  처리 ${done}/${items.length} (업로드 ${uploaded}/스킵 ${skipped}/실패 ${failed})\n`);

  console.log(`\nDB URL 교체 (${updates.length}개)...`);
  let n = 0;
  await mapLimit(updates, 24, async (it) => {
    await prisma.productImage.update({ where: { id: it.id }, data: { url: R2_PUBLIC + it.key } });
    if (++n % 200 === 0) process.stdout.write(`\r  교체 ${n}/${updates.length}`);
  });
  console.log(`\n완료: 업로드 ${uploaded} / 스킵 ${skipped} / 실패 ${failed} / DB교체 ${n}`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
