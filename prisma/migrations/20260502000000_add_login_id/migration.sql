-- 기존 회원 데이터 전체 삭제 (연관 데이터 포함 CASCADE)
TRUNCATE TABLE "members" CASCADE;

-- loginId 컬럼 추가
ALTER TABLE "members" ADD COLUMN "loginId" TEXT NOT NULL DEFAULT '';

-- email nullable로 변경
ALTER TABLE "members" ALTER COLUMN "email" DROP NOT NULL;

-- loginId 기본값 제거 (이제 NOT NULL이지만 새 row는 반드시 값 입력)
ALTER TABLE "members" ALTER COLUMN "loginId" DROP DEFAULT;

-- loginId unique 인덱스
ALTER TABLE "members" ADD CONSTRAINT "members_loginId_key" UNIQUE ("loginId");

-- loginId 인덱스
CREATE INDEX "members_loginId_idx" ON "members"("loginId");
