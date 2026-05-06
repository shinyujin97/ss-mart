import Link from "next/link";
import WishlistIcon from "./WishlistIcon";
import HeaderAuth from "./HeaderAuth";
import SearchBar from "./SearchBar";

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
        <SearchBar />

        {/* Icons */}
        <div className="flex items-center ml-auto">
          <WishlistIcon />
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
