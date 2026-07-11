/**
 * K2 / 피오존 / 블랙야크 DB 레코드는 이미 삭제됨 (wipe-brand-images-r2.ts 1차 실행)
 * R2 버킷에 남은 고아 객체를 파일명 패턴으로 찾아서 삭제
 *
 * 사용법:
 *   npx tsx scripts/cleanup-r2-orphans.ts          # dry-run (목록만)
 *   npx tsx scripts/cleanup-r2-orphans.ts --delete  # 실제 삭제
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

const DRY_RUN = !process.argv.includes("--delete");

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = "ss-mart-products";

if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
  console.error("필수 환경변수 누락: CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
});

const PATTERNS: Record<string, RegExp> = {
  k2: /_K2_/,
  piozen: /_Piozen_/,
  blackyak: /_YAK_/,
};

async function listAllKeys(): Promise<string[]> {
  const keys: string[] = [];
  let ContinuationToken: string | undefined;
  do {
    const res = await s3.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: "products/", ContinuationToken })
    );
    for (const obj of res.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key);
    }
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    process.stdout.write(`  목록 조회 중: ${keys.length}개\r`);
  } while (ContinuationToken);
  console.log(`\n  R2 총 객체 수 (products/): ${keys.length}`);
  return keys;
}

async function deleteKeys(keys: string[]) {
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
    process.stdout.write(`  삭제 진행: ${deleted}/${keys.length}\r`);
  }
  console.log(`\n  삭제 완료: ${deleted}개`);
}

async function main() {
  console.log(DRY_RUN ? "🔍 DRY-RUN 모드" : "🗑️  실제 삭제 모드");

  const allKeys = await listAllKeys();

  const matched: Record<string, string[]> = { k2: [], piozen: [], blackyak: [] };
  for (const key of allKeys) {
    for (const [slug, pattern] of Object.entries(PATTERNS)) {
      if (pattern.test(key)) matched[slug].push(key);
    }
  }

  for (const [slug, keys] of Object.entries(matched)) {
    console.log(`\n=== ${slug} === 매칭된 R2 객체 ${keys.length}개`);
    if (keys.length > 0) console.log("  예시:", keys.slice(0, 3).join(", "));
  }

  const allMatched = Object.values(matched).flat();
  console.log(`\n총 삭제 대상: ${allMatched.length}개`);

  if (DRY_RUN) {
    console.log("\n실제 삭제 명령: npx tsx scripts/cleanup-r2-orphans.ts --delete");
    return;
  }

  await deleteKeys(allMatched);
  console.log("\n✅ 완료");
}

main().catch((e) => {
  console.error("❌ 오류:", e);
  process.exit(1);
});
