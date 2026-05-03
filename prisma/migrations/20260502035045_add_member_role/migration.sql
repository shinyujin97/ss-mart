-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "role" "MemberRole" NOT NULL DEFAULT 'USER';
