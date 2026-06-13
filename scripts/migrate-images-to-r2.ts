/**
 * 이미지 supabase → R2 마이그레이션
 *
 * Supabase 스토리지가 무료 한도 초과(402)로 차단되어 전체 이미지가 깨짐.
 * 이미지 파일은 R2에 일부만 올라가 있고, DB URL은 100% supabase를 가리킴.
 *
 * 동작:
 *  1) ProductImage 중 supabase URL을 가진 레코드 수집
 *  2) 각 이미지의 R2 키(= /public/ 뒤 경로) 존재 여부 확인 (S3 HeadObject)
 *  3) R2에 없지만 로컬 public/products 에 원본이 있으면 R2로 업로드
 *  4) R2에 존재가 확정된 레코드만 DB url을 r2.dev 로 교체 (--apply 시에만 실제 반영)
 *
 * 사용:
 *   npx tsx scripts/migrate-images-to-r2.ts          # 드라이런(집계만)
 *   npx tsx scripts/migrate-images-to-r2.ts --apply  # 실제 DB 반영
 */
import { config } from "dotenv";
import { resolve, join, extname } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const SB_PREFIX = "https://rreymhbhjrdadxkegheh.supabase.co/storage/v1/object/public/";
const R2_PUBLIC = "https://pub-6ae5048278f24ad48b62dc77072943aa.r2.dev/";
const BUCKET = "ss-mart-products";
const LOCAL_DIR = "./public/products";
const CONCURRENCY = 24;
const APPLY = process.argv.includes("--apply");

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".gif": "image/gif",
};

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
// R2 쓰기 자격증명이 있으면 로컬 원본을 업로드까지 함. 없으면 공개 URL 존재 확인 + DB 교체만.
const CAN_UPLOAD = Boolean(ACCOUNT_ID && ACCESS_KEY_ID && SECRET_ACCESS_KEY);
const s3 = CAN_UPLOAD
  ? new S3Client({
      region: "auto",
      endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: ACCESS_KEY_ID!, secretAccessKey: SECRET_ACCESS_KEY! },
    })
  : null;
const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });

const groupOf = (key: string) => {
  const rest = key.replace(/^products\//, "");
  return rest.includes("/") ? "products/" + rest.split("/")[0] + "/" : "products/(flat)";
};

async function r2Has(key: string): Promise<boolean> {
  if (s3) {
    try { await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key })); return true; }
    catch { return false; }
  }
  // 자격증명 없을 때: 공개 r2.dev HEAD 로 존재 확인
  try { const r = await fetch(R2_PUBLIC + key, { method: "HEAD" }); return r.status === 200; }
  catch { return false; }
}

async function uploadFromLocal(key: string): Promise<boolean> {
  if (!s3) return false; // 자격증명 없으면 업로드 불가
  // flat 키만 로컬 원본 존재 (public/products/<file>)
  const localPath = join(LOCAL_DIR, key.replace(/^products\//, ""));
  if (!existsSync(localPath)) return false;
  const body = await readFile(localPath);
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: body,
    ContentType: MIME[extname(key).toLowerCase()] ?? "application/octet-stream",
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return true;
}

type Row = { id: string; url: string; key: string; group: string };

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) { const i = idx++; out[i] = await fn(items[i], i); }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

async function main() {
  console.log(`모드: ${APPLY ? "★ APPLY (DB 실제 반영)" : "드라이런 (DB 변경 없음)"} | R2 업로드: ${CAN_UPLOAD ? "가능(자격증명 있음)" : "불가(자격증명 없음 → 공개 URL 확인만)"}\n`);
  const all = await prisma.productImage.findMany({ select: { id: true, url: true } });
  const rows: Row[] = all
    .filter((r) => r.url.startsWith(SB_PREFIX))
    .map((r) => { const key = r.url.slice(SB_PREFIX.length); return { id: r.id, url: r.url, key, group: groupOf(key) }; });
  console.log(`supabase URL ProductImage: ${rows.length}개 (전체 ${all.length})`);

  const stat: Record<string, { total: number; onR2: number; uploaded: number; missing: number }> = {};
  const bump = (g: string) => (stat[g] ??= { total: 0, onR2: 0, uploaded: 0, missing: 0 });

  const toUpdate: Row[] = [];
  let processed = 0;
  await mapLimit(rows, CONCURRENCY, async (row) => {
    const s = bump(row.group); s.total++;
    let present = await r2Has(row.key);
    if (!present) {
      const up = await uploadFromLocal(row.key);
      if (up) { present = true; s.uploaded++; }
    } else { s.onR2++; }
    if (present) toUpdate.push(row);
    else s.missing++;
    if (++processed % 500 === 0) process.stdout.write(`\r  스캔 ${processed}/${rows.length}`);
  });
  process.stdout.write(`\r  스캔 ${processed}/${rows.length}\n\n`);

  console.log("그룹별 결과:");
  console.log("  " + "그룹".padEnd(24) + "총".padStart(7) + "R2존재".padStart(9) + "신규업로드".padStart(11) + "원본없음".padStart(10));
  for (const [g, s] of Object.entries(stat).sort((a, b) => b[1].total - a[1].total)) {
    console.log("  " + g.padEnd(24) + String(s.total).padStart(7) + String(s.onR2).padStart(9) + String(s.uploaded).padStart(11) + String(s.missing).padStart(10));
  }
  console.log(`\n→ R2 확정(교체 대상): ${toUpdate.length}개 / 원본 못 찾음(2단계 필요): ${rows.length - toUpdate.length}개`);

  if (!APPLY) {
    console.log("\n드라이런 종료. 실제 반영하려면 --apply 추가.");
    await prisma.$disconnect();
    return;
  }

  console.log(`\nDB URL 교체 중... (${toUpdate.length}개)`);
  let updated = 0;
  await mapLimit(toUpdate, CONCURRENCY, async (row) => {
    await prisma.productImage.update({ where: { id: row.id }, data: { url: R2_PUBLIC + row.key } });
    if (++updated % 500 === 0) process.stdout.write(`\r  교체 ${updated}/${toUpdate.length}`);
  });
  process.stdout.write(`\r  교체 ${updated}/${toUpdate.length}\n`);
  console.log(`완료: ${updated}개 레코드 r2.dev 로 교체됨.`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error("\n에러:", e); process.exit(1); });
