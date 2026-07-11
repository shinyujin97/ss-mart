/**
 * K2 / 피오존 / 블랙야크 상품 이미지 전체 삭제 (R2 + DB)
 * 브랜드 / 상품 레코드는 유지, ProductImage만 삭제 (재등록 예정)
 *
 * 사용법:
 *   npx tsx scripts/wipe-brand-images-r2.ts          # dry-run
 *   npx tsx scripts/wipe-brand-images-r2.ts --delete  # 실제 삭제
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3";

const DRY_RUN = !process.argv.includes("--delete");

const TARGET_BRAND_SLUGS = ["k2", "piozen", "blackyak"];

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = "ss-mart-products";

const s3 =
  ACCOUNT_ID && ACCESS_KEY_ID && SECRET_ACCESS_KEY
    ? new S3Client({
        region: "auto",
        endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
      })
    : null;

function urlToKey(url: string): string | null {
  const match = url.match(/r2\.dev\/(products\/.+)$/);
  return match ? match[1] : null;
}

async function deleteR2Keys(keys: string[]) {
  if (!s3) {
    console.log("  ⚠️  R2 환경변수 없음 (CLOUDFLARE_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY) → R2 삭제 건너뜀");
    return;
  }
  let deleted = 0;
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
      })
    );
    deleted += batch.length;
    process.stdout.write(`  R2 삭제 진행: ${deleted}/${keys.length}\r`);
  }
  console.log(`\n  R2 삭제 완료: ${deleted}개`);
}

async function main() {
  console.log(DRY_RUN ? "🔍 DRY-RUN 모드 (실제 삭제 없음)" : "🗑️  실제 삭제 모드");
  console.log("대상 브랜드:", TARGET_BRAND_SLUGS.join(", "), "\n");

  for (const slug of TARGET_BRAND_SLUGS) {
    const brand = await prisma.brand.findFirst({ where: { slug } });
    if (!brand) {
      console.log(`[${slug}] 브랜드 없음, 스킵`);
      continue;
    }

    const images = await prisma.productImage.findMany({
      where: { product: { brandId: brand.id } },
      select: { id: true, url: true },
    });

    const keys = images.map((i) => urlToKey(i.url)).filter((k): k is string => k !== null);
    const skipped = images.length - keys.length;

    console.log(`=== ${slug} (${brand.name}) === 이미지 ${images.length}개 (R2 key 추출 ${keys.length}개, 실패 ${skipped}개)`);

    if (DRY_RUN) continue;

    if (keys.length > 0) {
      await deleteR2Keys(keys);
    }

    const result = await prisma.productImage.deleteMany({
      where: { product: { brandId: brand.id } },
    });
    console.log(`  DB 삭제 완료: ${result.count}개\n`);
  }

  if (DRY_RUN) {
    console.log("\n실제 삭제 명령: npx tsx scripts/wipe-brand-images-r2.ts --delete");
  } else {
    console.log("✅ 완료! 브랜드/상품 레코드는 유지됨");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ 오류:", e);
  process.exit(1);
});
