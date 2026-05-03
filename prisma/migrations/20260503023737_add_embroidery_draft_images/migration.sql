-- CreateTable
CREATE TABLE "embroidery_draft_images" (
    "id" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "revisionNo" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "embroidery_draft_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "embroidery_draft_images_designId_idx" ON "embroidery_draft_images"("designId");

-- AddForeignKey
ALTER TABLE "embroidery_draft_images" ADD CONSTRAINT "embroidery_draft_images_designId_fkey" FOREIGN KEY ("designId") REFERENCES "embroidery_designs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
