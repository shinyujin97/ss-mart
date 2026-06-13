import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProductCard from "@/components/home/ProductCard";
import SearchInput from "./SearchInput";

interface Props {
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
}

const SORT_OPTIONS = [
  { value: "newest", label: "최신순" },
  { value: "best", label: "인기순" },
];

const PAGE_SIZE = 24;

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const sort = sp.sort ?? "newest";
  const page = Math.max(1, Number(sp.page ?? 1));

  if (!q) {
    return (
      <div className="bg-[var(--gray-50)] min-h-screen">
        <div className="max-w-[1340px] mx-auto px-4 md:px-6 py-20 text-center">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-400)] tracking-[2px] mb-4">SEARCH</div>
          <p className="text-[var(--gray-500)] text-sm">검색어를 입력하세요</p>
          <div className="mt-8 max-w-md mx-auto">
            <SearchInput initialQuery="" />
          </div>
        </div>
      </div>
    );
  }

  const orderBy =
    sort === "best" ? { orderCount: "desc" as const } :
    { createdAt: "desc" as const };

  const where = {
    status: "ACTIVE" as const,
    OR: [
      { name: { contains: q, mode: "insensitive" as const } },
      { shortDescription: { contains: q, mode: "insensitive" as const } },
      { brand: { name: { contains: q, mode: "insensitive" as const } } },
      { brand: { nameKr: { contains: q, mode: "insensitive" as const } } },
    ],
  };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        brand: { select: { name: true } },
        images: { where: { isMain: true }, take: 1 },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function buildUrl(params: Record<string, string>) {
    const p = new URLSearchParams({ q, sort, page: String(page), ...params });
    return `/search?${p.toString()}`;
  }

  return (
    <div className="bg-[var(--gray-50)] min-h-screen">
      {/* 헤더 */}
      <div className="bg-white border-b border-[var(--line)]">
        <div className="max-w-[1340px] mx-auto px-4 md:px-6 py-5">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-400)] tracking-[2px] mb-1">SEARCH RESULTS</div>
          <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
            <h1 className="text-xl font-black text-[var(--black)]">
              &ldquo;{q}&rdquo; 검색 결과
            </h1>
            <span className="text-sm text-[var(--gray-500)] mb-0.5">총 {total.toLocaleString()}개</span>
          </div>
          <div className="mt-4 max-w-lg">
            <SearchInput initialQuery={q} />
          </div>
        </div>
      </div>

      <div className="max-w-[1340px] mx-auto px-4 md:px-6 py-6">
        {/* 정렬 */}
        <div className="flex flex-wrap gap-3 items-center justify-between mb-5">
          <div className="flex gap-2">
            {SORT_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                href={buildUrl({ sort: opt.value, page: "1" })}
                className={`px-4 py-2 text-xs font-[var(--font-mono)] border transition-colors ${
                  sort === opt.value
                    ? "bg-[var(--black)] text-white border-[var(--black)]"
                    : "bg-white text-[var(--gray-600)] border-[var(--line)] hover:border-[var(--black)]"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--gray-400)]">
            {page} / {totalPages || 1} 페이지
          </div>
        </div>

        {/* 결과 없음 */}
        {products.length === 0 && (
          <div className="bg-white border border-[var(--line)] py-24 text-center">
            <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-400)] tracking-[2px] mb-3">NO RESULTS</div>
            <p className="text-[var(--gray-500)] text-sm mb-1">&ldquo;{q}&rdquo;에 대한 검색 결과가 없습니다</p>
            <p className="text-[var(--gray-400)] text-xs">다른 검색어를 입력하거나 카테고리를 둘러보세요</p>
            <Link href="/categories/workwear" className="inline-block mt-6 px-6 py-2.5 bg-[var(--red)] text-white text-sm font-bold hover:bg-[var(--red-dark)] transition-colors">
              전체 상품 보기
            </Link>
          </div>
        )}

        {/* 상품 그리드 */}
        {products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {products.map((p) => (
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
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center gap-1 mt-10">
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })}
                className="w-9 h-9 flex items-center justify-center border border-[var(--line)] text-sm hover:border-[var(--black)] transition-colors">
                ‹
              </Link>
            )}
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 4, totalPages - 9)) + i;
              return (
                <Link key={p} href={buildUrl({ page: String(p) })}
                  className={`w-9 h-9 flex items-center justify-center border text-sm transition-colors font-[var(--font-mono)] ${
                    p === page
                      ? "bg-[var(--black)] text-white border-[var(--black)]"
                      : "border-[var(--line)] hover:border-[var(--black)]"
                  }`}>
                  {p}
                </Link>
              );
            })}
            {page < totalPages && (
              <Link href={buildUrl({ page: String(page + 1) })}
                className="w-9 h-9 flex items-center justify-center border border-[var(--line)] text-sm hover:border-[var(--black)] transition-colors">
                ›
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
