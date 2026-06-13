import Link from "next/link";
import Image from "next/image";
// Link는 VIEW ALL 버튼에만 사용
import { prisma } from "@/lib/prisma";

export default async function BrandSection() {
  const brands = await prisma.brand.findMany({
    where: { isActive: true, logoUrl: { not: null }, slug: { not: "etc-brand" } },
    include: { _count: { select: { products: true } } },
    orderBy: { products: { _count: "desc" } },
    take: 25,
  });

  const total = await prisma.brand.count({ where: { isActive: true, slug: { not: "etc-brand" } } });

  return (
    <section className="max-w-[1340px] mx-auto px-4 md:px-6 my-10 md:my-14">
      <div className="flex items-end justify-between mb-5 pb-3.5 border-b-2 border-[var(--black)]">
        <div className="flex items-end gap-[18px]">
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[2px] pb-1">
            SECTION / 05
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              입점 <span className="text-[var(--red)]">브랜드</span>
            </h2>
            <p className="text-xs text-[var(--gray-500)] mt-1">{total}개 프리미엄 브랜드 공식 입점</p>
          </div>
        </div>
        <Link
          href="/brands"
          className="font-[var(--font-mono)] text-xs text-[var(--gray-700)] tracking-[0.5px] hover:text-[var(--red)] transition-colors"
        >
          VIEW ALL ━
        </Link>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 border-l border-t border-[var(--line)]">
        {brands.map((b) => (
          <div
            key={b.slug}
            className="bg-white border-r border-b border-[var(--line)] flex items-center justify-center py-5 px-4"
          >
            <div className="h-12 flex items-center justify-center">
              <Image
                src={b.logoUrl!}
                alt={b.name}
                width={120}
                height={48}
                className="object-contain max-h-12"
                unoptimized
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
