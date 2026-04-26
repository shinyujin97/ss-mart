import { PrismaClient } from "../../src/generated/prisma/client";

// 개발 환경 전용 테스트 상품
export async function seedProducts(prisma: PrismaClient) {
  console.log("  테스트 상품 시드 시작...");

  const piozen = await prisma.brand.findUnique({ where: { slug: "piozen" } });
  const carhartt = await prisma.brand.findUnique({ where: { slug: "carhartt" } });
  const k2 = await prisma.brand.findUnique({ where: { slug: "k2-safety" } });
  const m3 = await prisma.brand.findUnique({ where: { slug: "3m" } });
  const workwearTop = await prisma.category.findUnique({ where: { slug: "workwear-top" } });
  const safetyShoes = await prisma.category.findUnique({ where: { slug: "safety-shoes" } });
  const mask = await prisma.category.findUnique({ where: { slug: "mask" } });

  const testProducts = [
    {
      slug: "piozen-ws-001",
      brandId: piozen!.id,
      name: "피오젠 하계 작업복 상의 WS-001",
      shortDescription: "통기성 뛰어난 하계 작업복. 현장에서 검증된 내구성.",
      basePrice: 45000,
      salePrice: 38000,
      isNew: true,
      isBest: true,
      categoryIds: [workwearTop!.id],
      colors: [
        { color: "NAVY", colorHex: "#1a2a4a", sizes: ["S", "M", "L", "XL", "2XL", "3XL"] },
        { color: "BLACK", colorHex: "#111111", sizes: ["S", "M", "L", "XL", "2XL"] },
        { color: "GRAY", colorHex: "#8a8a8a", sizes: ["M", "L", "XL"] },
      ],
      season: ["SPRING_FALL", "SUMMER"] as const,
    },
    {
      slug: "carhartt-j001",
      brandId: carhartt!.id,
      name: "칼하트 덕 캔버스 작업복 자켓 J001",
      shortDescription: "100년 전통의 미국 작업복 브랜드. 덕 캔버스 소재의 내구성.",
      basePrice: 120000,
      salePrice: 98000,
      isNew: false,
      isBest: true,
      isFeatured: true,
      categoryIds: [workwearTop!.id],
      colors: [
        { color: "BROWN", colorHex: "#8B4513", sizes: ["S", "M", "L", "XL", "2XL"] },
        { color: "BLACK", colorHex: "#111111", sizes: ["S", "M", "L", "XL"] },
      ],
      season: ["SPRING_FALL", "WINTER"] as const,
    },
    {
      slug: "k2-sf-001",
      brandId: k2!.id,
      name: "K2 안전화 스틸토 SF-001",
      shortDescription: "KCs 인증 스틸토 안전화. 미끄럼 방지 솔.",
      basePrice: 75000,
      salePrice: 65000,
      isNew: true,
      isBest: false,
      categoryIds: [safetyShoes!.id],
      colors: [
        { color: "BLACK", colorHex: "#111111", sizes: ["240", "250", "260", "270", "275", "280", "285", "290"] },
        { color: "BROWN", colorHex: "#8B4513", sizes: ["250", "260", "270", "280", "290"] },
      ],
      season: ["ALL_SEASON"] as const,
      certType: "KCS",
      certNumber: "제 22-KS-00123호",
    },
    {
      slug: "3m-kf94-001",
      brandId: m3!.id,
      name: "3M KF94 보건용 마스크 (50매)",
      shortDescription: "KF94 인증. 대형 / 중형 / 소형 선택 가능.",
      basePrice: 35000,
      salePrice: 28000,
      isNew: false,
      isBest: true,
      categoryIds: [mask!.id],
      colors: [
        { color: "WHITE", colorHex: "#ffffff", sizes: ["대형", "중형", "소형"] },
      ],
      season: ["ALL_SEASON"] as const,
      certType: "KF94",
      certNumber: "제 KF94-2022-00456호",
      embroideryAvailable: false,
    },
    {
      slug: "piozen-cargo-001",
      brandId: piozen!.id,
      name: "피오젠 카고 작업 바지 CP-001",
      shortDescription: "다용도 포켓, 내구성 원단. 현장 필수템.",
      basePrice: 39000,
      salePrice: 32000,
      isNew: false,
      isBest: true,
      categoryIds: [workwearTop!.id],
      colors: [
        { color: "NAVY", colorHex: "#1a2a4a", sizes: ["28", "30", "32", "34", "36", "38"] },
        { color: "KHAKI", colorHex: "#8B8B4B", sizes: ["28", "30", "32", "34", "36"] },
        { color: "BLACK", colorHex: "#111111", sizes: ["28", "30", "32", "34", "36", "38"] },
      ],
      season: ["ALL_SEASON"] as const,
    },
  ];

  for (const p of testProducts) {
    const { categoryIds, colors, season, certType, certNumber, embroideryAvailable, ...productData } = p;

    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) continue;

    const product = await prisma.product.create({
      data: {
        ...productData,
        embroideryAvailable: embroideryAvailable ?? true,
        season: season as any,
        categories: {
          create: categoryIds.map((id) => ({ categoryId: id })),
        },
        options: {
          create: colors.flatMap((c) =>
            c.sizes.map((size) => ({
              color: c.color,
              colorHex: c.colorHex,
              size,
              sku: `${p.slug}-${c.color}-${size}`.toUpperCase(),
              stockQuantity: Math.floor(Math.random() * 50) + 10,
            }))
          ),
        },
        ...(certType && certNumber
          ? {
              certifications: {
                create: [{ type: certType as any, number: certNumber }],
              },
            }
          : {}),
      },
    });

    // 메인 이미지 플레이스홀더
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: `https://placehold.co/600x600/f4f4f4/8a8a8a?text=${encodeURIComponent(product.name)}`,
        isMain: true,
        sortOrder: 0,
      },
    });
  }

  console.log(`  ✓ 테스트 상품 시드 완료 (${testProducts.length}개)`);
}
