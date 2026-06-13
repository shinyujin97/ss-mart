/**
 * tbuc 이미지 복구 — DB URL을 tbuc.co.kr 원본으로 직접 연결 (R2 자격증명 불필요)
 *
 * Supabase(402) → www.tbuc.co.kr 원본 직결. 상품 코드로 tbuc-scraped.json 매칭.
 * 각 원본 URL HEAD 200 확인 후에만 교체(죽은 링크 방지).
 *
 *   npx tsx scripts/fix-tbuc-images-direct.ts          # 드라이런
 *   npx tsx scripts/fix-tbuc-images-direct.ts --apply  # 실제 반영
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import * as fs from "fs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const APPLY = process.argv.includes("--apply");
const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });

const scraped: any[] = JSON.parse(fs.readFileSync("scripts/tbuc-scraped.json", "utf8"));
const norm = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");
const codeOf = (name: string) => norm(name.split(/[\s/(]/)[0]);
const idx = new Map<string, any>();
for (const s of scraped) {
  if (!s.mainImageUrl) continue;
  for (const k of [s.name, s.sitTitle].filter(Boolean)) { idx.set(norm(k), s); idx.set(codeOf(k), s); }
}

async function head(url: string): Promise<boolean> {
  try { const r = await fetch(url, { method: "HEAD" }); return r.status === 200; }
  catch { return false; }
}
async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const j = i++; out[j] = await fn(items[j]); }
  }));
  return out;
}

async function main() {
  console.log(`모드: ${APPLY ? "★ APPLY" : "드라이런"}\n`);
  const imgs = await prisma.productImage.findMany({
    where: { url: { contains: "/tbuc/" } },
    select: { id: true, product: { select: { name: true } } },
  });
  const plan = imgs.map((im) => {
    const s = idx.get(norm(im.product.name)) || idx.get(codeOf(im.product.name));
    return { id: im.id, name: im.product.name, url: s?.mainImageUrl as string | undefined };
  });
  const mapped = plan.filter((p) => p.url);
  console.log(`tbuc ${imgs.length}개 → 매칭 ${mapped.length} / 미매칭 ${imgs.length - mapped.length}`);

  let live = 0, dead = 0;
  const ok = await mapLimit(mapped, 24, async (p) => {
    const alive = await head(p.url!);
    alive ? live++ : dead++;
    return alive ? p : null;
  });
  const toUpdate = ok.filter(Boolean) as { id: string; url: string }[];
  console.log(`원본 도달성: 200 ${live} / 죽음 ${dead}`);
  console.log(`→ 교체 대상: ${toUpdate.length}개`);

  if (!APPLY) { console.log("\n드라이런 종료. --apply 로 반영."); await prisma.$disconnect(); return; }

  let n = 0;
  await mapLimit(toUpdate, 24, async (p) => {
    await prisma.productImage.update({ where: { id: p.id }, data: { url: p.url } });
    if (++n % 100 === 0) process.stdout.write(`\r  교체 ${n}/${toUpdate.length}`);
  });
  console.log(`\n완료: ${n}개 tbuc.co.kr 직결로 교체됨.`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
