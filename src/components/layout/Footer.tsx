import Link from "next/link";

const FOOTER_LINKS = {
  SHOP: [
    { href: "/new", label: "신상품" },
    { href: "/best", label: "베스트" },
    { href: "/deal", label: "오늘의 특가" },
    { href: "/embroidery", label: "자수/마킹" },
    { href: "/bulk-order", label: "단체주문" },
  ],
  SUPPORT: [
    { href: "/support/notice", label: "공지사항" },
    { href: "/support/inquiry", label: "1:1 문의" },
    { href: "/support/faq", label: "FAQ" },
    { href: "/support/review-event", label: "리뷰 이벤트" },
    { href: "/support/points", label: "적립금 안내" },
  ],
  POLICY: [
    { href: "/terms", label: "이용약관" },
    { href: "/privacy", label: "개인정보처리방침" },
    { href: "/shipping-policy", label: "배송/교환/환불" },
    { href: "/business-info", label: "사업자정보확인" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[var(--black)] text-[#888] pt-[50px] pb-7 text-xs">
      <div className="max-w-[1340px] mx-auto px-6">
        {/* Top grid */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-9 pb-8 border-b border-[#333]">
          {/* Brand info */}
          <div>
            <div className="text-[22px] font-black text-white mb-1 tracking-tight">
              에스에스<span className="text-[var(--red)]">종합상사</span>
            </div>
            <div className="font-[var(--font-display)] text-[10px] tracking-[3px] text-[var(--gray-500)] mb-[18px]">
              SAFETY · WORKWEAR
            </div>
            <h4 className="text-white text-xs mb-3 font-[var(--font-mono)] tracking-[1.5px] font-semibold">
              CUSTOMER CENTER
            </h4>
            <div className="font-[var(--font-display)] text-[30px] text-white tracking-wide my-1.5">
              1588-0000
            </div>
            <div className="mt-2 leading-relaxed">
              평일 09:00 - 18:00 (점심 12:00-13:00)
              <br />
              주말 및 공휴일 휴무 / 카톡: @ssmart
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white text-xs mb-3.5 font-[var(--font-mono)] tracking-[1.5px] font-semibold">
                {title}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="leading-[1.8] opacity-55 font-[var(--font-mono)] text-[11px] tracking-[0.3px]">
          ㈜에스에스종합상사 / 대표: ○○○ / 사업자등록번호: 000-00-00000 /
          통신판매업신고: 제2026-인천○○-0000호
          <br />
          인천광역시 ○○구 ○○로 000 / TEL. 430-0497 / FAX. 430-0498
          <br />© 2026 SS TRADING CO. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
}
