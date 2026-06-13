import Link from "next/link";
import { prisma } from "@/lib/prisma";
import BestCarousel from "./BestCarousel";

export default async function BestSection() {
  // 카테고리 + 하위 카테고리 포함해서 다양하게 가져오기
  const TARGET_SLUGS = [
    "workwear-top",
    "workwear-bottom",
    "safety-shoes-6inch",
    "safety-shoes-4inch",
    "apt-supplies",
    "welding",
    "workwear-winter",
    "safety-vest",
    "mask",
    "gloves",
  ];

  const cats = await prisma.category.findMany({
    where: { slug: { in: TARGET_SLUGS } },
    select: { id: true, slug: true },
  });

  type ProductWithRel = Awaited<ReturnType<typeof prisma.product.findMany<{
    include: { brand: { select: { name: true } }; images: { where: { isMain: boolean }; take: number } };
  }>>>[number];

  const seen = new Set<string>();
  const usedBrands = new Set<string>();
  const mixed: ProductWithRel[] = [];

  for (const cat of cats) {
    if (mixed.length >= 8) break;

    // 각 카테고리에서 후보 5개 가져와 브랜드 중복 피해 선택
    const candidates = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        categories: { some: { categoryId: cat.id } },
        images: { some: { isMain: true } },
      },
      take: 5,
      include: {
        brand: { select: { name: true } },
        images: { where: { isMain: true }, take: 1 },
      },
      orderBy: { id: "asc" },
    });

    const pick = candidates.find(
      (p) => !seen.has(p.id) && !usedBrands.has(p.brandId)
    ) ?? candidates.find((p) => !seen.has(p.id));

    if (pick) {
      seen.add(pick.id);
      usedBrands.add(pick.brandId);
      mixed.push(pick);
    }
  }

  // 8개 미만이면 보충
  if (mixed.length < 8) {
    const extra = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        images: { some: { isMain: true } },
        id: { notIn: [...seen] },
        brandId: { notIn: [...usedBrands] },
      },
      take: 8 - mixed.length,
      include: {
        brand: { select: { name: true } },
        images: { where: { isMain: true }, take: 1 },
      },
      orderBy: { id: "asc" },
    });
    mixed.push(...extra);
  }

  const products = mixed;
  if (products.length === 0) return null;

  const items = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    brandName: p.brand.name,
    basePrice: p.basePrice,
    salePrice: p.salePrice,
    imageUrl: p.images[0]?.url ?? `https://placehold.co/600x600/f4f4f4/8a8a8a?text=${encodeURIComponent(p.name)}`,
  }));

  return (
    <section className="max-w-[1340px] mx-auto px-4 md:px-6 my-10 md:my-14">
      {/* 섹션 헤더 */}
      <div className="flex items-end justify-between mb-5 pb-3.5 border-b-2 border-[var(--black)]">
        <div className="flex items-end gap-[18px]">
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[2px] pb-1">
            SECTION / 02
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              베스트 <span className="text-[var(--red)]">상품</span>
            </h2>
            <p className="text-xs text-[var(--gray-500)] mt-1">가장 많이 팔린 인기 상품</p>
          </div>
        </div>
        <Link
          href="/categories/workwear"
          className="font-[var(--font-mono)] text-xs text-[var(--gray-700)] tracking-[0.5px] hover:text-[var(--red)] transition-colors"
        >
          VIEW ALL ━
        </Link>
      </div>

      {/* 자동 슬라이딩 캐러셀 */}
      <BestCarousel products={items} />
    </section>
  );
}
