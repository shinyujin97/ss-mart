import Link from "next/link";
import { EMBROIDERY_TYPES, SIZE_LABELS, POSITION_LABELS } from "@/constants/embroidery";

const TYPE_IMAGES: Record<string, string> = {
  COMPUTER:   "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80",
  PATCH:      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80",
  APPLIQUE:   "https://images.unsplash.com/photo-1581791538161-8a3e57e5e5c6?w=400&q=80",
  REAL_PATCH: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80",
  VELCRO:     "https://images.unsplash.com/photo-1542219550-37153d387c27?w=400&q=80",
  CHARACTER:  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
  SILK_PRINT: "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=400&q=80",
};

const PROCESS_STEPS = [
  { num: "01", title: "시뮬레이터에서 시안 작성", desc: "자수 종류, 위치, 크기, 텍스트/로고를 직접 설정하세요." },
  { num: "02", title: "디자이너 시안 검토 (24시간)", desc: "전문 디자이너가 확인 후 카카오 채널로 시안을 보내드립니다." },
  { num: "03", title: "무제한 무료 수정", desc: "완벽한 결과물을 위해 시안 확정 전까지 무제한 수정합니다." },
  { num: "04", title: "시안 확정 후 제작 시작", desc: "확정 즉시 자수 작업을 시작합니다. 1~10벌 3~5영업일." },
  { num: "05", title: "품질 검수 후 출고", desc: "자수 품질을 꼼꼼히 검수 후 무료 배송합니다." },
];

export const metadata = { title: "자수 / 마킹 서비스 | 에스에스종합상사" };

