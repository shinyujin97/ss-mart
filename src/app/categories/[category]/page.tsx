import { notFound, redirect } from "next/navigation";
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
    cert?: string | string[];
    season?: string | string[];
    size?: string | string[];
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
  if (category === "all-products") redirect("/categories/workwear");
  const sp = await searchParams;

  const sort = sp.sort ?? "newest";
  const page = Number(sp.page ?? 1);
  const brandFilter = sp.brand ? (Array.isArray(sp.brand) ? sp.brand : [sp.brand]) : [];
  const certFilter = sp.cert ? (Array.isArray(sp.cert) ? sp.cert : [sp.cert]) : [];
  const seasonFilter = sp.season ? (Array.isArray(sp.season) ? sp.season : [sp.season]) : [];
  const sizeFilter = sp.size ? (Array.isArray(sp.size) ? sp.size : [sp.size]) : [];
  const minPrice = sp.minPrice ? Number(sp.minPrice) : undefined;
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;

  // 카테고리 조회
  const [cat, topLevelCats] = await Promise.all([
    prisma.category.findUnique({
      where: { slug: category },
      include: {
        children: { orderBy: { sortOrder: "asc" } },
        parent: { include: { children: { orderBy: { sortOrder: "asc" } } } },
      },
    }),
    // 상위 카테고리 전체 (level 0) — 탭 바용
    prisma.category.findMany({
      where: { level: 0, isActive: true, NOT: { slug: "all-products" } },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
  ]);
  if (!cat) notFound();

  // 탭 구성
  const isTopLevel = cat.level === 0;
  const tabParentSlug = cat.parent?.slug ?? cat.slug;
  const tabChildren = isTopLevel
    ? []
    : (cat.children.length > 0 ? cat.children : (cat.parent?.children ?? []));

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

  // 하위 카테고리 있고 기본 정렬일 때: 카테고리 sortOrder 기준으로 그룹 정렬
  const useCategorySort = childIds.length > 0 && sort === "newest";

  type RawRow = { id: string };
  const catIdList = catIds.join("','");

  const sortedIds: string[] = useCategorySort
    ? await prisma.$queryRawUnsafe<RawRow[]>(`
        WITH cat_priorities AS (
          SELECT pc."productId", MIN(c."sortOrder") AS priority
          FROM product_categories pc
          JOIN categories c ON pc."categoryId" = c.id
          WHERE c.id IN ('${catIdList}')
          GROUP BY pc."productId"
        )
        SELECT p.id
        FROM products p
        JOIN cat_priorities cp ON p.id = cp."productId"
        WHERE p.status = 'ACTIVE'
        ORDER BY cp.priority ASC, p."createdAt" DESC
        LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}
      `).then((rows) => rows.map((r) => r.id))
    : [];

  const productInclude = {
    brand: { select: { name: true, slug: true } },
    images: { where: { isMain: true }, take: 1 },
  } as const;

  const [products, total, brands, availableSizes, availableCerts, availableSeasons] = await Promise.all([
    useCategorySort
      ? prisma.product.findMany({ where: { id: { in: sortedIds } }, include: productInclude })
          .then((rows) => sortedIds.map((id) => rows.find((p) => p.id === id)!).filter(Boolean))
      : prisma.product.findMany({
          where,
          take: PAGE_SIZE,
          skip: (page - 1) * PAGE_SIZE,
          orderBy,
          include: productInclude,
        }),
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

  // 안전화 카테고리는 사이즈 데이터가 없어도 기본 사이즈 표시
  const SHOE_CATEGORY_SLUGS = ["safety-shoes", "safety-shoes-4inch", "safety-shoes-6inch", "safety-shoes-8inch", "winter-safety-shoes", "safety-shoes-misc"];
  const isShoeCategory = SHOE_CATEGORY_SLUGS.includes(category) || (cat.parent && SHOE_CATEGORY_SLUGS.includes(cat.parent.slug));
  const DEFAULT_SHOE_SIZES = ["230", "240", "245", "250", "255", "260", "265", "270", "275", "280", "285", "290"];
  const dbSizes = availableSizes.map((o) => o.size);
  const sizes = isShoeCategory && dbSizes.length === 0 ? DEFAULT_SHOE_SIZES : dbSizes;

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

      {/* 카테고리 탭 바 */}
      {(isTopLevel ? topLevelCats.length > 0 : tabChildren.length > 0) && (
        <div className="bg-white border-b border-[var(--line)]">
          <div className="max-w-[1340px] mx-auto px-6">
            <div className="flex overflow-x-auto">
              {isTopLevel ? (
                topLevelCats.map((topCat) => (
                  <Link
                    key={topCat.slug}
                    href={`/categories/${topCat.slug}`}
                    className={`px-5 py-3.5 text-sm border-b-2 whitespace-nowrap transition-colors ${
                      cat.slug === topCat.slug
                        ? "border-[var(--black)] text-[var(--black)] font-bold"
                        : "border-transparent text-[var(--gray-500)] hover:text-[var(--black)] hover:border-[var(--gray-300)]"
                    }`}
                  >
                    {topCat.name}
                  </Link>
                ))
              ) : (
                <>
                  <Link
                    href={`/categories/${tabParentSlug}`}
                    className={`px-5 py-3.5 text-sm border-b-2 whitespace-nowrap font-bold transition-colors ${
                      cat.slug === tabParentSlug
                        ? "border-[var(--black)] text-[var(--black)]"
                        : "border-transparent text-[var(--gray-500)] hover:text-[var(--black)] hover:border-[var(--gray-300)]"
                    }`}
                  >
                    전체
                  </Link>
                  {tabChildren.map((child) => (
                    <Link
                      key={child.slug}
                      href={`/categories/${child.slug}`}
                      className={`px-5 py-3.5 text-sm border-b-2 whitespace-nowrap transition-colors ${
                        cat.slug === child.slug
                          ? "border-[var(--black)] text-[var(--black)] font-bold"
                          : "border-transparent text-[var(--gray-500)] hover:text-[var(--black)] hover:border-[var(--gray-300)]"
                      }`}
                    >
                      {child.name}
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1340px] mx-auto px-6 py-6">
        <div className="grid grid-cols-[240px_1fr] gap-6 items-start">
          {/* 좌측 필터 — 스크롤 시 고정 */}
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
            {totalPages > 1 && (() => {
              const GROUP = 10;
              const groupStart = Math.floor((page - 1) / GROUP) * GROUP + 1;
              const groupEnd = Math.min(groupStart + GROUP - 1, totalPages);
              const buildHref = (p: number) => `?sort=${sort}&page=${p}`;

              const btnClass = (active: boolean) =>
                `w-9 h-9 flex items-center justify-center border font-[var(--font-mono)] text-sm transition-colors ${
                  active
                    ? "border-[var(--line)] text-[var(--gray-700)] hover:border-[var(--black)] hover:text-[var(--black)]"
                    : "border-[var(--gray-100)] text-[var(--gray-300)] cursor-not-allowed pointer-events-none"
                }`;

              return (
                <div className="flex justify-center items-center gap-1 mt-10">
                  {/* << 맨 처음 */}
                  <Link href={page > 1 ? buildHref(1) : "#"} aria-disabled={page <= 1} className={btnClass(page > 1)}>{"<<"}</Link>
                  {/* < 이전 페이지 */}
                  <Link href={page > 1 ? buildHref(page - 1) : "#"} aria-disabled={page <= 1} className={btnClass(page > 1)}>{"<"}</Link>

                  {/* 페이지 번호 (10개씩) */}
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

                  {/* > 다음 페이지 */}
                  <Link href={page < totalPages ? buildHref(page + 1) : "#"} aria-disabled={page >= totalPages} className={btnClass(page < totalPages)}>{">"}</Link>
                  {/* >> 맨 끝 */}
                  <Link href={page < totalPages ? buildHref(totalPages) : "#"} aria-disabled={page >= totalPages} className={btnClass(page < totalPages)}>{">>"}</Link>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
