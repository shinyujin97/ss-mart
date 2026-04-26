import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function WishlistIcon() {
  const session = await auth();
  let count = 0;

  if (session?.user?.id) {
    count = await prisma.wishlist.count({
      where: { memberId: session.user.id as string },
    });
  }

  return (
    <Link
      href="/mypage/wishlist"
      className="relative px-[18px] py-[10px] flex items-center justify-center text-[var(--gray-700)] hover:text-[var(--red)] transition-colors border-l border-[var(--line)]"
      aria-label="찜 목록"
    >
      {/* 하트 아이콘 */}
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>

      {/* 배지 */}
      {count > 0 && (
        <span className="absolute top-1.5 right-2.5 min-w-[18px] h-[18px] bg-[var(--red)] text-white text-[10px] font-bold font-[var(--font-mono)] rounded-full flex items-center justify-center px-1 leading-none">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
