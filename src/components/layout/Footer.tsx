import Link from "next/link";

const BOTTOM_LINKS = [
  { href: "/about", label: "회사소개" },
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/support", label: "고객종합센터" },
  { href: "/mypage/orders", label: "주문배송조회" },
];

export default function Footer() {
  return (
    <footer className="bg-[var(--black)] text-[#888] text-xs">
      <div className="max-w-[1340px] mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-10 pb-7 border-b border-[#333]">

          {/* 고객센터 */}
          <div>
            <div className="text-white font-bold text-sm mb-2">고객센터</div>
            <div className="font-[var(--font-display)] text-[28px] text-white tracking-wide mb-1">
              031-430-0497
            </div>
            <div className="leading-relaxed">
              평 일 : 09:00 ~ 18:00<br />
              토요일 : 09:00 ~ 12:00<br />
              일요일 및 공휴일 휴무
            </div>
          </div>

          {/* 사업자 정보 */}
          <div>
            <div className="leading-relaxed">
              상호 : 에스에스종합상사&nbsp;&nbsp;&nbsp;대표 : 신상영&nbsp;&nbsp;&nbsp;주소 : 경기도 시흥시 공단1대로 204 공구상가 31동 111~112호
              <br />
              사업자등록번호 : 134-09-17919&nbsp;&nbsp;
              <Link href="/business-info" className="border border-[#666] px-1.5 py-0.5 text-[10px] hover:text-white transition-colors">
                사업자번호조회
              </Link>
              &nbsp;&nbsp;통신판매업신고 : 제 2020-경기시흥-0317 호
              <br />
              개인정보보호책임자 : 에스에스종합상사 운영팀장
              <br />
              <span className="text-[#666]">copyright iuniform.net rights reserved.</span>
            </div>
          </div>
        </div>

        {/* 하단 링크 */}
        <div className="pt-5 flex items-center gap-5 text-[#666]">
          {BOTTOM_LINKS.map((link, i) => (
            <span key={link.href} className="flex items-center gap-5">
              <Link href={link.href} className="hover:text-white transition-colors">
                {link.label}
              </Link>
              {i < BOTTOM_LINKS.length - 1 && <span className="text-[#444]">|</span>}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
