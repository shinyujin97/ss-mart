import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, slug, brandId, shortDescription, basePrice, salePrice, categoryIds, options, images, isNew, isBest, isFeatured, embroideryAvailable, bulkOrderAvailable, status } = body;

  if (!name || !slug || !brandId || !basePrice || !salePrice) {
    return NextResponse.json({ error: "필수 항목을 모두 입력하세요" }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "이미 사용 중인 슬러그입니다" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      brandId,
      shortDescription: shortDescription || null,
      basePrice: Number(basePrice),
      salePrice: Number(salePrice),
      isNew: isNew ?? false,
      isBest: isBest ?? false,
      isFeatured: isFeatured ?? false,
      embroideryAvailable: embroideryAvailable ?? true,
      bulkOrderAvailable: bulkOrderAvailable ?? true,
      status: status ?? "ACTIVE",
      categories: {
        create: (categoryIds ?? []).map((categoryId: string) => ({ categoryId })),
      },
      options: {
        create: (options ?? []).flatMap((opt: { color: string; colorHex: string; sizes: string[] }) =>
          opt.sizes.map((size: string) => ({
            color: opt.color,
            colorHex: opt.colorHex,
            size,
            sku: `${slug}-${opt.color}-${size}`.toLowerCase().replace(/\s+/g, "-"),
            stockQuantity: 0,
          }))
        ),
      },
      images: {
        create: (images ?? []).map((img: { url: string; altText?: string; isMain?: boolean }, idx: number) => ({
          url: img.url,
          altText: img.altText || name,
          sortOrder: idx,
          isMain: img.isMain ?? false,
        })),
      },
    },
  });

  return NextResponse.json({ id: product.id }, { status: 201 });
}
