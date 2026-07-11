import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    include: { _count: { select: { products: { where: { status: "ACTIVE" } } } } },
    orderBy: { products: { _count: "desc" } },
  });

  const activeBrands = brands
    .filter((b) => b._count.products > 0 && b.slug !== "etc-brand")
    .sort((a, b) => {
      if (a.logoUrl && !b.logoUrl) return -1;
      if (!a.logoUrl && b.logoUrl) return 1;
      return b._count.products - a._count.products;
    });
  const etcBrand = brands.find((b) => b.slug === "etc-brand");

  return (
    <div className="bg-[var(--gray-50)] min-h-screen">
      {/* 브레드크럼 */}
      <div className="bg-white border-b border-[var(--line)]">
        <div className="max-w-[1340px] mx-auto px-4 md:px-6 py-3 flex items-center gap-2 font-[var(--font-mono)] text-[11px] text-[var(--gray-500)]">
          <Link href="/" className="hover:text-[var(--red)]">HOME</Link>
          <span>/</span>
          <span className="text-[var(--black)] font-semibold">브랜드관</span>
        </div>
      </div>

      <div className="max-w-[1340px] mx-auto px-4 md:px-6 py-8">
        {/* 타이틀 */}
        <div className="mb-8">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--red)] tracking-[2px] mb-2 font-semibold">
            BRAND / {String(activeBrands.length).padStart(2, "0")}
          </div>
          <h1 className="text-[22px] md:text-[28px] font-black text-[var(--black)] tracking-tight">브랜드관</h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">
            총 {activeBrands.length}개 브랜드 · {activeBrands.reduce((s, b) => s + b._count.products, 0).toLocaleString()}개 상품
          </p>
        </div>

        {/* 입점 브랜드 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {activeBrands.map((brand) => (
            <Link
              key={brand.slug}
              href={`/brands/${brand.slug}`}
              className="bg-white border border-[var(--line)] hover:border-[var(--black)] hover:shadow-md transition-all group flex flex-col items-center justify-between p-5 gap-3 text-center"
            >
              {/* 로고 영역 */}
              <div className="w-full aspect-[3/2] flex items-center justify-center overflow-hidden">
                {brand.logoUrl ? (
                  <Image
                    src={brand.logoUrl}
                    alt={brand.name}
                    width={160}
                    height={80}
                    className="object-contain w-full h-full"
                    unoptimized
                  />
                ) : (
                  // 로고 없으면 이니셜 플레이스홀더
                  <div className="w-full h-full bg-[var(--gray-50)] border border-[var(--line)] flex items-center justify-center">
                    <span className="font-[var(--font-display)] text-[22px] text-[var(--gray-400)] group-hover:text-[var(--black)] transition-colors tracking-wider">
                      {brand.name}
                    </span>
                  </div>
                )}
              </div>

              {/* 브랜드 정보 */}
              <div>
                <div className="text-xs font-bold text-[var(--black)] group-hover:text-[var(--red)] transition-colors">
                  {brand.nameKr}
                </div>
                <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-400)] mt-0.5">
                  {brand._count.products.toLocaleString()} ITEMS
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 기타 브랜드 — 맨 아래 */}
        {etcBrand && etcBrand._count.products > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-[var(--font-mono)] text-[11px] text-[var(--gray-500)] tracking-[1.5px]">기타</span>
              <div className="flex-1 h-px bg-[var(--line)]" />
            </div>
            <Link
              href={`/brands/${etcBrand.slug}`}
              className="inline-flex items-center gap-3 bg-white border border-[var(--line)] hover:border-[var(--black)] transition-all px-6 py-4"
            >
              <span className="font-[var(--font-display)] text-[18px] text-[var(--gray-500)]">기타</span>
              <span className="font-[var(--font-mono)] text-[11px] text-[var(--gray-400)]">
                {etcBrand._count.products.toLocaleString()} ITEMS
              </span>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
