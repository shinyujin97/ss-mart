# 데이터베이스 스키마 (Database Schema)

> PostgreSQL 16+ 기준. ORM은 Prisma를 가정.

## ERD 개요

```
┌─────────────┐         ┌─────────────┐
│   members   │         │   brands    │
│  (회원)      │         │  (브랜드)    │
└──────┬──────┘         └──────┬──────┘
       │                        │
       │                        │
       │                ┌───────▼──────────┐
       │                │   products       │◀──────┐
       │                │  (상품)           │       │
       │                └───────┬──────────┘       │
       │                        │                  │
       │                        ▼                  │
       │                ┌──────────────────┐       │
       │                │ product_options  │       │
       │                │  (색상/사이즈)    │       │
       │                └──────────────────┘       │
       │                                            │
       ▼                                            │
┌──────────────┐    ┌──────────────────────────┐   │
│   orders     │───▶│      order_items          │───┘
│   (주문)      │    │     (주문 상품)            │
└──────┬───────┘    └─────────┬─────────────────┘
       │                      │
       │                      ▼
       │              ┌──────────────────────────┐
       │              │  embroidery_designs       │
       │              │   (자수 시안 ★)            │
       │              └───────────────────────────┘
       ▼
┌──────────────┐
│  payments    │
│   (결제)      │
└──────────────┘

┌──────────────────┐
│ quote_requests   │      ┌────────────────┐
│  (단체주문 견적)   │─────▶│  bulk_orders    │
└──────────────────┘      │  (단체주문 ★)   │
                          └────────────────┘
```

## Prisma Schema 전체 (`prisma/schema.prisma`)

