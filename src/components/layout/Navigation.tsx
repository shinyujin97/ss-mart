import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CategoryDropdown from "./CategoryDropdown";

const NAV_LINKS = [
  { href: "/embroidery", label: "자수/마킹" },
  { href: "/embroidery/gallery", label: "자수 갤러리" },
  { href: "/best", label: "베스트" },
  { href: "/categories/workwear", label: "작업복" },
  { href: "/categories/safety-shoes", label: "안전화" },
  { href: "/categories/safety-equipment", label: "안전용품" },
  { href: "/brands", label: "브랜드관" },
];

export default async function Navigation() {
  // DB에서 카테고리 트리 조회
  const categories = await prisma.category.findMany({
    where: { isActive: true, level: 0 },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: true } },
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          slug: true,
          name: true,
          _count: { select: { products: true } },
        },
      },
    },
  });

  return (
    <nav className="bg-[var(--black)]">
      <div className="max-w-[1340px] mx-auto px-6 flex items-stretch h-[52px]">
        {/* ALL CATEGORIES 드롭다운 */}
        <CategoryDropdown categories={categories} />

        {/* 메인 네비게이션 */}
        <div className="flex flex-1 items-center">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-[18px] py-4 font-medium text-[13px] tracking-[0.2px] transition-all hover:bg-white/10 ${
                (link as any).hot ? "text-[var(--yellow)] font-semibold" : "text-white"
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
