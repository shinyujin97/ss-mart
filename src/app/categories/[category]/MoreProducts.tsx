import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import ProductCard from "@/components/home/ProductCard";

const productInclude = {
  brand: { select: { name: true, slug: true } },
  images: { where: { isMain: true }, take: 1 },
} as const;

interface Props {
  catIds: string[];
  brandFilter: string[];
  certFilter: string[];
  seasonFilter: string[];
  sizeFilter: string[];
  minPrice: number | null;
  maxPrice: number | null;
  sort: string;
  skip: number;
  take: number;
  useCategorySort: boolean;
}

export default async function MoreProducts({
  catIds, brandFilter, certFilter, seasonFilter, sizeFilter,
  minPrice, maxPrice, sort, skip, take, useCategorySort,
}: Props) {
  const where = {
    status: "ACTIVE" as const,
    categories: { some: { categoryId: { in: catIds } } },
    ...(brandFilter.length > 0 ? { brand: { slug: { in: brandFilter } } } : {}),
    ...(certFilter.length > 0 ? { certifications: { some: { type: { in: certFilter as any[] } } } } : {}),
    ...(seasonFilter.length > 0 ? { season: { hasSome: seasonFilter as any[] } } : {}),
    ...(sizeFilter.length > 0 ? { options: { some: { size: { in: sizeFilter } } } } : {}),
    ...(minPrice !== null || maxPrice !== null
      ? { salePrice: { ...(minPrice !== null ? { gte: minPrice } : {}), ...(maxPrice !== null ? { lte: maxPrice } : {}) } }
      : {}),
  };

  const orderBy =
    sort === "price_asc" ? { salePrice: "asc" as const }
    : sort === "price_desc" ? { salePrice: "desc" as const }
    : sort === "best" ? { orderCount: "desc" as const }
    : { createdAt: "desc" as const };

  type RawRow = { id: string };

  let products;
  if (useCategorySort) {
    const sortedIds = await prisma.$queryRaw<RawRow[]>(
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
        LIMIT ${take} OFFSET ${skip}
      `
    ).then((rows) => rows.map((r) => r.id));

    const rows = await prisma.product.findMany({ where: { id: { in: sortedIds } }, include: productInclude });
    products = sortedIds.map((id) => rows.find((p) => p.id === id)!).filter(Boolean);
  } else {
    products = await prisma.product.findMany({ where, skip, take, orderBy, include: productInclude });
  }

  return (
    <>
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
    </>
  );
}