```prisma
// ============================================================================
// Generator & Datasource
// ============================================================================
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// 1. 회원 (Members)
// ============================================================================
model Member {
  id              String       @id @default(cuid())
  email           String       @unique
  passwordHash    String
  name            String
  phone           String       @unique
  type            MemberType   @default(INDIVIDUAL)
  grade           MemberGrade  @default(FAMILY)

  // 개인 정보
  birthDate       DateTime?
  gender          Gender?

  // 사업자 정보 (BUSINESS 회원만)
  businessInfo    BusinessInfo?

  // 마케팅 동의
  marketingEmail  Boolean      @default(false)
  marketingSms    Boolean      @default(false)

  // 적립금
  points          Int          @default(2000)  // 가입 즉시 2000P

  // 통계
  totalOrders     Int          @default(0)
  totalAmount     Int          @default(0)
  lastLoginAt     DateTime?

  // 상태
  status          MemberStatus @default(ACTIVE)
  withdrawnAt     DateTime?
  withdrawnReason String?

  // 주소
  addresses       Address[]

  // 관계
  orders          Order[]
  cartItems       CartItem[]
  wishlist        Wishlist[]
  reviews         Review[]
  quoteRequests   QuoteRequest[]
  bulkOrders      BulkOrder[]
  embroideryDesigns EmbroideryDesign[]
  pointHistory    PointHistory[]
  coupons         MemberCoupon[]

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([email])
  @@index([phone])
  @@index([status])
  @@map("members")
}

model BusinessInfo {
  id                  String  @id @default(cuid())
  memberId            String  @unique
  member              Member  @relation(fields: [memberId], references: [id], onDelete: Cascade)
  companyName         String
  businessNumber      String  @unique  // 사업자등록번호 (암호화 저장 권장)
  representativeName  String
  industry            String?
  businessType        String?
  taxInvoiceEmail     String

  // 신용 거래 정보 (협의 후)
  creditLimit         Int     @default(0)
  creditEnabled       Boolean @default(false)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([businessNumber])
  @@map("business_info")
}

model Address {
  id          String   @id @default(cuid())
  memberId    String
  member      Member   @relation(fields: [memberId], references: [id], onDelete: Cascade)

  label       String   // "우리집", "회사" 등
  isDefault   Boolean  @default(false)

  recipientName String
  recipientPhone String
  zipCode     String
  address     String   // 기본 주소
  addressDetail String? // 상세 주소

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([memberId])
  @@map("addresses")
}

enum MemberType {
  INDIVIDUAL
  BUSINESS
}

enum MemberGrade {
  FAMILY    // 0~30만원
  FRIEND    // 30만원+
  VIP       // 100만원+
  VVIP      // 500만원+
}

enum MemberStatus {
  ACTIVE
  SUSPENDED
  WITHDRAWN
  DORMANT     // 1년 미접속
}

enum Gender {
  MALE
  FEMALE
  UNDISCLOSED
}

// ============================================================================
// 2. 브랜드 / 카테고리 / 상품
// ============================================================================
model Brand {
  id          String   @id @default(cuid())
  slug        String   @unique  // "piozen", "carhartt"
  name        String   @unique  // "PIOZEN", "CARHARTT"
  nameKr      String   // "피오젠", "칼하트"
  logoUrl     String?
  description String?  @db.Text
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)

  products    Product[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([slug])
  @@map("brands")
}

model Category {
  id          String     @id @default(cuid())
  slug        String     @unique  // "workwear", "safety-shoes"
  name        String     // "작업복"
  parentId    String?
  parent      Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryTree")
  level       Int        @default(0)
  sortOrder   Int        @default(0)
  isActive    Boolean    @default(true)
  iconUrl     String?

  products    ProductCategory[]

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([slug])
  @@index([parentId])
  @@map("categories")
}

model Product {
  id              String          @id @default(cuid())
  slug            String          @unique
  brandId         String
  brand           Brand           @relation(fields: [brandId], references: [id])

  name            String
  shortDescription String?
  description     String?         @db.Text  // 마크다운 가능

  // 가격
  basePrice       Int             // 정가
  salePrice       Int             // 판매가 (할인 적용)
  costPrice       Int?            // 원가 (관리자만)

  // 자수 가능 여부
  embroideryAvailable  Boolean    @default(true)
  embroideryTypes      EmbroideryType[]  // 가능한 자수 종류

  // 단체주문 가능
  bulkOrderAvailable   Boolean    @default(true)
  bulkMinQuantity      Int        @default(100)

  // 인증
  certifications  Certification[]

  // 시즌
  season          Season[]        // SPRING_FALL, SUMMER, WINTER, ALL_SEASON

  // 직군 (검색 / 필터용)
  industries      Industry[]      // CONSTRUCTION, MANUFACTURING, ...

  // 통계
  viewCount       Int             @default(0)
  orderCount      Int             @default(0)
  reviewCount     Int             @default(0)
  averageRating   Float           @default(0)

  // 상태
  status          ProductStatus   @default(ACTIVE)
  isNew           Boolean         @default(false)
  isBest          Boolean         @default(false)
  isFeatured      Boolean         @default(false)

  // SEO
  metaTitle       String?
  metaDescription String?

  // 관계
  categories      ProductCategory[]
  options         ProductOption[]
  images          ProductImage[]
  reviews         Review[]
  cartItems       CartItem[]
  orderItems      OrderItem[]
  wishlist        Wishlist[]

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([slug])
  @@index([brandId])
  @@index([status])
  @@index([isNew, isBest, isFeatured])
  @@map("products")
}

model ProductCategory {
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([productId, categoryId])
  @@map("product_categories")
}

model ProductOption {
  id            String    @id @default(cuid())
  productId     String
  product       Product   @relation(fields: [productId], references: [id], onDelete: Cascade)

  color         String    // "BLACK", "NAVY", "RED"
  colorHex      String?   // "#1a1a1a"
  size          String    // "S", "M", "L", "XL", "270mm"

  sku           String    @unique  // "PZ-WW-001-BLK-L"
  stockQuantity Int       @default(0)
  reservedQuantity Int    @default(0)  // 결제 진행 중
  lowStockThreshold Int   @default(10)

  priceAdjust   Int       @default(0)  // 옵션별 가격 조정 (예: XL 1000원 추가)

  isActive      Boolean   @default(true)

  cartItems     CartItem[]
  orderItems    OrderItem[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([productId])
  @@index([sku])
  @@map("product_options")
}

model ProductImage {
  id          String   @id @default(cuid())
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  url         String
  altText     String?
  sortOrder   Int      @default(0)
  isMain      Boolean  @default(false)

  createdAt   DateTime @default(now())

  @@index([productId])
  @@map("product_images")
}

model Certification {
  id          String         @id @default(cuid())
  productId   String
  product     Product        @relation(fields: [productId], references: [id], onDelete: Cascade)
  type        CertificationType
  number      String         // "제 17-AB-01234호"
  issuedAt    DateTime?
  expiresAt   DateTime?
  documentUrl String?

  createdAt   DateTime       @default(now())

  @@index([productId])
  @@map("certifications")
}

enum CertificationType {
  KCS         // KCs 인증 (안전화/안전모/마스크)
  KS          // KS 인증
  FLAME_RETARDANT  // 방염
  ANTI_STATIC      // 정전기 방지
  KF94             // 마스크 등급
  KF80
  OTHER
}

enum ProductStatus {
  ACTIVE
  OUT_OF_STOCK
  DISCONTINUED
  HIDDEN
}

enum Season {
  ALL_SEASON
  SPRING_FALL
  SUMMER
  WINTER
}

enum Industry {
  CONSTRUCTION   // 건설/중공업
  MANUFACTURING  // 제조/공장
  LOGISTICS      // 물류/택배
  FOOD_SERVICE   // F&B/주방
  MEDICAL        // 의료/위생
  CLEANING       // 환경미화
  AGRICULTURE    // 농업
  OTHER
}

// ============================================================================
// 3. 자수 시스템 (★ 핵심)
// ============================================================================
model EmbroideryDesign {
  id              String              @id @default(cuid())
  designNumber    String              @unique  // "DESIGN-2026-04-00001"

  memberId        String?             // 회원이 만든 시안 (없으면 비회원)
  member          Member?             @relation(fields: [memberId], references: [id])

  orderItemId     String?             // 주문에 연결된 시안
  orderItem       OrderItem?          @relation(fields: [orderItemId], references: [id])

  // 시안 정보
  designType      EmbroideryDesignSource
  status          EmbroideryStatus    @default(DRAFT)

  // 자수 옵션
  embroideryType  EmbroideryType      // COMPUTER, PATCH 등
  position        EmbroideryPosition  // LEFT_CHEST 등
  size            EmbroiderySize      // SMALL, MEDIUM 등

  // 시안 콘텐츠
  textContent     String?             // 텍스트 자수
  logoImageUrl    String?             // 로고 업로드
  designImageUrl  String?             // 디자이너 작업본
  notes           String?             @db.Text

  // 가격
  unitPrice       Int                 // 자수 단가 (1개당)
  quantity        Int                 @default(1)
  totalPrice      Int                 // 총액

  // 캐릭터 디자인 여부
  isCharacterDesign Boolean           @default(false)
  copyrightApproved Boolean           @default(false)
  copyrightNotes    String?           @db.Text

  // 시안 작업
  designerId      String?             // 담당 디자이너
  reviewedAt      DateTime?
  confirmedAt     DateTime?
  productionStartedAt DateTime?
  completedAt     DateTime?

  // 수정 횟수 (무제한 무료)
  revisionCount   Int                 @default(0)

  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  @@index([memberId])
  @@index([orderItemId])
  @@index([status])
  @@index([designNumber])
  @@map("embroidery_designs")
}

enum EmbroideryDesignSource {
  SIMULATOR    // 시뮬레이터로 만든 시안
  DESIGNER     // 디자이너 작업본
  UPLOADED     // 고객 업로드
}

enum EmbroideryStatus {
  DRAFT              // 임시 저장
  REVIEW_PENDING     // 디자이너 검토 대기
  REVIEW_IN_PROGRESS // 검토 중
  CUSTOMER_REVIEW    // 고객 시안 확인 대기
  REVISION_REQUESTED // 수정 요청
  CONFIRMED          // 시안 확정
  IN_PRODUCTION      // 자수 작업 중
  COMPLETED          // 자수 완료
  CANCELLED          // 취소
  REJECTED           // 저작권 등 거부
}

enum EmbroideryType {
  COMPUTER       // 컴퓨터 자수
  PATCH          // 패치 자수
  APPLIQUE       // 아플리케 자수
  REAL_PATCH     // 실사 패치
  VELCRO         // 벨크로 패치
  CHARACTER      // 캐릭터 디자인
  SILK_PRINT     // 실크 인쇄
}

enum EmbroideryPosition {
  LEFT_CHEST
  RIGHT_CHEST
  BACK_CENTER
  BACK_TOP
  LEFT_SLEEVE
  RIGHT_SLEEVE
  MULTIPLE
}

enum EmbroiderySize {
  SMALL    // 5x5
  MEDIUM   // 8x8
  LARGE    // 10x10
  XLARGE   // 15x15
  XXLARGE  // 20x20 (등판 대형)
}

// ============================================================================
// 4. 장바구니 / 위시리스트
// ============================================================================
model CartItem {
  id              String         @id @default(cuid())
  memberId        String
  member          Member         @relation(fields: [memberId], references: [id], onDelete: Cascade)

  productId       String
  product         Product        @relation(fields: [productId], references: [id])

  optionId        String
  option          ProductOption  @relation(fields: [optionId], references: [id])

  quantity        Int            @default(1)

  // 자수 옵션 (옵셔널)
  embroideryDesignId String?

  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@unique([memberId, productId, optionId, embroideryDesignId])
  @@index([memberId])
  @@map("cart_items")
}

model Wishlist {
  id          String   @id @default(cuid())
  memberId    String
  member      Member   @relation(fields: [memberId], references: [id], onDelete: Cascade)
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())

  @@unique([memberId, productId])
  @@index([memberId])
  @@map("wishlists")
}

// ============================================================================
// 5. 주문 / 결제
// ============================================================================
model Order {
  id              String       @id @default(cuid())
  orderNumber     String       @unique  // "SS-2026-04-260784"

  memberId        String
  member          Member       @relation(fields: [memberId], references: [id])

  status          OrderStatus  @default(PENDING)

  // 배송지 (스냅샷)
  recipientName   String
  recipientPhone  String
  zipCode         String
  address         String
  addressDetail   String?
  deliveryMemo    String?

  // 배송 옵션
  shippingType    ShippingType @default(STANDARD)
  shippingFee     Int          @default(0)

  // 가격
  subtotal        Int          // 상품 합계
  discountAmount  Int          @default(0)  // 할인
  embroideryFee   Int          @default(0)  // 자수 비용
  pointsUsed      Int          @default(0)  // 사용 적립금
  couponDiscount  Int          @default(0)
  totalAmount     Int          // 최종 결제

  // 적립
  pointsEarned    Int          @default(0)

  // 자수 포함 여부 (빠른 조회용)
  hasEmbroidery   Boolean      @default(false)

  // 단체주문 연결
  bulkOrderId     String?
  bulkOrder       BulkOrder?   @relation(fields: [bulkOrderId], references: [id])

  // 시간
  paidAt          DateTime?
  shippedAt       DateTime?
  deliveredAt     DateTime?
  confirmedAt     DateTime?    // 구매 확정
  cancelledAt     DateTime?

  // 관계
  items           OrderItem[]
  payment         Payment?
  shipments       Shipment[]
  refunds         Refund[]

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([memberId])
  @@index([orderNumber])
  @@index([status])
  @@index([bulkOrderId])
  @@map("orders")
}

model OrderItem {
  id              String         @id @default(cuid())
  orderId         String
  order           Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)

  productId       String
  product         Product        @relation(fields: [productId], references: [id])
  productSnapshot Json           // 주문 당시 상품 정보 (이름/가격/이미지)

  optionId        String
  option          ProductOption  @relation(fields: [optionId], references: [id])
  optionSnapshot  Json           // 색상/사이즈

  quantity        Int
  unitPrice       Int            // 주문 시점 가격
  totalPrice      Int

  // 자수 (옵셔널)
  embroideryDesigns EmbroideryDesign[]
  embroideryFee   Int            @default(0)

  // 자수 포함 시 별도 상태
  embroideryStatus EmbroideryItemStatus?

  createdAt       DateTime       @default(now())

  @@index([orderId])
  @@map("order_items")
}

enum OrderStatus {
  PENDING            // 결제 대기
  PAID               // 결제 완료
  DESIGN_REVIEW      // 자수 시안 검토 (자수 포함 시)
  IN_PRODUCTION      // 자수 작업 중
  PREPARING          // 출고 준비
  SHIPPING           // 배송 중
  DELIVERED          // 배송 완료
  CONFIRMED          // 구매 확정
  CANCELLED          // 취소
  REFUND_REQUESTED   // 환불 요청
  REFUNDED           // 환불 완료
}

enum EmbroideryItemStatus {
  PENDING_REVIEW
  IN_DESIGN
  CUSTOMER_REVIEW
  CONFIRMED
  IN_PRODUCTION
  COMPLETED
}

enum ShippingType {
  STANDARD       // 무료 배송
  EARLY_MORNING  // 새벽 배송 +3,000원
  BULK_SPLIT     // 단체 분할 배송
}

// ============================================================================
// 6. 결제 / 환불
// ============================================================================
model Payment {
  id              String        @id @default(cuid())
  orderId         String        @unique
  order           Order         @relation(fields: [orderId], references: [id])

  method          PaymentMethod
  amount          Int

  // PG 정보
  pgProvider      String        // "TOSS", "INICIS"
  pgTransactionId String?
  pgApprovalNumber String?
  cardCompany     String?
  installmentMonths Int?        @default(0)

  // 세금계산서 (B2B)
  taxInvoiceRequested Boolean   @default(false)
  taxInvoiceIssued    Boolean   @default(false)
  taxInvoiceNumber    String?

  status          PaymentStatus @default(PENDING)

  approvedAt      DateTime?
  cancelledAt     DateTime?
  failureReason   String?

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([orderId])
  @@index([pgTransactionId])
  @@map("payments")
}

enum PaymentMethod {
  CREDIT_CARD
  EASY_PAY      // 카카오페이/네이버페이/토스
  BANK_TRANSFER
  VIRTUAL_ACCOUNT  // 무통장입금
  TAX_INVOICE   // B2B 세금계산서
}

enum PaymentStatus {
  PENDING
  APPROVED
  CANCELLED
  FAILED
  REFUNDED
}

model Refund {
  id          String      @id @default(cuid())
  orderId     String
  order       Order       @relation(fields: [orderId], references: [id])

  reason      String
  amount      Int

  status      RefundStatus @default(REQUESTED)
  requestedAt DateTime    @default(now())
  approvedAt  DateTime?
  rejectedAt  DateTime?
  refundedAt  DateTime?

  notes       String?     @db.Text

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([orderId])
  @@map("refunds")
}

enum RefundStatus {
  REQUESTED
  APPROVED
  REJECTED
  COMPLETED
}

model Shipment {
  id              String   @id @default(cuid())
  orderId         String
  order           Order    @relation(fields: [orderId], references: [id])

  trackingNumber  String?
  carrier         String?  // "CJ대한통운", "한진택배"
  status          String

  shippedAt       DateTime?
  deliveredAt     DateTime?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([orderId])
  @@map("shipments")
}

// ============================================================================
// 7. 단체주문 (★ B2B)
// ============================================================================
model QuoteRequest {
  id              String       @id @default(cuid())
  requestNumber   String       @unique  // "SS-Q-2026-04-001"

  memberId        String?
  member          Member?      @relation(fields: [memberId], references: [id])

  // 회사 정보
  companyName     String
  businessNumber  String?
  managerName     String
  managerPosition String?
  managerPhone    String
  managerEmail    String

  // 주문 카테고리 (multi)
  categories      Json         // ["WORKWEAR_TOP", "WORKWEAR_BOTTOM"]

  // 사이즈별 수량
  sizeQuantities  Json         // {"S": 0, "M": 20, "L": 50, ...}
  totalQuantity   Int

  // 자수 옵션
  embroideryRequested Boolean  @default(false)
  embroideryType  EmbroideryType?
  embroideryPosition EmbroideryPosition?
  embroideryContent String?
  logoFileUrl     String?

  // 일정 / 예산
  desiredDeliveryDate DateTime?
  budgetRange     String?      // "500-1000만원"
  paymentMethod   String?      // "TAX_INVOICE", "CARD"

  // 추가 요청
  additionalNotes String?      @db.Text

  // 처리 상태
  status          QuoteStatus  @default(PENDING)
  assignedManagerId String?
  assignedAt      DateTime?
  quotedAt        DateTime?
  expiresAt       DateTime?

  // 견적서
  quotedAmount    Int?
  quotedDocumentUrl String?
  quoteNotes      String?      @db.Text

  // 단체주문 변환
  bulkOrderId     String?      @unique
  bulkOrder       BulkOrder?

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([memberId])
  @@index([status])
  @@index([requestNumber])
  @@map("quote_requests")
}

enum QuoteStatus {
  PENDING            // 신청 접수
  ASSIGNED           // 매니저 배정
  IN_REVIEW          // 검토 중
  QUOTED             // 견적서 발송
  ACCEPTED           // 고객 수락
  REJECTED           // 고객 거절
  EXPIRED            // 견적 유효기간 만료
  CONVERTED          // 단체주문으로 전환
}

model BulkOrder {
  id                String          @id @default(cuid())
  bulkOrderNumber   String          @unique  // "SS-B-2026-04-001"

  memberId          String
  member            Member          @relation(fields: [memberId], references: [id])

  quoteRequestId    String          @unique
  quoteRequest      QuoteRequest    @relation(fields: [quoteRequestId], references: [id])

  status            BulkOrderStatus @default(CONTRACT_PENDING)

  // 수량 / 가격
  totalQuantity     Int
  unitPrice         Int
  embroideryFee     Int             @default(0)
  shippingFee       Int             @default(0)
  taxAmount         Int             // 부가세
  totalAmount       Int

  // 결제
  paymentTerms      String          // "100% 선결제", "50% 선 + 50% 후"
  taxInvoiceRequested Boolean       @default(true)

  // 시안
  designsConfirmed  Boolean         @default(false)
  designConfirmedAt DateTime?

  // 일정
  contractedAt      DateTime?
  productionStartedAt DateTime?
  expectedDeliveryDate DateTime?
  completedAt       DateTime?

  // 분할 배송
  splitShipping     Boolean         @default(false)
  splitShipmentInfo Json?           // 분할 배송 일정

  // 담당 매니저
  managerId         String?
  managerName       String?

  // 관련 주문 (분할 시)
  orders            Order[]

  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@index([memberId])
  @@index([status])
  @@index([bulkOrderNumber])
  @@map("bulk_orders")
}

enum BulkOrderStatus {
  CONTRACT_PENDING
  CONTRACT_SIGNED
  DESIGN_IN_PROGRESS
  PRODUCTION_PENDING
  IN_PRODUCTION
  PARTIAL_DELIVERED
  COMPLETED
  CANCELLED
}

// ============================================================================
// 8. 리뷰
// ============================================================================
model Review {
  id          String     @id @default(cuid())
  memberId    String
  member      Member     @relation(fields: [memberId], references: [id])
  productId   String
  product     Product    @relation(fields: [productId], references: [id])
  orderItemId String     @unique

  rating      Int        // 1~5
  title       String?
  content     String     @db.Text

  // 태그 (사이즈/색상/자수 등)
  tags        Json       // ["사이즈 L", "색상 BLACK", "자수 추가"]

  // 이미지
  images      ReviewImage[]

  // 통계
  helpfulCount Int       @default(0)
  reportCount  Int       @default(0)

  // 적립
  pointsEarned Int       @default(0)

  status      ReviewStatus @default(ACTIVE)

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([productId])
  @@index([memberId])
  @@map("reviews")
}

model ReviewImage {
  id          String   @id @default(cuid())
  reviewId    String
  review      Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  url         String
  sortOrder   Int      @default(0)

  createdAt   DateTime @default(now())

  @@index([reviewId])
  @@map("review_images")
}

enum ReviewStatus {
  ACTIVE
  HIDDEN
  REPORTED
  DELETED
}

// ============================================================================
// 9. 적립금 / 쿠폰
// ============================================================================
model PointHistory {
  id          String        @id @default(cuid())
  memberId    String
  member      Member        @relation(fields: [memberId], references: [id])

  type        PointType
  amount      Int           // + 적립, - 사용
  balance     Int           // 거래 후 잔액

  reason      String        // "주문 적립", "쿠폰 사용", "리뷰 작성" 등
  relatedOrderId String?

  expiresAt   DateTime?     // 1년 후 만료

  createdAt   DateTime      @default(now())

  @@index([memberId])
  @@index([expiresAt])
  @@map("point_history")
}

enum PointType {
  EARN_SIGNUP        // 가입
  EARN_PURCHASE      // 구매
  EARN_REVIEW        // 리뷰
  EARN_BIRTHDAY      // 생일
  EARN_EVENT         // 이벤트
  USE_PURCHASE       // 사용
  EXPIRE             // 만료
  ADMIN_ADJUST       // 관리자 조정
}

model Coupon {
  id          String       @id @default(cuid())
  code        String       @unique  // "SS-WELCOME10"
  name        String

  type        CouponType
  discountType DiscountType
  discountValue Int        // 할인 금액 또는 %

  minOrderAmount Int       @default(0)
  maxDiscountAmount Int?   // 최대 할인 한도

  validFrom   DateTime
  validUntil  DateTime

  usageLimit  Int?         // 전체 사용 한도
  usedCount   Int          @default(0)
  perMemberLimit Int       @default(1)  // 회원당 사용 횟수

  isActive    Boolean      @default(true)

  memberCoupons MemberCoupon[]

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([code])
  @@map("coupons")
}

model MemberCoupon {
  id          String   @id @default(cuid())
  memberId    String
  member      Member   @relation(fields: [memberId], references: [id])
  couponId    String
  coupon      Coupon   @relation(fields: [couponId], references: [id])

  usedAt      DateTime?
  expiresAt   DateTime

  createdAt   DateTime @default(now())

  @@unique([memberId, couponId])
  @@index([memberId])
  @@map("member_coupons")
}

enum CouponType {
  SIGNUP_WELCOME
  FIRST_PURCHASE
  BIRTHDAY
  EVENT
  ADMIN_GIFT
  BULK_DISCOUNT     // 단체주문용
}

enum DiscountType {
  FIXED_AMOUNT      // 5,000원 할인
  PERCENTAGE        // 10% 할인
  FREE_SHIPPING     // 배송비 무료 (이미 무료지만 향후 확장)
  FREE_EMBROIDERY   // 자수 무료
}
```

