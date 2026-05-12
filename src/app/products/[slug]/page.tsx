import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import ProductOptions from "./ProductOptions";
import ProductImageGallery from "./ProductImageGallery";

interface Props {
  params: Promise<{ slug: string }>;
}

// 색상명 → HEX 매핑
const COLOR_HEX: Record<string, string> = {
  "블랙": "#111111", "BLACK": "#111111",
  "화이트": "#f5f5f5", "WHITE": "#f5f5f5",
  "네이비": "#1a2a4a", "NAVY": "#1a2a4a",
  "D.네이비": "#0d1b2a", "다크네이비": "#0d1b2a",
  "M.네이비": "#1a2a6a",
  "그레이": "#8a8a8a", "GRAY": "#8a8a8a", "GREY": "#8a8a8a",
  "M.그레이": "#6e6e6e", "C.그레이": "#9c9c9c",
  "라이트그레이": "#c0c0c0", "L.그레이": "#c0c0c0",
  "차콜": "#3d3d3d",
  "블루": "#1e40af", "BLUE": "#1e40af",
  "청지": "#4a6fa5",
  "레드": "#c8161d", "RED": "#c8161d", "빨강": "#c8161d",
  "오렌지": "#f97316", "ORANGE": "#f97316",
  "노랑": "#ffd400", "형광": "#adff2f",
  "카키": "#8B8B4B", "KHAKI": "#8B8B4B",
  "베이지": "#c8b89a", "BEIGE": "#c8b89a",
  "브라운": "#8B4513", "BROWN": "#8B4513",
  "머스터드": "#e1ad21",
  "그린": "#4a7c59", "GREEN": "#4a7c59",
  "퍼플": "#6b46c1", "PURPLE": "#6b46c1",
  "핑크": "#f472b6", "PINK": "#f472b6",
};

// 사이즈 범위 확장
function expandSizeRange(range: string): string[] {
  const XL_ORDER = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
  // XL 계열 (S~4XL, M~3XL 등)
  const xlMatch = range.match(/^([SMLX\d]+)~(\d?XL)$/i);
  if (xlMatch) {
    const from = xlMatch[1].toUpperCase();
    const to = xlMatch[2].toUpperCase();
    const fi = XL_ORDER.indexOf(from);
    const ti = XL_ORDER.indexOf(to);
    if (fi !== -1 && ti !== -1) return XL_ORDER.slice(fi, ti + 1);
  }
  // 숫자 범위 (90~120, 225~300, 28~42 등)
  const numMatch = range.match(/^(\d+)~(\d+)$/);
  if (numMatch) {
    const from = parseInt(numMatch[1]);
    const to = parseInt(numMatch[2]);
    // 신발 사이즈 (5 단위)
    if (from >= 220 && to <= 310) {
      const arr: string[] = [];
      for (let i = from; i <= to; i += 5) arr.push(String(i));
      return arr;
    }
    // 바지 사이즈 (2 단위)
    if (from >= 26 && to <= 46) {
      const arr: string[] = [];
      for (let i = from; i <= to; i += 2) arr.push(String(i));
      return arr;
    }
    // 의류 cm 사이즈 (5 단위)
    if (from >= 80 && to <= 130) {
      const arr: string[] = [];
      for (let i = from; i <= to; i += 5) arr.push(String(i));
      return arr;
    }
  }
  return [range];
}

