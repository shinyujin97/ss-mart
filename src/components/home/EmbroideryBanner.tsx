import Link from "next/link";

const FEATURES = [
  { num: "01", title: "무료 시안 제작", desc: "전문 디자이너가 직접 제작\n시안 확정 전 무제한 수정" },
  { num: "02", title: "7가지 자수 종류", desc: "컴퓨터 자수 / 패치 / 아플리케\n실사 패치 / 벨크로 / 실크 인쇄" },
  { num: "03", title: "빠른 납품", desc: "1~10벌 3~5영업일\n100벌+ 7~14영업일" },
  { num: "04", title: "저작권 안전 보장", desc: "오리지널 캐릭터 디자인\n고객사 자체 로고 전문" },
];

export default function EmbroideryBanner() {
  return (
    <section className="bg-[var(--gray-900)] text-white py-16 my-12 relative overflow-hidden">
      {/* 상단 라인 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--red)]" />

      <div className="max-w-[1340px] mx-auto px-6">
        {/* 헤더 */}
        <div className="flex items-end justify-between mb-10 pb-5 border-b border-[#333]">
          <div>
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[2px] mb-2">
              SECTION / 03 ─ EMBROIDERY & MARKING
            </div>
            <h2 className="text-[32px] font-black leading-tight tracking-tight">
              우리 회사 로고가 박힌
              <br />
              <span className="text-[var(--red)]">맞춤 작업복</span> 제작
            </h2>
          </div>
          <div className="text-right">
            <div className="font-[var(--font-display)] text-[60px] text-white/10 leading-none">
              12,000+
            </div>
            <div className="font-[var(--font-mono)] text-[10px] text-white/40 tracking-[2px]">
              COMPLETED PROJECTS
            </div>
          </div>
        </div>

        {/* 피처 그리드 */}
        <div className="grid grid-cols-4 gap-0 border border-[#333] mb-10">
          {FEATURES.map((f, i) => (
            <div
              key={f.num}
              className={`p-6 ${i < 3 ? "border-r border-[#333]" : ""}`}
            >
              <div className="font-[var(--font-display)] text-[40px] text-white/10 leading-none mb-3">
                {f.num}
              </div>
              <div className="text-sm font-bold mb-2">{f.title}</div>
              <div className="text-[11px] text-white/50 leading-relaxed whitespace-pre-line">
                {f.desc}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex gap-3">
          <Link
            href="/embroidery/simulator"
            className="bg-[var(--red)] text-white px-8 py-4 font-bold text-sm tracking-[0.5px] hover:bg-[var(--red-dark)] transition-colors"
          >
            자수 시뮬레이터 →
          </Link>
          <Link
            href="/bulk-order"
            className="border border-white/30 text-white px-8 py-4 font-bold text-sm tracking-[0.5px] hover:border-white transition-colors"
          >
            단체주문 견적 →
          </Link>
        </div>
      </div>
    </section>
  );
}
