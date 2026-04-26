import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "./ProductCard";

export default async function BestSection() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE", isBest: true },
    take: 8,
    include: {
      brand: { select: { name: true } },
      images: { where: { isMain: true }, take: 1 },
    },
    orderBy: { orderCount: "desc" },
  });

  if (products.length === 0) return null;

  return (
    <section className="max-w-[1340px] mx-auto px-6 my-14">
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
            <p className="text-xs text-[var(--gray-500)] mt-1">
              가장 많이 팔린 인기 상품
            </p>
          </div>
        </div>
        <Link
          href="/best"
          className="font-[var(--font-mono)] text-xs text-[var(--gray-700)] tracking-[0.5px] hover:text-[var(--red)] transition-colors"
        >
          VIEW ALL ━
        </Link>
      </div>

      {/* 상품 그리드 */}
      <div className="grid grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            slug={p.slug}
            name={p.name}
            brand={p.brand.name}
            basePrice={p.basePrice}
            salePrice={p.salePrice}
            imageUrl={
              p.images[0]?.url ??
              `https://placehold.co/600x600/f4f4f4/8a8a8a?text=${encodeURIComponent(p.name)}`
            }
            isNew={p.isNew}
            isBest={p.isBest}
            embroideryAvailable={p.embroideryAvailable}
          />
        ))}
      </div>
    </section>
  );
}
