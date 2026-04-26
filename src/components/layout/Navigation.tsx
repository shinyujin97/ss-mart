import Link from "next/link";

const NAV_LINKS = [
  { href: "/new", label: "신상품" },
  { href: "/deal", label: "▶ TODAY DEAL", hot: true },
  { href: "/best", label: "베스트" },
  { href: "/categories/workwear", label: "작업복" },
  { href: "/categories/safety-shoes", label: "안전화" },
  { href: "/categories/safety-equipment", label: "안전용품" },
  { href: "/embroidery", label: "자수/마킹" },
  { href: "/brands", label: "브랜드관" },
];

export default function Navigation() {
  return (
    <nav className="bg-[var(--black)]">
      <div className="max-w-[1340px] mx-auto px-6 flex items-stretch">
        {/* All Categories Button */}
        <div className="bg-[var(--red)] text-white px-6 font-bold flex items-center gap-3 text-[13px] min-w-[200px] tracking-[0.3px] cursor-pointer hover:bg-[var(--red-dark)] transition-colors">
          ▣ ALL CATEGORIES
        </div>

        {/* Main Navigation */}
        <div className="flex flex-1 items-center">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-[18px] py-4 font-medium text-[13px] tracking-[0.2px] transition-all hover:bg-white/10 ${
                link.hot ? "text-[var(--yellow)] font-semibold" : "text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CS */}
        <div className="w-[190px] flex-shrink-0 px-[22px] flex items-center gap-[10px] border-l border-[#333] text-white text-xs">
          <span className="opacity-60">단체주문</span>
          <span className="font-[var(--font-display)] text-[var(--yellow)] text-lg tracking-wide">
            1588-0000
          </span>
        </div>
      </div>
    </nav>
  );
}