export default function EmbroideryGuidePage() {
  return (
    <div className="bg-white">
      {/* 히어로 */}
      <section
        className="relative py-24 text-white overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #111 0%, #1a1a1a 50%, #2a0505 100%)",
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--red)]" />
        <div className="max-w-[1340px] mx-auto px-6 text-center">
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[3px] mb-4">
            EMBROIDERY & MARKING / SERVICE
          </div>
          <h1 className="text-[48px] font-black leading-tight tracking-tight mb-5">
            우리 회사 로고가 박힌
            <br />
            <span className="text-[var(--yellow)]">맞춤 작업복</span> 제작
          </h1>
          <p className="text-white/70 text-base leading-relaxed mb-10 max-w-xl mx-auto">
            전문 디자이너 시안 무료 제작 · 누적 12,000건 작업
            <br />
            저작권 안전 오리지널 캐릭터 · 5~7일 빠른 납품
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/embroidery/simulator"
              className="bg-[var(--red)] text-white px-8 py-4 font-black text-sm tracking-[0.5px] hover:bg-[var(--red-dark)] transition-colors"
            >
              자수 시뮬레이터 시작 →
            </Link>
            <Link
              href="/bulk-order"
              className="border border-white/30 text-white px-8 py-4 font-bold text-sm tracking-[0.5px] hover:border-white transition-colors"
            >
              단체주문 견적
            </Link>
          </div>

          {/* 통계 */}
          <div className="flex gap-10 justify-center mt-14 pt-10 border-t border-white/15">
            {[
              { label: "누적 시안", value: "12,000+" },
              { label: "재구매율", value: "87%" },
              { label: "평균 납기", value: "5일" },
              { label: "저작권 사고", value: "0건" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-[var(--font-display)] text-[36px] text-[var(--yellow)]">{s.value}</div>
                <div className="font-[var(--font-mono)] text-[10px] text-white/40 tracking-[1px] mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 자수 종류 7가지 */}
      <section className="max-w-[1340px] mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[2px] mb-3">
            SECTION / 01 ─ EMBROIDERY TYPES
          </div>
          <h2 className="text-3xl font-black tracking-tight">
            7가지 자수 <span className="text-[var(--red)]">종류</span>
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {Object.entries(EMBROIDERY_TYPES).map(([key, type], i) => (
            <div key={key} className="border border-[var(--line)] hover:border-[var(--red)] hover:-translate-y-1 transition-all group">
              <div className="aspect-square bg-[var(--gray-100)] relative overflow-hidden">
                <img
                  src={TYPE_IMAGES[key]}
                  alt={type.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <span className="absolute top-2.5 left-2.5 bg-[var(--black)] text-white font-[var(--font-mono)] text-[10px] px-2 py-1 tracking-[0.5px]">
                  / {String(i + 1).padStart(2, "0")}
                </span>
                {type.bulkFree && (
                  <span className="absolute bottom-2.5 right-2.5 bg-[var(--yellow)] text-[var(--black)] font-[var(--font-mono)] text-[9px] px-2 py-0.5 font-bold">
                    단체 무료
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="text-sm font-black mb-1.5 flex items-center gap-1.5">
                  <span className="text-[var(--red)] text-xs">◆</span>
                  {type.name}
                </div>
                <div className="font-[var(--font-mono)] text-[11px] text-[var(--gray-500)]">
                  기본가 {type.basePrice.toLocaleString()}원~
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 자수 위치 */}
      <section className="bg-[var(--gray-50)] py-16">
        <div className="max-w-[1340px] mx-auto px-6">
          <div className="text-center mb-10">
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[2px] mb-3">
              SECTION / 02 ─ POSITIONS
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              7가지 자수 <span className="text-[var(--red)]">위치</span>
            </h2>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Object.entries(POSITION_LABELS).map(([key, label]) => (
              <div key={key} className="border border-[var(--line)] bg-white p-4 text-center">
                <div className="w-10 h-10 border-2 border-[var(--gray-300)] mx-auto mb-3 flex items-center justify-center text-[var(--gray-400)]">
                  <span className="text-xl">👕</span>
                </div>
                <div className="text-xs font-bold">{label}</div>
                <div className="font-[var(--font-mono)] text-[9px] text-[var(--gray-400)] mt-0.5 tracking-[0.5px]">
                  {key}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 크기별 가격 */}
      <section className="max-w-[1340px] mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[2px] mb-3">
            SECTION / 03 ─ SIZE & PRICING
          </div>
          <h2 className="text-3xl font-black tracking-tight">
            크기별 <span className="text-[var(--red)]">가격 기준</span>
          </h2>
        </div>
        <div className="border border-[var(--line)]">
          <div className="grid grid-cols-6 bg-[var(--black)] text-white font-[var(--font-mono)] text-[10px] tracking-[1px]">
            <div className="px-4 py-3">SIZE</div>
            <div className="px-4 py-3">실측</div>
            <div className="px-4 py-3">가격 가산</div>
            <div className="px-4 py-3">컴퓨터 자수</div>
            <div className="px-4 py-3">패치 자수</div>
            <div className="px-4 py-3">실크 인쇄</div>
          </div>
          {[
            { key: "SMALL",   label: SIZE_LABELS.SMALL,   multi: 1.0, comp: 5000, patch: 8000, silk: 3000 },
            { key: "MEDIUM",  label: SIZE_LABELS.MEDIUM,  multi: 1.3, comp: 6500, patch: 10400, silk: 3900 },
            { key: "LARGE",   label: SIZE_LABELS.LARGE,   multi: 1.6, comp: 8000, patch: 12800, silk: 4800 },
            { key: "XLARGE",  label: SIZE_LABELS.XLARGE,  multi: 2.2, comp: 11000, patch: 17600, silk: 6600 },
            { key: "XXLARGE", label: SIZE_LABELS.XXLARGE, multi: 3.0, comp: 15000, patch: 24000, silk: 9000 },
          ].map((row, i) => (
            <div key={row.key} className={`grid grid-cols-6 border-t border-[var(--line)] text-sm ${i % 2 === 0 ? "bg-white" : "bg-[var(--gray-50)]"}`}>
              <div className="px-4 py-3 font-[var(--font-display)] text-base">{row.key}</div>
              <div className="px-4 py-3 font-[var(--font-mono)] text-[11px]">{row.label.replace(/\s+/g," ")}</div>
              <div className="px-4 py-3 text-[var(--red)] font-bold">×{row.multi}</div>
              <div className="px-4 py-3">{row.comp.toLocaleString()}원~</div>
              <div className="px-4 py-3">{row.patch.toLocaleString()}원~</div>
              <div className="px-4 py-3">{row.silk.toLocaleString()}원~</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--gray-500)] mt-3 font-[var(--font-mono)]">
          * 위치 수에 따라 × 위치 수 추가 / 100벌 이상 단체주문 시 컴퓨터 자수·패치·실크 인쇄 무료
        </p>
      </section>

      {/* 작업 프로세스 */}
      <section className="bg-[var(--gray-900)] text-white py-16">
        <div className="absolute inset-x-0 top-0 h-1 bg-[var(--red)]" />
        <div className="max-w-[1340px] mx-auto px-6">
          <div className="text-center mb-12">
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[2px] mb-3">
              SECTION / 04 ─ PROCESS
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white">
              자수 제작 <span className="text-[var(--yellow)]">프로세스</span>
            </h2>
          </div>
          <div className="grid grid-cols-5 gap-0 border border-[#333]">
            {PROCESS_STEPS.map((s, i) => (
              <div key={s.num} className={`p-6 ${i < 4 ? "border-r border-[#333]" : ""}`}>
                <div className="font-[var(--font-display)] text-[48px] text-white/10 leading-none mb-4">{s.num}</div>
                <div className="text-sm font-bold mb-2 leading-snug">{s.title}</div>
                <div className="text-xs text-white/50 leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--black)] py-20 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: "repeating-linear-gradient(90deg, var(--red) 0 16px, transparent 16px 32px)" }}
        />
        <div className="max-w-[900px] mx-auto px-6 text-center text-white">
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[3px] mb-5">
            ─ START NOW
          </div>
          <h2 className="text-[38px] font-black tracking-tight leading-tight mb-5">
            지금 바로 시뮬레이터로
            <br />
            <span className="text-[var(--yellow)]">무료 시안</span>을 만들어보세요
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-10">
            전문 디자이너의 시안 검토 무료 · 무제한 수정 · 저작권 안전 보장
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/embroidery/simulator"
              className="bg-[var(--red)] text-white px-10 py-4 font-black text-sm tracking-[0.5px] hover:bg-white hover:text-[var(--red)] transition-all"
            >
              자수 시뮬레이터 →
            </Link>
            <Link
              href="/bulk-order"
              className="border border-white/30 text-white px-10 py-4 font-bold text-sm hover:border-white transition-colors"
            >
              단체주문 견적
            </Link>
          </div>
          <div className="flex gap-8 justify-center mt-10 pt-8 border-t border-white/15 font-[var(--font-mono)] text-[11px] text-white/50">
            {["FREE DESIGN", "UNLIMITED REVISIONS", "COPYRIGHT SAFE", "5-7 DAYS DELIVERY"].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
