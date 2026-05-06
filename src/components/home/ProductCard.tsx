import Link from "next/link";
import Image from "next/image";
import { BLUR_DATA_URL } from "@/lib/imageUtils";

interface ProductCardProps {
  slug: string;
  name: string;
  brand: string;
  basePrice?: number;
  salePrice?: number;
  imageUrl: string;
  isNew?: boolean;
  isBest?: boolean;
  embroideryAvailable?: boolean;
  priority?: boolean;
}

export default function ProductCard({
  slug,
  name,
  brand,
  imageUrl,
  isNew,
  isBest,
  embroideryAvailable,
  priority = false,
}: ProductCardProps) {
  return (
    <Link href={`/products/${slug}`} className="group block">
      {/* 이미지 */}
      <div className="relative aspect-square bg-[var(--gray-100)] overflow-hidden mb-3">
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1400px) 25vw, 270px"
          priority={priority}
          loading={priority ? undefined : "lazy"}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* 배지 */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isNew && (
            <span className="bg-[var(--black)] text-white font-[var(--font-mono)] text-[9px] px-2 py-0.5 tracking-[1px]">
              NEW
            </span>
          )}
          {isBest && (
            <span className="bg-[var(--red)] text-white font-[var(--font-mono)] text-[9px] px-2 py-0.5 tracking-[1px]">
              BEST
            </span>
          )}
        </div>
        {embroideryAvailable && (
          <div className="absolute bottom-2 left-2">
            <span className="bg-[var(--yellow)] text-[var(--black)] font-[var(--font-mono)] text-[9px] px-2 py-0.5 tracking-[0.5px] font-bold">
              자수 가능
            </span>
          </div>
        )}
      </div>

      {/* 정보 */}
      <div>
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] tracking-[1px] mb-1">
          {brand}
        </div>
        <div className="text-sm font-semibold text-[var(--black)] mb-2 line-clamp-2 leading-snug">
          {name}
        </div>
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] tracking-[0.5px]">
          문의 전화 031-430-0497
        </div>
      </div>
    </Link>
  );
}
