import Link from "next/link";
import CartIcon from "./CartIcon";

export default function Header() {
  return (
    <header className="bg-white border-b border-[var(--line)]">
      <div className="max-w-[1340px] mx-auto px-6 py-[26px] flex items-center gap-10">
        {/* Logo */}
        <Link
          href="/"
          className="flex flex-col leading-none pr-[30px] border-r border-[var(--line)]"
        >
          <span className="text-2xl font-black text-[var(--black)] tracking-tight">
            에스에스<span className="text-[var(--red)]">종합상사</span>
          </span>
          <span className="font-[var(--font-display)] text-[11px] tracking-[3px] text-[var(--gray-500)] mt-[5px]">
            SAFETY · WORKWEAR · SINCE
          </span>
        </Link>

        {/* Search */}
        <div className="flex-1 relative flex items-center border border-[var(--line)] h-[46px]">
          <input
            type="text"
            placeholder="브랜드, 상품명, 카테고리로 검색하세요"
            className="flex-1 px-4 text-sm outline-none bg-transparent"
          />
          <button className="px-4 text-xl text-[var(--gray-500)] hover:text-[var(--red)] transition-colors">
            ⌕
          </button>
        </div>

        {/* Icons */}
        <div className="flex items-center ml-auto">
          <Link
            href="/wishlist"
            className="px-[18px] py-[10px] text-xs font-medium text-[var(--gray-700)] hover:text-[var(--red)] transition-colors flex items-center gap-1.5 border-[var(--line)]"
          >
            찜{" "}
            <span className="text-[var(--red)] font-bold font-[var(--font-display)] text-sm">
              0
            </span>
          </Link>
          <CartIcon />
          <Link
            href="/mypage"
            className="px-[18px] py-[10px] text-xs font-medium text-[var(--gray-700)] hover:text-[var(--red)] transition-colors border-l border-[var(--line)]"
          >
            마이페이지
          </Link>
        </div>
      </div>
    </header>
  );
}
