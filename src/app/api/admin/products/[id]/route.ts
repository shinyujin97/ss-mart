import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      brand: { select: { id: true, name: true, nameKr: true } },
      categories: { select: { categoryId: true } },
      options: { orderBy: [{ color: "asc" }, { size: "asc" }] },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!product) return NextResponse.json({ error: "상품 없음" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, slug, brandId, shortDescription, basePrice, salePrice, categoryIds, options, images, isNew, isBest, isFeatured, embroideryAvailable, bulkOrderAvailable, status } = body;

  // 슬러그 중복 확인 (자기 자신 제외)
  if (slug) {
    const existing = await prisma.product.findFirst({ where: { slug, NOT: { id } } });
    if (existing) return NextResponse.json({ error: "이미 사용 중인 슬러그입니다" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    // 기본 정보 업데이트
    await tx.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(brandId && { brandId }),
        shortDescription: shortDescription ?? undefined,
        ...(basePrice !== undefined && { basePrice: Number(basePrice) }),
        ...(salePrice !== undefined && { salePrice: Number(salePrice) }),
        ...(isNew !== undefined && { isNew }),
        ...(isBest !== undefined && { isBest }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(embroideryAvailable !== undefined && { embroideryAvailable }),
        ...(bulkOrderAvailable !== undefined && { bulkOrderAvailable }),
        ...(status && { status }),
      },
    });

    // 카테고리 교체
    if (categoryIds !== undefined) {
      await tx.productCategory.deleteMany({ where: { productId: id } });
      if (categoryIds.length > 0) {
        await tx.productCategory.createMany({
          data: categoryIds.map((categoryId: string) => ({ productId: id, categoryId })),
        });
      }
    }

    // 옵션 교체 (기존 삭제 후 재생성 — 재고는 별도 관리)
    if (options !== undefined) {
      const currentOptions = await tx.productOption.findMany({ where: { productId: id } });
      const currentSkus = new Set(currentOptions.map((o) => o.sku));

      const newOptions = (options as { color: string; colorHex: string; sizes: string[] }[]).flatMap((opt) =>
        opt.sizes.map((size) => ({
          color: opt.color,
          colorHex: opt.colorHex,
          size,
          sku: `${slug || id}-${opt.color}-${size}`.toLowerCase().replace(/\s+/g, "-"),
        }))
      );
      const newSkus = new Set(newOptions.map((o) => o.sku));

      // 없어진 옵션 비활성화
      for (const opt of currentOptions) {
        if (!newSkus.has(opt.sku)) {
          await tx.productOption.update({ where: { id: opt.id }, data: { isActive: false } });
        }
      }

      // 새 옵션 추가
      for (const opt of newOptions) {
        if (!currentSkus.has(opt.sku)) {
          await tx.productOption.create({
            data: { productId: id, ...opt, stockQuantity: 0 },
          });
        }
      }
    }

    // 이미지 교체
    if (images !== undefined) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (images.length > 0) {
        await tx.productImage.createMany({
          data: (images as { url: string; altText?: string; isMain?: boolean }[]).map((img, idx) => ({
            productId: id,
            url: img.url,
            altText: img.altText || name || "",
            sortOrder: idx,
            isMain: img.isMain ?? false,
          })),
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // 주문된 적 있는 상품은 삭제 대신 DISCONTINUED
  const hasOrders = await prisma.orderItem.findFirst({ where: { productId: id } });
  if (hasOrders) {
    await prisma.product.update({ where: { id }, data: { status: "DISCONTINUED" } });
    return NextResponse.json({ ok: true, discontinued: true });
  }

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
