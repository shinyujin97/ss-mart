-- CreateEnum
CREATE TYPE "MemberType" AS ENUM ('INDIVIDUAL', 'BUSINESS');

-- CreateEnum
CREATE TYPE "MemberGrade" AS ENUM ('FAMILY', 'FRIEND', 'VIP', 'VVIP');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'WITHDRAWN', 'DORMANT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'UNDISCLOSED');

-- CreateEnum
CREATE TYPE "CertificationType" AS ENUM ('KCS', 'KS', 'FLAME_RETARDANT', 'ANTI_STATIC', 'KF94', 'KF80', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "Season" AS ENUM ('ALL_SEASON', 'SPRING_FALL', 'SUMMER', 'WINTER');

-- CreateEnum
CREATE TYPE "Industry" AS ENUM ('CONSTRUCTION', 'MANUFACTURING', 'LOGISTICS', 'FOOD_SERVICE', 'MEDICAL', 'CLEANING', 'AGRICULTURE', 'OTHER');

-- CreateEnum
CREATE TYPE "EmbroideryDesignSource" AS ENUM ('SIMULATOR', 'DESIGNER', 'UPLOADED');

-- CreateEnum
CREATE TYPE "EmbroideryStatus" AS ENUM ('DRAFT', 'REVIEW_PENDING', 'REVIEW_IN_PROGRESS', 'CUSTOMER_REVIEW', 'REVISION_REQUESTED', 'CONFIRMED', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EmbroideryType" AS ENUM ('COMPUTER', 'PATCH', 'APPLIQUE', 'REAL_PATCH', 'VELCRO', 'CHARACTER', 'SILK_PRINT');

-- CreateEnum
CREATE TYPE "EmbroideryPosition" AS ENUM ('LEFT_CHEST', 'RIGHT_CHEST', 'BACK_CENTER', 'BACK_TOP', 'LEFT_SLEEVE', 'RIGHT_SLEEVE', 'MULTIPLE');

-- CreateEnum
CREATE TYPE "EmbroiderySize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'XLARGE', 'XXLARGE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'DESIGN_REVIEW', 'IN_PRODUCTION', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CONFIRMED', 'CANCELLED', 'REFUND_REQUESTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "EmbroideryItemStatus" AS ENUM ('PENDING_REVIEW', 'IN_DESIGN', 'CUSTOMER_REVIEW', 'CONFIRMED', 'IN_PRODUCTION', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ShippingType" AS ENUM ('STANDARD', 'EARLY_MORNING', 'BULK_SPLIT');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT_CARD', 'EASY_PAY', 'BANK_TRANSFER', 'VIRTUAL_ACCOUNT', 'TAX_INVOICE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'CANCELLED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_REVIEW', 'QUOTED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "BulkOrderStatus" AS ENUM ('CONTRACT_PENDING', 'CONTRACT_SIGNED', 'DESIGN_IN_PROGRESS', 'PRODUCTION_PENDING', 'IN_PRODUCTION', 'PARTIAL_DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('ACTIVE', 'HIDDEN', 'REPORTED', 'DELETED');

-- CreateEnum
CREATE TYPE "PointType" AS ENUM ('EARN_SIGNUP', 'EARN_PURCHASE', 'EARN_REVIEW', 'EARN_BIRTHDAY', 'EARN_EVENT', 'USE_PURCHASE', 'EXPIRE', 'ADMIN_ADJUST');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('SIGNUP_WELCOME', 'FIRST_PURCHASE', 'BIRTHDAY', 'EVENT', 'ADMIN_GIFT', 'BULK_DISCOUNT');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('FIXED_AMOUNT', 'PERCENTAGE', 'FREE_SHIPPING', 'FREE_EMBROIDERY');

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "type" "MemberType" NOT NULL DEFAULT 'INDIVIDUAL',
    "grade" "MemberGrade" NOT NULL DEFAULT 'FAMILY',
    "birthDate" TIMESTAMP(3),
    "gender" "Gender",
    "marketingEmail" BOOLEAN NOT NULL DEFAULT false,
    "marketingSms" BOOLEAN NOT NULL DEFAULT false,
    "points" INTEGER NOT NULL DEFAULT 2000,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "withdrawnAt" TIMESTAMP(3),
    "withdrawnReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_info" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "businessNumber" TEXT NOT NULL,
    "representativeName" TEXT NOT NULL,
    "industry" TEXT,
    "businessType" TEXT,
    "taxInvoiceEmail" TEXT NOT NULL,
    "creditLimit" INTEGER NOT NULL DEFAULT 0,
    "creditEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "addressDetail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKr" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "iconUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT,
    "basePrice" INTEGER NOT NULL,
    "salePrice" INTEGER NOT NULL,
    "costPrice" INTEGER,
    "embroideryAvailable" BOOLEAN NOT NULL DEFAULT true,
    "embroideryTypes" "EmbroideryType"[],
    "bulkOrderAvailable" BOOLEAN NOT NULL DEFAULT true,
    "bulkMinQuantity" INTEGER NOT NULL DEFAULT 100,
    "season" "Season"[],
    "industries" "Industry"[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "isBest" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("productId","categoryId")
);

-- CreateTable
CREATE TABLE "product_options" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "colorHex" TEXT,
    "size" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
    "priceAdjust" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "CertificationType" NOT NULL,
    "number" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embroidery_designs" (
    "id" TEXT NOT NULL,
    "designNumber" TEXT NOT NULL,
    "memberId" TEXT,
    "orderItemId" TEXT,
    "designType" "EmbroideryDesignSource" NOT NULL,
    "status" "EmbroideryStatus" NOT NULL DEFAULT 'DRAFT',
    "embroideryType" "EmbroideryType" NOT NULL,
    "position" "EmbroideryPosition" NOT NULL,
    "size" "EmbroiderySize" NOT NULL,
    "textContent" TEXT,
    "logoImageUrl" TEXT,
    "designImageUrl" TEXT,
    "notes" TEXT,
    "unitPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" INTEGER NOT NULL,
    "isCharacterDesign" BOOLEAN NOT NULL DEFAULT false,
    "copyrightApproved" BOOLEAN NOT NULL DEFAULT false,
    "copyrightNotes" TEXT,
    "designerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "productionStartedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "embroidery_designs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "embroideryDesignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "addressDetail" TEXT,
    "deliveryMemo" TEXT,
    "shippingType" "ShippingType" NOT NULL DEFAULT 'STANDARD',
    "shippingFee" INTEGER NOT NULL DEFAULT 0,
    "subtotal" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "embroideryFee" INTEGER NOT NULL DEFAULT 0,
    "pointsUsed" INTEGER NOT NULL DEFAULT 0,
    "couponDiscount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "hasEmbroidery" BOOLEAN NOT NULL DEFAULT false,
    "bulkOrderId" TEXT,
    "paidAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productSnapshot" JSONB NOT NULL,
    "optionId" TEXT NOT NULL,
    "optionSnapshot" JSONB NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "embroideryFee" INTEGER NOT NULL DEFAULT 0,
    "embroideryStatus" "EmbroideryItemStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" INTEGER NOT NULL,
    "pgProvider" TEXT NOT NULL,
    "pgTransactionId" TEXT,
    "pgApprovalNumber" TEXT,
    "cardCompany" TEXT,
    "installmentMonths" INTEGER DEFAULT 0,
    "taxInvoiceRequested" BOOLEAN NOT NULL DEFAULT false,
    "taxInvoiceIssued" BOOLEAN NOT NULL DEFAULT false,
    "taxInvoiceNumber" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "carrier" TEXT,
    "status" TEXT NOT NULL,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "memberId" TEXT,
    "companyName" TEXT NOT NULL,
    "businessNumber" TEXT,
    "managerName" TEXT NOT NULL,
    "managerPosition" TEXT,
    "managerPhone" TEXT NOT NULL,
    "managerEmail" TEXT NOT NULL,
    "categories" JSONB NOT NULL,
    "sizeQuantities" JSONB NOT NULL,
    "totalQuantity" INTEGER NOT NULL,
    "embroideryRequested" BOOLEAN NOT NULL DEFAULT false,
    "embroideryType" "EmbroideryType",
    "embroideryPosition" "EmbroideryPosition",
    "embroideryContent" TEXT,
    "logoFileUrl" TEXT,
    "desiredDeliveryDate" TIMESTAMP(3),
    "budgetRange" TEXT,
    "paymentMethod" TEXT,
    "additionalNotes" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'PENDING',
    "assignedManagerId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "quotedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "quotedAmount" INTEGER,
    "quotedDocumentUrl" TEXT,
    "quoteNotes" TEXT,
    "bulkOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_orders" (
    "id" TEXT NOT NULL,
    "bulkOrderNumber" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "quoteRequestId" TEXT NOT NULL,
    "status" "BulkOrderStatus" NOT NULL DEFAULT 'CONTRACT_PENDING',
    "totalQuantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "embroideryFee" INTEGER NOT NULL DEFAULT 0,
    "shippingFee" INTEGER NOT NULL DEFAULT 0,
    "taxAmount" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "paymentTerms" TEXT NOT NULL,
    "taxInvoiceRequested" BOOLEAN NOT NULL DEFAULT true,
    "designsConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "designConfirmedAt" TIMESTAMP(3),
    "contractedAt" TIMESTAMP(3),
    "productionStartedAt" TIMESTAMP(3),
    "expectedDeliveryDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "splitShipping" BOOLEAN NOT NULL DEFAULT false,
    "splitShipmentInfo" JSONB,
    "managerId" TEXT,
    "managerName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulk_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "tags" JSONB NOT NULL,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "status" "ReviewStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_images" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_history" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" "PointType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "relatedOrderId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "minOrderAmount" INTEGER NOT NULL DEFAULT 0,
    "maxDiscountAmount" INTEGER,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "perMemberLimit" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_coupons" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");

-- CreateIndex
CREATE UNIQUE INDEX "members_phone_key" ON "members"("phone");

-- CreateIndex
CREATE INDEX "members_email_idx" ON "members"("email");

-- CreateIndex
CREATE INDEX "members_phone_idx" ON "members"("phone");

-- CreateIndex
CREATE INDEX "members_status_idx" ON "members"("status");

-- CreateIndex
CREATE UNIQUE INDEX "business_info_memberId_key" ON "business_info"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "business_info_businessNumber_key" ON "business_info"("businessNumber");

-- CreateIndex
CREATE INDEX "business_info_businessNumber_idx" ON "business_info"("businessNumber");

-- CreateIndex
CREATE INDEX "addresses_memberId_idx" ON "addresses"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE INDEX "brands_slug_idx" ON "brands"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_slug_idx" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_brandId_idx" ON "products"("brandId");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "products_isNew_isBest_isFeatured_idx" ON "products"("isNew", "isBest", "isFeatured");

-- CreateIndex
CREATE UNIQUE INDEX "product_options_sku_key" ON "product_options"("sku");

-- CreateIndex
CREATE INDEX "product_options_productId_idx" ON "product_options"("productId");

-- CreateIndex
CREATE INDEX "product_options_sku_idx" ON "product_options"("sku");

-- CreateIndex
CREATE INDEX "product_images_productId_idx" ON "product_images"("productId");

-- CreateIndex
CREATE INDEX "certifications_productId_idx" ON "certifications"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "embroidery_designs_designNumber_key" ON "embroidery_designs"("designNumber");

-- CreateIndex
CREATE INDEX "embroidery_designs_memberId_idx" ON "embroidery_designs"("memberId");

-- CreateIndex
CREATE INDEX "embroidery_designs_orderItemId_idx" ON "embroidery_designs"("orderItemId");

-- CreateIndex
CREATE INDEX "embroidery_designs_status_idx" ON "embroidery_designs"("status");

-- CreateIndex
CREATE INDEX "embroidery_designs_designNumber_idx" ON "embroidery_designs"("designNumber");

-- CreateIndex
CREATE INDEX "cart_items_memberId_idx" ON "cart_items"("memberId");

-- CreateIndex
CREATE INDEX "wishlists_memberId_idx" ON "wishlists"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_memberId_productId_key" ON "wishlists"("memberId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_memberId_idx" ON "orders"("memberId");

-- CreateIndex
CREATE INDEX "orders_orderNumber_idx" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_bulkOrderId_idx" ON "orders"("bulkOrderId");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_orderId_key" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "payments_pgTransactionId_idx" ON "payments"("pgTransactionId");

-- CreateIndex
CREATE INDEX "refunds_orderId_idx" ON "refunds"("orderId");

-- CreateIndex
CREATE INDEX "shipments_orderId_idx" ON "shipments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "quote_requests_requestNumber_key" ON "quote_requests"("requestNumber");

-- CreateIndex
CREATE UNIQUE INDEX "quote_requests_bulkOrderId_key" ON "quote_requests"("bulkOrderId");

-- CreateIndex
CREATE INDEX "quote_requests_memberId_idx" ON "quote_requests"("memberId");

-- CreateIndex
CREATE INDEX "quote_requests_status_idx" ON "quote_requests"("status");

-- CreateIndex
CREATE INDEX "quote_requests_requestNumber_idx" ON "quote_requests"("requestNumber");

-- CreateIndex
CREATE UNIQUE INDEX "bulk_orders_bulkOrderNumber_key" ON "bulk_orders"("bulkOrderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "bulk_orders_quoteRequestId_key" ON "bulk_orders"("quoteRequestId");

-- CreateIndex
CREATE INDEX "bulk_orders_memberId_idx" ON "bulk_orders"("memberId");

-- CreateIndex
CREATE INDEX "bulk_orders_status_idx" ON "bulk_orders"("status");

-- CreateIndex
CREATE INDEX "bulk_orders_bulkOrderNumber_idx" ON "bulk_orders"("bulkOrderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_orderItemId_key" ON "reviews"("orderItemId");

-- CreateIndex
CREATE INDEX "reviews_productId_idx" ON "reviews"("productId");

-- CreateIndex
CREATE INDEX "reviews_memberId_idx" ON "reviews"("memberId");

-- CreateIndex
CREATE INDEX "review_images_reviewId_idx" ON "review_images"("reviewId");

-- CreateIndex
CREATE INDEX "point_history_memberId_idx" ON "point_history"("memberId");

-- CreateIndex
CREATE INDEX "point_history_expiresAt_idx" ON "point_history"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_code_idx" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "member_coupons_memberId_idx" ON "member_coupons"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "member_coupons_memberId_couponId_key" ON "member_coupons"("memberId", "couponId");

-- AddForeignKey
ALTER TABLE "business_info" ADD CONSTRAINT "business_info_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "embroidery_designs" ADD CONSTRAINT "embroidery_designs_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "embroidery_designs" ADD CONSTRAINT "embroidery_designs_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "product_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_bulkOrderId_fkey" FOREIGN KEY ("bulkOrderId") REFERENCES "bulk_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "product_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_orders" ADD CONSTRAINT "bulk_orders_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_orders" ADD CONSTRAINT "bulk_orders_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "quote_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_images" ADD CONSTRAINT "review_images_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_history" ADD CONSTRAINT "point_history_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_coupons" ADD CONSTRAINT "member_coupons_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_coupons" ADD CONSTRAINT "member_coupons_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
