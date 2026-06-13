import Link from "next/link";
import WishlistIcon from "./WishlistIcon";
import HeaderAuth from "./HeaderAuth";
import SearchBar from "./SearchBar";

export default function Header() {
  return (
    <header className="bg-white border-b border-[var(--line)]">
      <div className="max-w-[1340px] mx-auto px-4 md:px-6 py-4 md:py-[26px] flex items-center gap-4 md:gap-10">
        {/* Logo */}
        <Link
          href="/"
          className="flex flex-col leading-none md:pr-[30px] md:border-r md:border-[var(--line)] min-w-0 overflow-hidden shrink-0"
        >
          <span className="text-lg md:text-2xl font-black text-[var(--black)] tracking-tight whitespace-nowrap">
            에스에스<span className="text-[var(--red)]">종합상사</span>
          </span>
          <span className="font-[var(--font-display)] text-[8px] md:text-[11px] tracking-[1px] md:tracking-[3px] text-[var(--gray-500)] mt-[3px] md:mt-[5px] whitespace-nowrap">
            SAFETY · WORKWEAR · SINCE
          </span>
        </Link>

        {/* Search — 데스크톱 인라인 / 모바일은 드로어 내부로 이동 */}
        <div className="hidden md:flex flex-1">
          <SearchBar />
        </div>

        {/* Icons */}
        <div className="flex items-center ml-auto">
          <WishlistIcon />
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
