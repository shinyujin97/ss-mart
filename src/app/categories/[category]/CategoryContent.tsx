import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import ProductCard from "@/components/home/ProductCard";
import CategoryFilter from "./CategoryFilter";
import MoreProducts from "./MoreProducts";

const PAGE_SIZE = 24;

const SORT_OPTIONS = [
  { value: "newest", label: "최신순" },
  { value: "best", label: "인기순" },
  { value: "price_asc", label: "가격 낮은 순" },
  { value: "price_desc", label: "가격 높은 순" },
];

const SHOE_CATEGORY_SLUGS = [
  "safety-shoes", "safety-shoes-4inch", "safety-shoes-6inch",
  "safety-shoes-8inch", "winter-safety-shoes", "safety-shoes-misc",
];
const DEFAULT_SHOE_SIZES = ["230","240","245","250","255","260","265","270","275","280","285","290"];

const productInclude = {
  brand: { select: { name: true, slug: true } },
  images: { where: { isMain: true }, take: 1 },
} as const;

interface CategoryInfo {
  id: string;
  slug: string;
  name: string;
  children: { id: string }[];
  parent: { slug: string } | null;
}

interface Props {
  cat: CategoryInfo;
  sort: string;
  page: number;
  brandFilter: string[];
  certFilter: string[];
  seasonFilter: string[];
  sizeFilter: string[];
  minPrice: number | undefined;
  maxPrice: number | undefined;
  category: string;
}

