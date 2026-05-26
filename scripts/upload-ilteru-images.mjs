import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { readdir, readFile } from "fs/promises";
import { join, extname } from "path";
import "dotenv/config";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = "ss-mart-products";
const IMAGES_DIR = "/mnt/c/Users/ssy66/Downloads/ilteru_2026_spring_summer";
const CONCURRENCY = 10;
const R2_BASE_URL = process.env.R2_PUBLIC_URL ?? `https://pub-${ACCOUNT_ID}.r2.dev`;

if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
  console.error("필수 환경변수 누락: CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
});

async function exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function upload(file) {
  const key = `ilteru/2026-spring-summer/${file}`;
  if (await exists(key)) return { file, result: "skip", url: `${R2_BASE_URL}/${key}` };

  const body = await readFile(join(IMAGES_DIR, file));
  const ct = extname(file).toLowerCase() === ".jpg" ? "image/jpeg" : "image/png";
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: ct,
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return { file, result: "upload", url: `${R2_BASE_URL}/${key}` };
}

async function run() {
  const all = await readdir(IMAGES_DIR);
  // jpg/png만, 표지(001)와 ecatalog.txt 제외
  const files = all
    .filter(f => /\.(jpg|png)$/i.test(f) && f !== "001.jpg")
    .sort();

  console.log(`일터루 2026 춘하 이미지 ${files.length}장 업로드 시작...`);

  const urlMap = {};
  let done = 0, skipped = 0, failed = 0;
  const start = Date.now();

  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(upload));

    for (const r of results) {
      if (r.status === "fulfilled") {
        urlMap[r.value.file] = r.value.url;
        r.value.result === "skip" ? skipped++ : done++;
      } else {
        failed++;
        console.error("\n실패:", r.reason?.message);
      }
    }

    const pct = (((done + skipped + failed) / files.length) * 100).toFixed(1);
    process.stdout.write(`\r진행: ${pct}% | 업로드: ${done} | 스킵: ${skipped} | 실패: ${failed} | ${((Date.now()-start)/1000).toFixed(0)}s`);
  }

  console.log(`\n\n완료! 업로드: ${done}, 스킵(이미 존재): ${skipped}, 실패: ${failed}`);

  // URL 맵 출력 (등록 스크립트에서 사용)
  const outputPath = new URL("../scripts/ilteru-image-urls.json", import.meta.url).pathname;
  const { writeFile } = await import("fs/promises");
  await writeFile(outputPath, JSON.stringify(urlMap, null, 2));
  console.log(`\nURL 맵 저장: ${outputPath}`);
}

run().catch(console.error);
