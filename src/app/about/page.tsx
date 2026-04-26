import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "회사 소개 | 에스에스종합상사",
  description: "인천에서 시작된 작업복·안전용품 종합상사. 80여 개 검증된 브랜드, 자수·마킹 서비스.",
};

const HISTORY = [
  { year: "2010", title: "창업", desc: "인천 작업복 전문점으로 시작" },
  { year: "2013", title: "자수 사업부 신설", desc: "컴퓨터 자수 장비 도입, 마킹 서비스 시작" },
  { year: "2016", title: "온라인 확장", desc: "온라인 판매 채널 운영 시작" },
  { year: "2019", title: "B2B 전담팀", desc: "단체주문 전담 매니저 제도 도입" },
  { year: "2022", title: "브랜드 80개 돌파", desc: "국내외 프리미엄 브랜드 입점 확대" },
  { year: "2026", title: "이커머스 런칭", desc: "자체 플랫폼 SS Mart 오픈" },
];

const STRENGTHS = [
  { num: "01", title: "80여 개 공식 브랜드", desc: "PIOZEN, CARHARTT, K2 SAFETY, 3M 등 검증된 글로벌·국내 브랜드만 엄선하여 공식 입점. 정품만 취급합니다.", stat: "80+" },
  { num: "02", title: "자수 14년 노하우", desc: "컴퓨터 자수부터 캐릭터 디자인까지. 누적 12,000+ 케이스를 통해 쌓은 기술력으로 완벽한 결과물을 만들어 드립니다.", stat: "12,000+" },
  { num: "03", title: "단체주문 전문", desc: "100벌 이상 단체주문 시 최대 30% 추가 할인. 전담 매니저 1:1 배정으로 납기부터 세금계산서까지 일괄 처리합니다.", stat: "30%" },
  { num: "04", title: "전 상품 무료 배송", desc: "제주·도서산간 포함 전 상품 무료 배송. 평일 14시 이전 주문 당일 출고. 빠르고 안전하게 받아보세요.", stat: "FREE" },
];

const INFO_ITEMS = [
  { label: "상호", value: "㈜에스에스종합상사" },
  { label: "대표", value: "○○○" },
  { label: "사업자등록번호", value: "000-00-00000" },
  { label: "통신판매업", value: "제2026-인천○○-0000호" },
  { label: "소재지", value: "인천광역시 ○○구 ○○로 000" },
  { label: "전화", value: "1588-0000" },
  { label: "이메일", value: "contact@ssmart.kr" },
  { label: "카카오 채널", value: "@ssmart" },
];

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* 히어로 */}
      <section
        className="text-white py-24 relative overflow-hidden"
        style={{
          backgroundImage: "linear-gradient(135deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.6) 100%), url('https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1600&q=85')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-[1340px] mx-auto px-6">
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[3px] mb-4">
            ABOUT US / COMPANY PROFILE
          </div>
          <h1 className="text-[48px] font-black leading-tight tracking-tight mb-4">
            현장의 신뢰
            <br />
            <span className="text-[var(--red)]">에스에스종합상사</span>
          </h1>
          <p className="text-white/70 text-sm leading-relaxed mb-10 max-w-xl">
            인천에서 시작된 작업복 · 안전용품 종합상사.
            <br />
            80여 개 검증된 브랜드를 합리적 가격으로 공급하며,
            <br />
            자수 / 마킹까지 한 번에 해결합니다.
          </p>
          <div className="flex gap-10 pt-10 border-t border-white/15">
            {[
              { label: "창업", value: "2010" },
              { label: "입점 브랜드", value: "80+" },
              { label: "누적 거래처", value: "3,200+" },
              { label: "자수 케이스", value: "12,000+" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-[var(--font-display)] text-[36px] text-[var(--yellow)]">{s.value}</div>
                <div className="font-[var(--font-mono)] text-[10px] text-white/40 tracking-[1px] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4가지 강점 */}
      <section className="max-w-[1340px] mx-auto px-6 py-16">
        <div className="mb-10">
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[2px] mb-2">SECTION / 01 ─ STRENGTHS</div>
          <h2 className="text-[32px] font-black tracking-tight">왜 <span className="text-[var(--red)]">에스에스</span>인가</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {STRENGTHS.map((s) => (
            <div key={s.num} className="border border-[var(--line)] p-8 flex gap-6 hover:border-[var(--black)] transition-colors">
              <div className="font-[var(--font-display)] text-[56px] text-[var(--gray-100)] leading-none flex-shrink-0">{s.num}</div>
              <div>
                <div className="flex items-baseline gap-3 mb-2">
                  <h3 className="text-lg font-black">{s.title}</h3>
                  <span className="font-[var(--font-display)] text-2xl text-[var(--red)]">{s.stat}</span>
                </div>
                <p className="text-sm text-[var(--gray-600)] leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 연혁 */}
      <section className="bg-[var(--gray-50)] py-16">
        <div className="max-w-[1340px] mx-auto px-6">
          <div className="mb-10">
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[2px] mb-2">SECTION / 02 ─ HISTORY</div>
            <h2 className="text-[32px] font-black tracking-tight">회사 <span className="text-[var(--red)]">연혁</span></h2>
          </div>
          <div className="space-y-0">
            {HISTORY.map((h, i) => (
              <div key={h.year} className={`grid grid-cols-[120px_1fr] border-l-2 ${i === HISTORY.length - 1 ? "border-[var(--red)]" : "border-[var(--line)]"} pl-6 pb-8`}>
                <div>
                  <span className="font-[var(--font-display)] text-2xl text-[var(--red)]">{h.year}</span>
                </div>
                <div>
                  <div className="font-bold mb-1">{h.title}</div>
                  <div className="text-sm text-[var(--gray-600)]">{h.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 회사 정보 */}
      <section className="bg-[var(--black)] text-white py-16">
        <div className="max-w-[1340px] mx-auto px-6">
          <div className="mb-10">
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[2px] mb-2">SECTION / 03 ─ INFO</div>
            <h2 className="text-[32px] font-black tracking-tight text-white">회사 <span className="text-[var(--yellow)]">정보</span></h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {INFO_ITEMS.map((item) => (
              <div key={item.label} className="flex border-b border-[#333] py-3.5">
                <span className="w-40 font-[var(--font-mono)] text-[11px] text-white/40 tracking-[0.5px] flex-shrink-0">{item.label}</span>
                <span className="text-sm text-white/80">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--gray-50)] py-16">
        <div className="max-w-[900px] mx-auto px-6 text-center">
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[3px] mb-4">─ CONTACT US</div>
          <h2 className="text-[32px] font-black tracking-tight mb-4">함께 일하고 싶으신가요?</h2>
          <p className="text-sm text-[var(--gray-600)] leading-relaxed mb-8">
            단체주문 견적부터 자수 상담까지 전담 매니저가 도와드립니다.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/bulk-order" className="bg-[var(--red)] text-white px-8 py-4 font-black text-sm hover:bg-[var(--red-dark)] transition-colors">
              단체주문 견적 →
            </Link>
            <Link href="/support" className="border-2 border-[var(--black)] px-8 py-4 font-bold text-sm hover:bg-[var(--black)] hover:text-white transition-colors">
              고객 지원
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