## 인덱스 전략

### 자주 검색되는 컬럼
- `members.email`, `members.phone` (로그인 / 회원 검색)
- `products.slug` (URL 라우팅)
- `products.brandId`, `products.status` (브랜드별 / 상태별)
- `orders.orderNumber`, `orders.memberId` (주문 조회)
- `embroidery_designs.status`, `embroidery_designs.designNumber`

### 풀텍스트 검색 (PostgreSQL)
```sql
-- 상품 검색용 인덱스
CREATE INDEX idx_products_search ON products
  USING GIN (to_tsvector('simple',
    name || ' ' || COALESCE(short_description, '')
  ));
```

## 트리거 / 함수

### 1. 주문번호 자동 생성
```sql
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  current_date TEXT := to_char(NOW(), 'YYYY-MM-DD');
  sequence_num INT;
BEGIN
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM orders
  WHERE created_at::date = NOW()::date;

  RETURN 'SS-' || current_date || '-' || LPAD(sequence_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;
```

### 2. 적립금 잔액 동기화
```sql
-- members.points 컬럼은 항상 point_history의 합과 일치해야 함
-- 트리거 또는 애플리케이션 레벨에서 동기화
```

### 3. 재고 차감 락
```sql
-- 결제 시 재고 차감은 SELECT FOR UPDATE 로 동시성 제어
BEGIN;
SELECT stock_quantity FROM product_options
  WHERE id = $1 FOR UPDATE;
-- 재고 확인 후 차감
UPDATE product_options SET stock_quantity = stock_quantity - $2
  WHERE id = $1;
COMMIT;
```

## 마이그레이션 전략

### 초기 마이그레이션 순서
1. 회원 / 인증 (members, business_info, addresses)
2. 카테고리 / 브랜드 (categories, brands)
3. 상품 / 옵션 / 이미지 (products, product_options, product_images)
4. 인증 정보 (certifications)
5. 자수 시안 (embroidery_designs)
6. 장바구니 / 위시리스트 (cart_items, wishlists)
7. 주문 / 결제 (orders, order_items, payments)
8. 단체주문 (quote_requests, bulk_orders)
9. 리뷰 / 적립금 (reviews, point_history, coupons)

### 시드 데이터 (`prisma/seed.ts`)
- 카테고리 트리 전체
- 브랜드 80여 개
- 인증 종류 마스터
- 기본 쿠폰 (SS-WELCOME10 등)
- 테스트 상품 100~200개
- 테스트 회원 (개인 / 법인)
