import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import CategoryContent from "./CategoryContent";

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

function ContentSkeleton() {
  return (
    <div className="max-w-[1340px] mx-auto px-4 md:px-6 py-6">
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        <div className="hidden md:block">
          <div className="h-11 bg-[var(--black)] opacity-80" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-[var(--line)] border-t-0 h-24 animate-pulse" />
          ))}
        </div>
        <div>
          <div className="flex justify-between mb-5">
            <div className="h-5 w-36 bg-[var(--gray-100)] animate-pulse" />
            <div className="h-8 w-56 bg-[var(--gray-100)] animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border border-[var(--line)]">
                <div className="aspect-square bg-[var(--gray-100)] animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-16 bg-[var(--gray-100)] animate-pulse" />
                  <div className="h-4 w-full bg-[var(--gray-100)] animate-pulse" />
                  <div className="h-5 w-20 bg-[var(--gray-100)] animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Pick<Props, "params">) {
  const { category } = await params;
  const cat = await prisma.category.findUnique({
    where: { slug: category },
    select: { name: true, parent: { select: { name: true } } },
  });
  if (!cat) return {};

  const title = cat.parent ? `${cat.parent.name} > ${cat.name}` : cat.name;
  const description = `에스에스종합상사 ${cat.name} — 80여 개 브랜드 작업복·안전용품 전문. 전화 문의 031-430-0497`;
  return { title, description, openGraph: { title, description } };
}

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

  // 빠른 쿼리: 카테고리 정보만 (브레드크럼 + 탭 즉시 렌더)
  const [cat, topLevelCats] = await Promise.all([
    prisma.category.findUnique({
      where: { slug: category },
      include: {
        children: { orderBy: { sortOrder: "asc" } },
        parent: { include: { children: { orderBy: { sortOrder: "asc" } } } },
      },
    }),
    prisma.category.findMany({
      where: { level: 0, isActive: true, NOT: { slug: "all-products" } },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
  ]);
  if (!cat) notFound();

  const isTopLevel = cat.level === 0;
  const tabParentSlug = cat.parent?.slug ?? cat.slug;
  const tabChildren = isTopLevel
    ? []
    : (cat.children.length > 0 ? cat.children : (cat.parent?.children ?? []));

  return (
    <div className="bg-[var(--gray-50)] min-h-screen">
      {/* 브레드크럼 — 즉시 렌더 */}
      <div className="bg-white border-b border-[var(--line)]">
        <div className="max-w-[1340px] mx-auto px-4 md:px-6 py-3 flex items-center gap-2 font-[var(--font-mono)] text-[11px] text-[var(--gray-500)]">
          <Link href="/" className="hover:text-[var(--red)]">HOME</Link>
          <span>/</span>
          <span className="text-[var(--black)] font-semibold">{cat.name}</span>
        </div>
      </div>

      {/* 카테고리 탭 — 즉시 렌더 */}
      {(isTopLevel ? topLevelCats.length > 0 : tabChildren.length > 0) && (
        <div className="bg-white border-b border-[var(--line)]">
          <div className="max-w-[1340px] mx-auto px-4 md:px-6">
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

      {/* 상품 영역 — 스트리밍: 사이드바 + 첫 8개 먼저, 나머지 비동기 */}
      <Suspense fallback={<ContentSkeleton />}>
        <CategoryContent
          cat={cat}
          sort={sort}
          page={page}
          brandFilter={brandFilter}
          certFilter={certFilter}
          seasonFilter={seasonFilter}
          sizeFilter={sizeFilter}
          minPrice={minPrice}
          maxPrice={maxPrice}
          category={category}
        />
      </Suspense>
    </div>
  );
}
