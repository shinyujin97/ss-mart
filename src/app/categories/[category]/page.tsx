import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/home/ProductCard";
import CategoryFilter from "./CategoryFilter";

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{
    sort?: string;
    page?: string;
    brand?: string | string[];
    minPrice?: string;
    maxPrice?: string;
  }>;
}

const SORT_OPTIONS = [
  { value: "newest", label: "최신순" },
  { value: "best", label: "인기순" },
  { value: "price_asc", label: "가격 낮은 순" },
  { value: "price_desc", label: "가격 높은 순" },
];

const PAGE_SIZE = 24;

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  const sp = await searchParams;

  const sort = sp.sort ?? "newest";
  const page = Number(sp.page ?? 1);
  const brandFilter = sp.brand
    ? Array.isArray(sp.brand)
      ? sp.brand
      : [sp.brand]
    : [];
  const minPrice = sp.minPrice ? Number(sp.minPrice) : undefined;
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;

  // 카테고리 조회
  const cat = await prisma.category.findUnique({
    where: { slug: category },
    include: { children: { orderBy: { sortOrder: "asc" } } },
  });
  if (!cat) notFound();

  // 하위 카테고리 슬러그 포함해서 상품 조회
  const childIds = cat.children.map((c) => c.id);
  const catIds = [cat.id, ...childIds];

  const orderBy =
    sort === "price_asc"
      ? { salePrice: "asc" as const }
      : sort === "price_desc"
      ? { salePrice: "desc" as const }
      : sort === "best"
      ? { orderCount: "desc" as const }
      : { createdAt: "desc" as const };

  const where = {
    status: "ACTIVE" as const,
    categories: { some: { categoryId: { in: catIds } } },
    ...(brandFilter.length > 0
      ? { brand: { slug: { in: brandFilter } } }
      : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          salePrice: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          },
        }
      : {}),
  };

  const [products, total, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      orderBy,
      include: {
        brand: { select: { name: true, slug: true } },
        images: { where: { isMain: true }, take: 1 },
      },
    }),
    prisma.product.count({ where }),
    // 이 카테고리의 브랜드 목록
    prisma.brand.findMany({
      where: {
        products: {
          some: {
            categories: { some: { categoryId: { in: catIds } } },
            status: "ACTIVE",
          },
        },
      },
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="bg-[var(--gray-50)] min-h-screen">
      {/* 브레드크럼 */}
      <div className="bg-white border-b border-[var(--line)]">
        <div className="max-w-[1340px] mx-auto px-6 py-3 flex items-center gap-2 font-[var(--font-mono)] text-[11px] text-[var(--gray-500)]">
          <Link href="/" className="hover:text-[var(--red)]">HOME</Link>
          <span>/</span>
          <span className="text-[var(--black)] font-semibold">{cat.name}</span>
        </div>
      </div>

      {/* 하위 카테고리 탭 */}
      {cat.children.length > 0 && (
        <div className="bg-white border-b border-[var(--line)]">
          <div className="max-w-[1340px] mx-auto px-6">
            <div className="flex overflow-x-auto">
              <Link
                href={`/categories/${category}`}
                className="px-5 py-3.5 font-bold text-sm border-b-2 border-[var(--black)] text-[var(--black)] whitespace-nowrap"
              >
                전체
              </Link>
              {cat.children.map((child) => (
                <Link
                  key={child.slug}
                  href={`/categories/${child.slug}`}
                  className="px-5 py-3.5 text-sm text-[var(--gray-500)] hover:text-[var(--black)] border-b-2 border-transparent hover:border-[var(--gray-300)] transition-colors whitespace-nowrap"
                >
                  {child.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1340px] mx-auto px-6 py-6">
        <div className="grid grid-cols-[240px_1fr] gap-6 items-start">
          {/* 좌측 필터 */}
          <CategoryFilter brands={brands} currentBrands={brandFilter} />

          {/* 우측 상품 목록 */}
          <div>
            {/* 상단 바 */}
            <div className="flex items-center justify-between mb-5">
              <div className="font-[var(--font-mono)] text-sm">
                <span className="text-[var(--black)] font-bold">{cat.name}</span>
                <span className="text-[var(--gray-500)] ml-2">
                  총 <span className="text-[var(--red)] font-bold">{total.toLocaleString()}</span>개
                </span>
              </div>
              <div className="flex border border-[var(--line)]">
                {SORT_OPTIONS.map((opt) => (
                  <Link
                    key={opt.value}
                    href={`?sort=${opt.value}`}
                    className={`px-4 py-2 text-xs font-semibold border-r border-[var(--line)] last:border-r-0 transition-colors ${
                      sort === opt.value
                        ? "bg-[var(--black)] text-white"
                        : "text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
                    }`}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* 상품 그리드 */}
            {products.length === 0 ? (
              <div className="bg-white border border-[var(--line)] py-24 text-center">
                <div className="font-[var(--font-mono)] text-[11px] text-[var(--gray-300)] tracking-[2px] mb-3">
                  NO PRODUCTS
                </div>
                <p className="text-sm text-[var(--gray-500)]">
                  해당 조건의 상품이 없습니다.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-5">
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
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-1 mt-10">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`?sort=${sort}&page=${p}`}
                    className={`w-9 h-9 flex items-center justify-center text-sm font-[var(--font-mono)] border transition-colors ${
                      p === page
                        ? "bg-[var(--black)] text-white border-[var(--black)]"
                        : "border-[var(--line)] text-[var(--gray-700)] hover:border-[var(--black)]"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
