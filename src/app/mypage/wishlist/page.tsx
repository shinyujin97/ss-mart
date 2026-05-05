import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { BLUR_DATA_URL } from "@/lib/imageUtils";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata = { title: "위시리스트 | 마이페이지" };

export default async function WishlistPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const wishlist = await prisma.wishlist.findMany({
    where: { memberId: session.user.id as string },
    include: {
      product: {
        include: {
          brand: { select: { name: true } },
          images: { where: { isMain: true }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black">위시리스트</h2>
        <span className="font-[var(--font-mono)] text-xs text-[var(--gray-500)]">{wishlist.length}개 상품</span>
      </div>

      {wishlist.length === 0 ? (
        <div className="border border-[var(--line)] bg-white py-20 text-center">
          <div className="font-[var(--font-display)] text-[60px] text-[var(--gray-100)] leading-none mb-4">WISH</div>
          <p className="text-sm text-[var(--gray-400)] mb-5">찜한 상품이 없습니다.</p>
          <Link href="/" className="inline-block bg-[var(--black)] text-white px-6 py-3 text-sm font-bold hover:bg-[var(--gray-900)]">
            쇼핑하러 가기 →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {wishlist.map(({ product }) => {
            const imageUrl = product.images[0]?.url ?? `https://placehold.co/400x400/f4f4f4/8a8a8a?text=${encodeURIComponent(product.name)}`;
            const discountRate = Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100);

            return (
              <div key={product.id} className="group relative">
                <Link href={`/products/${product.slug}`}>
                  <div className="relative aspect-square bg-[var(--gray-100)] overflow-hidden mb-2.5">
                    <Image src={imageUrl} alt={product.name} fill placeholder="blur" blurDataURL={BLUR_DATA_URL} className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    {discountRate > 0 && (
                      <span className="absolute top-2 left-2 bg-[var(--red)] text-white font-[var(--font-mono)] text-[9px] px-2 py-0.5">
                        -{discountRate}%
                      </span>
                    )}
                  </div>
                  <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] tracking-[1px] mb-0.5">{product.brand.name}</div>
                  <div className="text-xs font-semibold line-clamp-2 mb-1.5">{product.name}</div>
                  <div className="font-bold text-sm text-[var(--black)]">{product.salePrice.toLocaleString()}원</div>
                </Link>
                <button className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white flex items-center justify-center text-xs hover:bg-[var(--red)] transition-colors opacity-0 group-hover:opacity-100">
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
