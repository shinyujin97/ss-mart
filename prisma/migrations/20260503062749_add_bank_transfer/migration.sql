-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PENDING_PAYMENT';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "bankTransferDeadline" TIMESTAMP(3),
ADD COLUMN     "bankTransferHolder" TEXT;
