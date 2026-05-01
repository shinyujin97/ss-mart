import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/home/ProductCard";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}

const PAGE_SIZE = 24;

export default async function BrandPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const sort = sp.sort ?? "newest";

  const brand = await prisma.brand.findUnique({
    where: { slug },
    include: { _count: { select: { products: true } } },
  });
  if (!brand) notFound();

  const orderBy =
    sort === "price_asc" ? { salePrice: "asc" as const } :
    sort === "price_desc" ? { salePrice: "desc" as const } :
    sort === "best" ? { orderCount: "desc" as const } :
    { createdAt: "desc" as const };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { brandId: brand.id, status: "ACTIVE" },
      include: { images: { where: { isMain: true }, take: 1 } },
      orderBy,
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.product.count({ where: { brandId: brand.id, status: "ACTIVE" } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const GROUP = 10;
  const groupStart = Math.floor((page - 1) / GROUP) * GROUP + 1;
  const groupEnd = Math.min(groupStart + GROUP - 1, totalPages);
  const buildHref = (p: number) => `?sort=${sort}&page=${p}`;
  const btnClass = (active: boolean) =>
    `w-9 h-9 flex items-center justify-center border font-[var(--font-mono)] text-sm transition-colors ${
      active ? "border-[var(--line)] text-[var(--gray-700)] hover:border-[var(--black)]"
              : "border-[var(--gray-100)] text-[var(--gray-300)] cursor-not-allowed pointer-events-none"
    }`;

  return (
    <div className="bg-[var(--gray-50)] min-h-screen">
      {/* 브레드크럼 */}
      <div className="bg-white border-b border-[var(--line)]">
        <div className="max-w-[1340px] mx-auto px-6 py-3 flex items-center gap-2 font-[var(--font-mono)] text-[11px] text-[var(--gray-500)]">
          <Link href="/" className="hover:text-[var(--red)]">HOME</Link>
          <span>/</span>
          <Link href="/brands" className="hover:text-[var(--red)]">브랜드관</Link>
          <span>/</span>
          <span className="text-[var(--black)] font-semibold">{brand.nameKr}</span>
        </div>
      </div>

      <div className="max-w-[1340px] mx-auto px-6 py-8">
        {/* 브랜드 헤더 */}
        <div className="bg-white border border-[var(--line)] px-8 py-6 mb-6 flex items-center gap-6">
          <div>
            <div className="font-[var(--font-display)] text-[36px] text-[var(--black)] tracking-wide leading-none mb-1">
              {brand.name}
            </div>
            <div className="text-sm text-[var(--gray-500)]">{brand.nameKr}</div>
          </div>
          <div className="ml-auto font-[var(--font-mono)] text-right">
            <div className="text-[10px] text-[var(--gray-400)] tracking-[1px]">TOTAL ITEMS</div>
            <div className="text-[28px] text-[var(--red)] font-bold">{total.toLocaleString()}</div>
          </div>
        </div>

        {/* 정렬 */}
        <div className="flex justify-between items-center mb-5">
          <span className="font-[var(--font-mono)] text-sm text-[var(--gray-500)]">
            총 <span className="text-[var(--black)] font-bold">{total.toLocaleString()}</span>개
          </span>
          <div className="flex border border-[var(--line)]">
            {[
              { value: "newest", label: "최신순" },
              { value: "best", label: "인기순" },
              { value: "price_asc", label: "가격 낮은 순" },
              { value: "price_desc", label: "가격 높은 순" },
            ].map((opt) => (
              <Link
                key={opt.value}
                href={`?sort=${opt.value}`}
                className={`px-4 py-2 text-xs font-semibold border-r border-[var(--line)] last:border-r-0 transition-colors ${
                  sort === opt.value ? "bg-[var(--black)] text-white" : "text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        {/* 상품 그리드 */}
        {products.length === 0 ? (
          <div className="bg-white border border-[var(--line)] py-24 text-center text-sm text-[var(--gray-500)]">
            상품이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-5">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                slug={p.slug}
                name={p.name}
                brand={brand.name}
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
          <div className="flex justify-center items-center gap-1 mt-10">
            <Link href={page > 1 ? buildHref(1) : "#"} aria-disabled={page <= 1} className={btnClass(page > 1)}>{"<<"}</Link>
            <Link href={page > 1 ? buildHref(page - 1) : "#"} aria-disabled={page <= 1} className={btnClass(page > 1)}>{"<"}</Link>
            {Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i).map((p) => (
              <Link key={p} href={buildHref(p)}
                className={`w-9 h-9 flex items-center justify-center text-sm font-[var(--font-mono)] border transition-colors ${
                  p === page ? "bg-[var(--black)] text-white border-[var(--black)]" : "border-[var(--line)] text-[var(--gray-700)] hover:border-[var(--black)]"
                }`}
              >{p}</Link>
            ))}
            <Link href={page < totalPages ? buildHref(page + 1) : "#"} aria-disabled={page >= totalPages} className={btnClass(page < totalPages)}>{">"}</Link>
            <Link href={page < totalPages ? buildHref(totalPages) : "#"} aria-disabled={page >= totalPages} className={btnClass(page < totalPages)}>{">>"}</Link>
          </div>
        )}
      </div>
    </div>
  );
}