function parseNameOptions(name: string): {
  colors: { color: string; colorHex: string | null }[];
  sizes: string[];
} {
  const parts = name.split("/").map((p) => p.trim()).filter(Boolean);

  // 색상 파싱: 마지막 2개 파트에서 색상명 탐색
  const colorCandidates = parts.slice(-3).join("/");
  const foundColors: { color: string; colorHex: string | null }[] = [];
  const colorNames = colorCandidates.split(/[&,+]/).map((c) => c.trim());
  for (const cn of colorNames) {
    if (COLOR_HEX[cn]) {
      if (!foundColors.find((c) => c.color === cn))
        foundColors.push({ color: cn, colorHex: COLOR_HEX[cn] });
    } else {
      const matched = Object.keys(COLOR_HEX).find((k) => cn.includes(k));
      if (matched && !foundColors.find((c) => c.color === matched))
        foundColors.push({ color: matched, colorHex: COLOR_HEX[matched] });
    }
  }

  // 사이즈 파싱: S~XL, 90~120, 225~300, 28~42 등 패턴 탐색
  const sizes: string[] = [];
  for (const part of parts) {
    if (/^[SMLX\d]+~[\dXL]+$/i.test(part.trim())) {
      sizes.push(...expandSizeRange(part.trim()));
      break;
    }
    const inner = part.match(/(\d+~\d+)/);
    if (inner) {
      sizes.push(...expandSizeRange(inner[1]));
      break;
    }
  }

  // 사이즈 못 찾으면 상품명 키워드로 기본값 적용
  if (sizes.length === 0) {
    const n = name.toLowerCase();
    if (/신발|안전화|화\b|슈즈|boots|shoe/.test(n)) {
      sizes.push(...["240", "245", "250", "255", "260", "265", "270", "275", "280"]);
    } else if (/바지|하의|팬츠|pants/.test(n)) {
      sizes.push(...["28", "30", "32", "34", "36", "38"]);
    } else {
      // 상의/세트/기타 작업복 기본값
      sizes.push(...["M", "L", "XL", "2XL", "3XL", "4XL"]);
    }
  }

  return { colors: foundColors, sizes };
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

  const [product, session] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: {
        brand: true,
        images: { orderBy: { sortOrder: "asc" } },
        options: { where: { isActive: true }, orderBy: [{ color: "asc" }, { size: "asc" }] },
        certifications: true,
        categories: { include: { category: true } },
      },
    }),
    auth(),
  ]);

  if (!product || product.status === "HIDDEN") notFound();

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  // 로그인 시 찜 여부 확인
  const wishlisted = session?.user?.id
    ? !!(await prisma.wishlist.findUnique({
        where: { memberId_productId: { memberId: session.user.id as string, productId: product.id } },
      }))
    : false;

  const mainImage =
    product.images.find((i) => i.isMain)?.url ??
    product.images[0]?.url ??
    `https://placehold.co/600x600/f4f4f4/8a8a8a?text=${encodeURIComponent(product.name)}`;

  // DB 옵션이 있으면 DB 기준, 없으면 상품명에서 파싱
  const hasDbOptions = product.options.length > 0;
  const parsed = hasDbOptions ? null : parseNameOptions(product.name);

  const colors = hasDbOptions
    ? [...new Map(product.options.map((o) => [o.color, { color: o.color, colorHex: o.colorHex }])).values()]
    : (parsed?.colors ?? []);

  const sizes = hasDbOptions
    ? [...new Set(product.options.map((o) => o.size))]
    : (parsed?.sizes ?? []);

  const BOTTOM_SLUGS = ["workwear-bottom", "workwear-pants", "cargo-pants", "shorts"];
  const TOP_SLUGS    = ["workwear-top", "workwear-jacket", "workwear-vest", "safety-vest",
                        "workwear-winter", "workwear-misc", "workwear-fb", "fb-top"];
  const categorySlugs = product.categories.map((c) => c.category.slug);
  const garmentType: "top" | "bottom" | "other" =
    categorySlugs.some((s) => BOTTOM_SLUGS.some((b) => s.includes(b) || b.includes(s)))
      ? "bottom"
      : categorySlugs.some((s) => TOP_SLUGS.some((t) => s.includes(t) || t.includes(s)))
      ? "top"
      : "other";

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
        <div className="grid grid-cols-[1fr_460px] gap-12" id="product-top">
          {/* 좌측: 이미지 갤러리 */}
          <ProductImageGallery
            images={product.images}
            productName={product.name}
            certifications={product.certifications}
            certLabels={CERT_LABELS}
          />

          {/* 우측: 상품 정보 */}
          <div>
            {/* 관리자 수정 버튼 */}
            {isAdmin && (
              <div className="flex justify-end mb-3">
                <Link
                  href={`/admin/products/${product.id}`}
                  className="flex items-center gap-1.5 bg-[#c8161d] text-white text-[11px] font-bold px-3 py-1.5 hover:bg-[#9c0e15] transition-colors font-[var(--font-mono)] tracking-[0.5px]"
                >
                  ▣ 상품 수정
                </Link>
              </div>
            )}

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

            {/* 옵션 선택 + 찜하기 (Client Component) */}
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
              initialWishlisted={wishlisted}
              garmentType={garmentType}
            />

            {/* 배송 정보 */}
            <div className="border border-[var(--line)] mt-5">
              {[
                { label: "배송", value: "배송비 별도 문의" },
                { label: "출고", value: "평일 14시 이전 주문 당일 출고" },
                { label: "도착", value: "1~2일 이내" },
              ].map((row) => (
                <div key={row.label} className="flex px-4 py-3 border-b border-[var(--line)] last:border-b-0 text-sm">
                  <span className="w-16 font-[var(--font-mono)] text-[11px] text-[var(--gray-500)] tracking-[0.5px] flex-shrink-0 pt-0.5">
                    {row.label}
                  </span>
                  <span className="flex-1 text-[var(--gray-700)]">
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

      {/* 상세 설명 섹션 */}
      <div className="border-t border-[var(--line)] mt-4">
        <div className="max-w-[1340px] mx-auto px-6">
          {/* 탭 헤더 */}
          <div className="flex border-b border-[var(--line)]">
            {["상품 상세", "배송/교환/반품"].map((tab, i) => (
              <div
                key={tab}
                className={`px-8 py-4 font-[var(--font-mono)] text-[12px] tracking-[1px] font-semibold border-b-2 transition-colors ${
                  i === 0
                    ? "border-[var(--black)] text-[var(--black)]"
                    : "border-transparent text-[var(--gray-500)]"
                }`}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* 상세 이미지 */}
          <div className="py-10 flex flex-col items-center gap-0">
            {product.images.filter((img) => img.url.includes("_dt")).length > 0 ? (
              product.images
                .filter((img) => img.url.includes("_dt"))
                .map((img) => (
                  <img
                    key={img.id}
                    src={img.url}
                    alt={product.name}
                    className="w-full max-w-[860px] block"
                    loading="lazy"
                    decoding="async"
                  />
                ))
            ) : (
              <div className="py-20 text-center text-[var(--gray-300)] font-[var(--font-mono)] text-sm">
                상세 이미지 준비 중입니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
