import Link from "next/link";

const FEATURES = [
  { num: "01", title: "무료 시안 제작", desc: "고객 디자인으로 제작\n시안은 최종 2번까지 수정 가능" },
  { num: "02", title: "7가지 자수 종류", desc: "컴퓨터 자수 / 패치 / 아플리케\n실사 패치 / 벨크로 / 실크 인쇄" },
  { num: "03", title: "빠른 납품", desc: "1~10벌 3~5영업일\n100벌+ 7~14영업일" },
  { num: "04", title: "저작권 안전 보장", desc: "오리지널 캐릭터 디자인\n고객사 자체 로고 전문" },
];

export default function EmbroideryBanner() {
  return (
    <section className="text-white py-16 my-12 relative overflow-hidden">
      {/* 배경 이미지 */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/embroidery/machine.jpg')" }}
      />
      {/* 어두운 오버레이 */}
      <div className="absolute inset-0 bg-[var(--black)]/55" />
      {/* 상단 라인 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--red)]" />

      <div className="max-w-[1340px] mx-auto px-6 relative z-10">
        {/* 헤더 */}
        <div className="flex items-end justify-between mb-10 pb-5 border-b border-white/20">
          <div>
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--yellow)] tracking-[2px] mb-2">
              SECTION / 03 ─ EMBROIDERY & MARKING
            </div>
            <h2 className="text-[32px] font-black leading-tight tracking-tight text-white">
              원하는 디자인을 바로
              <br />
              <span className="text-[var(--red)]">자수·마킹</span> 서비스
            </h2>
          </div>
        </div>

        {/* 피처 그리드 */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          {FEATURES.map((f) => (
            <div
              key={f.num}
              className="p-6 bg-[var(--black)]/70 border border-[var(--yellow)]/30 backdrop-blur-sm
                cursor-default transition-all duration-300 ease-out
                hover:-translate-y-3 hover:scale-[1.03]
                hover:border-[var(--yellow)]/80 hover:bg-[var(--black)]/85
                hover:shadow-[0_20px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(255,212,0,0.15)]"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="font-[var(--font-display)] text-[40px] text-[var(--yellow)] leading-none mb-3 transition-transform duration-300 group-hover:scale-110">
                {f.num}
              </div>
              <div className="text-sm font-black mb-2 text-[var(--yellow)]">{f.title}</div>
              <div className="text-[12px] text-white leading-relaxed whitespace-pre-line">
                {f.desc}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex gap-3">
          <Link
            href="/embroidery"
            className="bg-[var(--red)] text-white px-8 py-4 font-bold text-sm tracking-[0.5px] hover:bg-[var(--red-dark)] transition-colors"
          >
            자수·마킹 안내 →
          </Link>
          <Link
            href="/bulk-order"
            className="bg-white/15 border border-white/50 text-white px-8 py-4 font-bold text-sm tracking-[0.5px] hover:bg-white/25 hover:border-white transition-all backdrop-blur-sm"
          >
            단체주문 견적 →
          </Link>
        </div>
      </div>
    </section>
  );
}
