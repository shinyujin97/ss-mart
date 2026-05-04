CREATE INDEX "product_categories_categoryId_productId_idx" ON "product_categories"("categoryId", "productId");
CREATE INDEX "products_status_createdAt_idx" ON "products"("status", "createdAt");
CREATE INDEX "products_status_orderCount_idx" ON "products"("status", "orderCount");
CREATE INDEX "products_status_salePrice_idx" ON "products"("status", "salePrice");
