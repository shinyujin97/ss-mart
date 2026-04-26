import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function BrandSection() {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    take: 16,
    select: { slug: true, name: true },
  });

  return (
    <section className="max-w-[1340px] mx-auto px-6 my-14">
      <div className="flex items-end justify-between mb-5 pb-3.5 border-b-2 border-[var(--black)]">
        <div className="flex items-end gap-[18px]">
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[2px] pb-1">
            SECTION / 05
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              입점 <span className="text-[var(--red)]">브랜드</span>
            </h2>
            <p className="text-xs text-[var(--gray-500)] mt-1">80여 개 프리미엄 브랜드 공식 입점</p>
          </div>
        </div>
        <Link
          href="/brands"
          className="font-[var(--font-mono)] text-xs text-[var(--gray-700)] tracking-[0.5px] hover:text-[var(--red)] transition-colors"
        >
          VIEW ALL ━
        </Link>
      </div>

      <div className="grid grid-cols-8 border-l border-t border-[var(--line)]">
        {brands.map((b) => (
          <Link
            key={b.slug}
            href={`/brands/${b.slug}`}
            className="flex items-center justify-center h-16 border-r border-b border-[var(--line)] font-[var(--font-display)] text-sm tracking-[1px] text-[var(--gray-500)] hover:text-[var(--black)] hover:bg-[var(--gray-50)] transition-colors px-2 text-center"
          >
            {b.name}
          </Link>
        ))}
        <Link
          href="/brands"
          className="flex items-center justify-center h-16 border-r border-b border-[var(--line)] font-[var(--font-display)] text-sm tracking-[1px] text-[var(--red)] hover:bg-[var(--red)] hover:text-white transition-colors"
        >
          + 64 MORE
        </Link>
      </div>
    </section>
  );
}
