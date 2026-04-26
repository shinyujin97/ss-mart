import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import ProductOptions from "./ProductOptions";

interface Props {
  params: Promise<{ slug: string }>;
}

const CERT_LABELS: Record<string, string> = {
  KCS: "KCs 인증",
  KS: "KS 인증",
  FLAME_RETARDANT: "방염 인증",
  ANTI_STATIC: "정전기 방지",
  KF94: "KF94",
  KF80: "KF80",
  OTHER: "기타 인증",
};

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      images: { orderBy: { sortOrder: "asc" } },
      options: { where: { isActive: true }, orderBy: [{ color: "asc" }, { size: "asc" }] },
      certifications: true,
      categories: { include: { category: true } },
    },
  });

  if (!product || product.status === "HIDDEN") notFound();

  const discountRate = Math.round(
    ((product.basePrice - product.salePrice) / product.basePrice) * 100
  );

  const mainImage =
    product.images.find((i) => i.isMain)?.url ??
    product.images[0]?.url ??
    `https://placehold.co/600x600/f4f4f4/8a8a8a?text=${encodeURIComponent(product.name)}`;

  // 색상 목록 (중복 제거)
  const colors = [...new Map(product.options.map((o) => [o.color, { color: o.color, colorHex: o.colorHex }])).values()];
  // 사이즈 목록
  const sizes = [...new Set(product.options.map((o) => o.size))];

  return (
    <div className="bg-white min-h-screen">
      {/* 브레드크럼 */}
      <div className="border-b border-[var(--line)]">
        <div className="max-w-[1340px] mx-auto px-6 py-3 flex items-center gap-2 font-[var(--font-mono)] text-[11px] text-[var(--gray-500)]">
          <Link href="/" className="hover:text-[var(--red)]">HOME</Link>
          <span>/</span>
          {product.categories[0] && (
            <>
              <Link href={`/categories/${product.categories[0].category.slug}`} className="hover:text-[var(--red)]">
                {product.categories[0].category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-[var(--black)] truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="max-w-[1340px] mx-auto px-6 py-8">
        <div className="grid grid-cols-[1fr_460px] gap-12">
          {/* 좌측: 이미지 */}
          <div>
            {/* 메인 이미지 */}
            <div className="relative aspect-square bg-[var(--gray-100)] mb-3 overflow-hidden">
              <Image src={mainImage} alt={product.name} fill className="object-cover" unoptimized />
              {/* 인증 배지 */}
              {product.certifications.length > 0 && (
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                  {product.certifications.map((c) => (
                    <span
                      key={c.id}
                      className="bg-[var(--black)] text-[var(--yellow)] font-[var(--font-mono)] text-[9px] px-2 py-1 font-bold tracking-[0.5px]"
                    >
                      {CERT_LABELS[c.type] ?? c.type}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* 썸네일 */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.slice(0, 5).map((img) => (
                  <div key={img.id} className="relative aspect-square bg-[var(--gray-100)] overflow-hidden cursor-pointer border-2 border-transparent hover:border-[var(--black)] transition-colors">
                    <Image src={img.url} alt={product.name} fill className="object-cover" unoptimized />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 우측: 상품 정보 */}
          <div>
            {/* 브랜드 */}
            <Link
              href={`/brands/${product.brand.slug}`}
              className="inline-block font-[var(--font-mono)] text-[11px] text-[var(--gray-500)] tracking-[2px] mb-2 hover:text-[var(--red)] transition-colors"
            >
              {product.brand.name}
            </Link>

            {/* 상품명 */}
            <h1 className="text-[22px] font-black leading-tight tracking-tight mb-1">
              {product.name}
            </h1>
            {product.shortDescription && (
              <p className="text-sm text-[var(--gray-500)] mb-5 leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            {/* 가격 */}
            <div className="flex items-baseline gap-3 mb-6 pb-6 border-b border-[var(--line)]">
              {discountRate > 0 && (
                <span className="font-[var(--font-display)] text-[var(--red)] text-2xl">
                  -{discountRate}%
                </span>
              )}
              <span className="text-[32px] font-black text-[var(--black)]">
                {product.salePrice.toLocaleString()}
                <span className="text-base font-normal">원</span>
              </span>
              {discountRate > 0 && (
                <span className="text-sm text-[var(--gray-500)] line-through">
                  {product.basePrice.toLocaleString()}원
                </span>
              )}
            </div>

            {/* 옵션 선택 (Client Component) */}
            <ProductOptions
              productId={product.id}
              productSlug={product.slug}
              productName={product.name}
              brandName={product.brand.name}
              imageUrl={mainImage}
              options={product.options}
              colors={colors}
              sizes={sizes}
              embroideryAvailable={product.embroideryAvailable}
              salePrice={product.salePrice}
            />

            {/* 배송 정보 */}
            <div className="border border-[var(--line)] mt-5">
              {[
                { label: "배송", value: "무료배송 (전 상품)", highlight: true },
                { label: "출고", value: "평일 14시 이전 주문 당일 출고" },
                { label: "도착", value: "1~2일 이내" },
              ].map((row) => (
                <div key={row.label} className="flex px-4 py-3 border-b border-[var(--line)] last:border-b-0 text-sm">
                  <span className="w-16 font-[var(--font-mono)] text-[11px] text-[var(--gray-500)] tracking-[0.5px] flex-shrink-0 pt-0.5">
                    {row.label}
                  </span>
                  <span className={`flex-1 ${row.highlight ? "text-[var(--red)] font-bold" : "text-[var(--gray-700)]"}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* 인증 정보 */}
            {product.certifications.length > 0 && (
              <div className="mt-4 border border-[var(--line)]">
                <div className="px-4 py-2.5 bg-[var(--gray-50)] border-b border-[var(--line)]">
                  <span className="font-[var(--font-mono)] text-[10px] text-[var(--red)] tracking-[1.5px] font-semibold">
                    ─ CERTIFICATION
                  </span>
                </div>
                {product.certifications.map((c) => (
                  <div key={c.id} className="flex px-4 py-3 border-b border-[var(--line)] last:border-b-0 text-sm">
                    <span className="w-24 font-bold text-xs flex-shrink-0">
                      {CERT_LABELS[c.type]}
                    </span>
                    <span className="text-[var(--gray-700)] font-[var(--font-mono)] text-xs">
                      {c.number}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