export default async function CategoryContent({
  cat, sort, page, brandFilter, certFilter, seasonFilter, sizeFilter,
  minPrice, maxPrice, category,
}: Props) {
  const childIds = cat.children.map((c) => c.id);
  const catIds = [cat.id, ...childIds];
  const useCategorySort = childIds.length > 0 && sort === "newest";
  const skip = (page - 1) * PAGE_SIZE;

  const orderBy =
    sort === "price_asc" ? { salePrice: "asc" as const }
    : sort === "price_desc" ? { salePrice: "desc" as const }
    : sort === "best" ? { orderCount: "desc" as const }
    : { createdAt: "desc" as const };

  const where = {
    status: "ACTIVE" as const,
    categories: { some: { categoryId: { in: catIds } } },
    ...(brandFilter.length > 0 ? { brand: { slug: { in: brandFilter } } } : {}),
    ...(certFilter.length > 0 ? { certifications: { some: { type: { in: certFilter as any[] } } } } : {}),
    ...(seasonFilter.length > 0 ? { season: { hasSome: seasonFilter as any[] } } : {}),
    ...(sizeFilter.length > 0 ? { options: { some: { size: { in: sizeFilter } } } } : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? { salePrice: { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) } }
      : {}),
  };

  const catBaseWhere = {
    status: "ACTIVE" as const,
    categories: { some: { categoryId: { in: catIds } } },
  };

  type RawRow = { id: string };

  const sortedIds8: string[] = useCategorySort
    ? await prisma.$queryRaw<RawRow[]>(
        Prisma.sql`
          WITH cat_priorities AS (
            SELECT pc."productId", MIN(c."sortOrder") AS priority
            FROM product_categories pc
            JOIN categories c ON pc."categoryId" = c.id
            WHERE c.id IN (${Prisma.join(catIds)})
            GROUP BY pc."productId"
          )
          SELECT p.id
          FROM products p
          JOIN cat_priorities cp ON p.id = cp."productId"
          WHERE p.status = 'ACTIVE'
          ORDER BY cp.priority ASC, p."createdAt" DESC
          LIMIT 8 OFFSET ${skip}
        `
      ).then((rows) => rows.map((r) => r.id))
    : [];

  const [products8, total, brands, availableSizes, availableCerts, availableSeasons] = await Promise.all([
    useCategorySort
      ? prisma.product.findMany({ where: { id: { in: sortedIds8 } }, include: productInclude })
          .then((rows) => sortedIds8.map((id) => rows.find((p) => p.id === id)!).filter(Boolean))
      : prisma.product.findMany({ where, take: 8, skip, orderBy, include: productInclude }),
    prisma.product.count({ where }),
    prisma.brand.findMany({
      where: { products: { some: catBaseWhere } },
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.productOption.findMany({
      where: { product: catBaseWhere },
      select: { size: true },
      distinct: ["size"],
      orderBy: { size: "asc" },
    }),
    prisma.certification.findMany({
      where: { product: catBaseWhere },
      select: { type: true },
      distinct: ["type"],
    }),
    prisma.product.findMany({
      where: catBaseWhere,
      select: { season: true },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const uniqueSeasons = [...new Set(availableSeasons.flatMap((p) => p.season))] as string[];
  const certs = availableCerts.map((c) => c.type as string);

  const isShoeCategory =
    SHOE_CATEGORY_SLUGS.includes(category) ||
    (cat.parent && SHOE_CATEGORY_SLUGS.includes(cat.parent.slug));
  const dbSizes = availableSizes.map((o) => o.size);
  const sizes = isShoeCategory && dbSizes.length === 0 ? DEFAULT_SHOE_SIZES : dbSizes;

  const hasMore = total > skip + 8;
  const buildHref = (p: number) => `?sort=${sort}&page=${p}`;
  const GROUP = 10;
  const groupStart = Math.floor((page - 1) / GROUP) * GROUP + 1;
  const groupEnd = Math.min(groupStart + GROUP - 1, totalPages);

  const btnClass = (active: boolean) =>
    `w-9 h-9 flex items-center justify-center border font-[var(--font-mono)] text-sm transition-colors ${
      active
        ? "border-[var(--line)] text-[var(--gray-700)] hover:border-[var(--black)] hover:text-[var(--black)]"
        : "border-[var(--gray-100)] text-[var(--gray-300)] cursor-not-allowed pointer-events-none"
    }`;

  return (
    <div className="max-w-[1340px] mx-auto px-6 py-6">
      <div className="grid grid-cols-[240px_1fr] gap-6 items-start">
        <div className="sticky top-4">
          <CategoryFilter
            brands={brands}
            currentBrands={brandFilter}
            sizes={sizes}
            currentSizes={sizeFilter}
            certs={certs}
            currentCerts={certFilter}
            seasons={uniqueSeasons}
            currentSeasons={seasonFilter}
          />
        </div>

        <div>
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

          {products8.length === 0 ? (
            <div className="bg-white border border-[var(--line)] py-24 text-center">
              <div className="font-[var(--font-mono)] text-[11px] text-[var(--gray-300)] tracking-[2px] mb-3">
                NO PRODUCTS
              </div>
              <p className="text-sm text-[var(--gray-500)]">해당 조건의 상품이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-5">
              {products8.map((p) => (
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
              {hasMore && (
                <Suspense fallback={null}>
                  <MoreProducts
                    catIds={catIds}
                    brandFilter={brandFilter}
                    certFilter={certFilter}
                    seasonFilter={seasonFilter}
                    sizeFilter={sizeFilter}
                    minPrice={minPrice ?? null}
                    maxPrice={maxPrice ?? null}
                    sort={sort}
                    skip={skip + 8}
                    take={PAGE_SIZE - 8}
                    useCategorySort={useCategorySort}
                  />
                </Suspense>
              )}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1 mt-10">
              <Link href={page > 1 ? buildHref(1) : "#"} aria-disabled={page <= 1} className={btnClass(page > 1)}>{"<<"}</Link>
              <Link href={page > 1 ? buildHref(page - 1) : "#"} aria-disabled={page <= 1} className={btnClass(page > 1)}>{"<"}</Link>
              {Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i).map((p) => (
                <Link
                  key={p}
                  href={buildHref(p)}
                  className={`w-9 h-9 flex items-center justify-center text-sm font-[var(--font-mono)] border transition-colors ${
                    p === page
                      ? "bg-[var(--black)] text-white border-[var(--black)]"
                      : "border-[var(--line)] text-[var(--gray-700)] hover:border-[var(--black)]"
                  }`}
                >
                  {p}
                </Link>
              ))}
              <Link href={page < totalPages ? buildHref(page + 1) : "#"} aria-disabled={page >= totalPages} className={btnClass(page < totalPages)}>{">"}</Link>
              <Link href={page < totalPages ? buildHref(totalPages) : "#"} aria-disabled={page >= totalPages} className={btnClass(page < totalPages)}>{">>"}</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
