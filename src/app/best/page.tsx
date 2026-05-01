import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/home/ProductCard";

const BEST_CATEGORIES = [
  { slug: "workwear-top",          label: "작업복 상의" },
  { slug: "workwear-bottom",       label: "작업복 하의" },
  { slug: "safety-shoes-6inch",    label: "6인치 안전화" },
  { slug: "safety-shoes-4inch",    label: "4인치 안전화" },
  { slug: "waterproof-shoes",      label: "방수화" },
  { slug: "apt-supplies",          label: "APT용품" },
  { slug: "safety-vest",           label: "안전조끼" },
  { slug: "mask",                  label: "마스크" },
  { slug: "gloves",                label: "장갑" },
  { slug: "welding",               label: "용접" },
  { slug: "workwear-winter",       label: "방한복" },
  { slug: "eye-protection",        label: "시력보호" },
];

export default async function BestPage() {
  const sections = await Promise.all(
    BEST_CATEGORIES.map(async (cat) => {
      const category = await prisma.category.findUnique({ where: { slug: cat.slug } });
      if (!category) return null;

      // 카테고리별 skip 값으로 랜덤 분산
      const count = await prisma.product.count({
        where: { status: "ACTIVE", categories: { some: { categoryId: category.id } }, images: { some: { isMain: true } } },
      });
      const skip = count > 8 ? Math.floor(Math.random() * (count - 8)) : 0;

      const products = await prisma.product.findMany({
        where: { status: "ACTIVE", categories: { some: { categoryId: category.id } }, images: { some: { isMain: true } } },
        take: 4,
        skip,
        include: {
          brand: { select: { name: true } },
          images: { where: { isMain: true }, take: 1 },
        },
      });

      if (products.length === 0) return null;
      return { ...cat, products };
    })
  );

  const validSections = sections.filter(Boolean) as NonNullable<typeof sections[number]>[];

  return (
    <div className="bg-[var(--gray-50)] min-h-screen">
      {/* 헤더 */}
      <div className="bg-white border-b border-[var(--line)]">
        <div className="max-w-[1340px] mx-auto px-6 py-3 flex items-center gap-2 font-[var(--font-mono)] text-[11px] text-[var(--gray-500)]">
          <Link href="/" className="hover:text-[var(--red)]">HOME</Link>
          <span>/</span>
          <span className="text-[var(--black)] font-semibold">베스트</span>
        </div>
      </div>

      {/* 타이틀 */}
      <div className="bg-white border-b border-[var(--line)]">
        <div className="max-w-[1340px] mx-auto px-6 py-8">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--red)] tracking-[2px] mb-2">BEST ITEMS</div>
          <h1 className="text-[28px] font-black tracking-tight">카테고리별 베스트</h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">각 카테고리 인기 상품 모음</p>
        </div>
      </div>

      <div className="max-w-[1340px] mx-auto px-6 py-10 space-y-14">
        {validSections.map((section) => (
          <div key={section.slug}>
            {/* 섹션 헤더 */}
            <div className="flex items-center justify-between mb-5 pb-3 border-b-2 border-[var(--black)]">
              <h2 className="text-lg font-black tracking-tight">{section.label}</h2>
              <Link
                href={`/categories/${section.slug}`}
                className="font-[var(--font-mono)] text-xs text-[var(--gray-500)] hover:text-[var(--red)] transition-colors"
              >
                전체보기 ━
              </Link>
            </div>

            {/* 상품 그리드 */}
            <div className="grid grid-cols-4 gap-5">
              {section.products.map((p) => (
                <ProductCard
                  key={p.id}
                  slug={p.slug}
                  name={p.name}
                  brand={p.brand.name}
                  basePrice={p.basePrice}
                  salePrice={p.salePrice}
                  imageUrl={p.images[0]?.url ?? `https://placehold.co/600x600/f4f4f4/8a8a8a?text=${encodeURIComponent(p.name)}`}
                  isNew={p.isNew}
                  isBest={p.isBest}
                  embroideryAvailable={p.embroideryAvailable}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
