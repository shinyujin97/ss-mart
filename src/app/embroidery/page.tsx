import Link from "next/link";
import { EMBROIDERY_TYPES } from "@/constants/embroidery";
import ProcessSteps from "./ProcessSteps";
import ProcessFlow from "./ProcessFlow";
import PositionShowcase from "./PositionShowcase";

export const metadata = { title: "자수 / 마킹 서비스 | 에스에스종합상사" };

const PRICE_TABLE = [
  { size: "소",   dims: "5×10cm",   note: "왼가슴·이름표 등 소형",  prices: [15000, 25000, 35000, 45000] },
  { size: "중",   dims: "11×14cm",  note: "오른가슴·소매 로고",      prices: [25000, 35000, 45000, 55000] },
  { size: "대",   dims: "14×20cm",  note: "등판 상단·중형 패치",     prices: [35000, 45000, 55000, 65000] },
  { size: "특대", dims: "20×20cm+", note: "등판 전체·대형 디자인",   prices: [45000, 55000, 65000, 75000] },
];
const COLOR_COLS = ["1~2도", "3~6도", "7~10도", "10~15도"];


const TYPE_ICONS: Record<string, string> = {
  COMPUTER: "◈", PATCH: "◆", APPLIQUE: "◉",
  REAL_PATCH: "▣", VELCRO: "⊞", CHARACTER: "★", SILK_PRINT: "▤",
};

const NOTICES = [
  { label: "01", title: "저작권 있는 디자인은 불가합니다", desc: "디즈니·마블 등 유명 캐릭터나 타 브랜드 로고, 무단 폰트가 포함된 디자인은 작업이 어렵습니다. 직접 만드신 도안이나 회사 자체 로고라면 문제없습니다." },
  { label: "02", title: "어떤 파일 형식이든 괜찮습니다", desc: "JPG, PNG, AI, PSD, PDF 등 대부분의 파일 형식을 받습니다. 파일이 없으셔도 스케치나 참고 이미지만 있으면 상담 후 진행할 수 있습니다." },
  { label: "03", title: "시안 확정 후에는 환불이 어렵습니다", desc: "자수가 들어간 맞춤 제작 특성상 시안 확정 뒤에는 단순 변심 환불이 어렵습니다. 확정 전에 충분히 검토해 주시고, 수정이 필요하면 말씀해 주세요." },
  { label: "04", title: "100벌 이상이면 자수가 무료입니다", desc: "단체주문(100벌+)을 진행하시면 컴퓨터 자수·패치·실크 인쇄 비용이 따로 들지 않습니다. 단체주문 페이지에서 먼저 견적을 받아보세요." },
];

export default function EmbroideryGuidePage() {
  return (
    <div className="bg-white">

      {/* ── 히어로 / #111 bg ── */}
      <section className="text-white py-24 relative overflow-hidden" style={{ backgroundColor: "#111" }}>
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/embroidery/machine.jpg')", opacity: 0.45 }}
        />
        <div className="absolute inset-0" style={{ background: "rgba(17,17,17,0.5)" }} />
        <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--red)]" />
        <div className="relative z-10 max-w-[1340px] mx-auto px-6 text-center">
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[3px] mb-4">
            EMBROIDERY & MARKING / SERVICE
          </div>
          <h1 className="text-[48px] font-black leading-tight tracking-tight mb-5">
            우리 회사 로고가 박힌
            <br />
            <span className="text-[var(--yellow)]">맞춤 작업복</span> 제작
          </h1>
          <p className="text-white/60 text-base leading-relaxed mb-10 max-w-xl mx-auto">
            고객 디자인 기반 시안 무료 제작 · 누적 12,000건 작업
            <br />
            저작권 안전 · 5~7일 빠른 납품
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/embroidery/simulator"
              className="bg-[var(--red)] text-white px-8 py-4 font-black text-sm tracking-[0.5px] hover:bg-[var(--red-dark)] transition-colors">
              자수 시뮬레이터 시작 →
            </Link>
            <Link href="/bulk-order"
              className="border border-white/20 text-white px-8 py-4 font-bold text-sm hover:border-white transition-colors">
              단체주문 견적
            </Link>
          </div>
          <div className="flex gap-10 justify-center mt-14 pt-10 border-t border-white/10">
            {[
              { label: "누적 시안", value: "12,000+" },
              { label: "재구매율", value: "87%" },
              { label: "평균 납기", value: "5일" },
              { label: "저작권 사고", value: "0건" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-[var(--font-display)] text-[36px] text-[var(--yellow)]">{s.value}</div>
                <div className="font-[var(--font-mono)] text-[10px] text-white/30 tracking-[1px] mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 01: 신청 방법 / white bg ── */}
      <section className="bg-white py-16">
        <div className="max-w-[1340px] mx-auto px-6">
          <div className="text-center mb-12">
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[2px] mb-3">
              SECTION / 01 ─ HOW TO ORDER
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-3">
              자수 제작 <span className="text-[var(--red)]">신청 방법</span>
            </h2>
            <p className="text-sm text-[#888] max-w-lg mx-auto leading-relaxed">
              고객님이 원하시는 디자인을 알려주시면 저희가 자수 시안으로 만들어 드립니다.
              확정 전까지 얼마든지 수정하실 수 있어요.
            </p>
          </div>

          <ProcessSteps />

          <div className="mt-6 text-center">
            <Link href="/embroidery/simulator"
              className="inline-block bg-[var(--red)] text-white px-8 py-4 font-black text-sm tracking-[0.5px] hover:bg-[var(--red-dark)] transition-colors">
              STEP 1 시작하기 — 시뮬레이터 열기 →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 진행 과정 (다크) ── */}
      <ProcessFlow />

      {/* ── SECTION 02: 가격표 / #111 bg ── */}
      <section className="bg-[#111] py-16">
        <div className="max-w-[1340px] mx-auto px-6">
          <div className="text-center mb-10">
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[2px] mb-3">
              SECTION / 02 ─ PRICING
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white mb-2">
              자수 <span className="text-[var(--yellow)]">가격표</span>
            </h2>
            <p className="text-sm text-white/40 font-[var(--font-mono)]">사이즈 × 도수(컬러수) 기준 · 단가 (부가세 별도)</p>
          </div>

          <div className="border border-white/10 overflow-hidden">
            <div className="grid grid-cols-6">
              <div className="px-5 py-3.5 col-span-2 font-[var(--font-mono)] text-[11px] tracking-[1.5px] text-white/40 border-b border-white/10">SIZE</div>
              {COLOR_COLS.map((col) => (
                <div key={col} className="px-4 py-3.5 font-[var(--font-mono)] text-[11px] tracking-[1px] text-center text-white/40 border-b border-white/10 border-l border-white/10">
                  {col}
                </div>
              ))}
            </div>
            {PRICE_TABLE.map((row, i) => (
              <div key={row.size}
                className={`grid grid-cols-6 ${i < PRICE_TABLE.length - 1 ? "border-b border-white/10" : ""}`}>
                <div className="px-5 py-5 col-span-2">
                  <div className="flex items-baseline gap-3">
                    <span className="font-[var(--font-display)] text-2xl text-white">{row.size}</span>
                    <span className="font-[var(--font-mono)] text-[11px] text-[var(--red)] font-bold">{row.dims}</span>
                  </div>
                  <div className="font-[var(--font-mono)] text-[10px] text-white/30 mt-0.5">{row.note}</div>
                </div>
                {row.prices.map((price, j) => (
                  <div key={j} className="px-4 py-5 flex items-center justify-center border-l border-white/10">
                    <div className="text-center">
                      <div className="font-[var(--font-display)] text-xl text-white">{(price / 10000).toFixed(0)}만</div>
                      <div className="font-[var(--font-mono)] text-[10px] text-white/30">{price.toLocaleString()}원~</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="border border-white/10 px-5 py-3 flex items-center gap-3">
              <span className="font-[var(--font-mono)] text-[var(--yellow)] font-black">★</span>
              <div>
                <div className="text-xs font-black text-white mb-0.5">100벌 이상 단체주문 — 자수 무료</div>
                <div className="font-[var(--font-mono)] text-[10px] text-white/30">컴퓨터 자수 · 패치 자수 · 실크 인쇄 전부 포함</div>
              </div>
            </div>
            <div className="border border-white/10 px-5 py-3 flex items-center gap-3">
              <span className="font-[var(--font-mono)] text-[var(--red)] font-black text-lg">+</span>
              <div>
                <div className="text-xs font-black text-white mb-0.5">여러 위치 추가 시 위치 수 × 단가</div>
                <div className="font-[var(--font-mono)] text-[10px] text-white/30">예) 왼가슴 + 등판 동시 작업 시 2배 적용</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 03: 자수 종류 / white bg ── */}
      <section className="bg-white py-16">
        <div className="max-w-[1340px] mx-auto px-6">
          <div className="text-center mb-10">
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[2px] mb-3">
              SECTION / 03 ─ EMBROIDERY TYPES
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              7가지 자수 <span className="text-[var(--red)]">종류</span>
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-px bg-[#e5e5e5] border border-[#e5e5e5]">
            {Object.entries(EMBROIDERY_TYPES).map(([key, type], i) => (
              <div key={key} className="bg-white p-6 hover:bg-[#fafafa] transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-[var(--font-mono)] text-2xl text-[var(--red)]">{TYPE_ICONS[key]}</span>
                  <span className="font-[var(--font-mono)] text-[10px] text-[#bbb]">/ {String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="text-sm font-black text-[#111] mb-1">{type.name}</div>
                <div className="font-[var(--font-mono)] text-[11px] text-[#888]">
                  기본가 {type.basePrice.toLocaleString()}원~
                </div>
                {type.bulkFree && (
                  <div className="mt-2 font-[var(--font-mono)] text-[9px] text-[var(--black)] bg-[var(--yellow)] px-1.5 py-0.5 inline-block font-bold">
                    단체무료
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 04: 자수 위치 ── */}
      <PositionShowcase />

      {/* ── SECTION 05: 주의사항 / white bg ── */}
      <section className="bg-white py-16">
        <div className="max-w-[1340px] mx-auto px-6">
          <div className="text-center mb-10">
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[2px] mb-3">
              SECTION / 05 ─ NOTICE
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              미리 알아두시면 <span className="text-[var(--red)]">편합니다</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-px bg-[#e5e5e5] border border-[#e5e5e5]">
            {NOTICES.map((n) => (
              <div key={n.label} className="bg-white p-7 flex gap-5">
                <div className="flex-shrink-0">
                  <span className="font-[var(--font-mono)] text-[11px] text-[var(--red)] font-bold">{n.label}</span>
                </div>
                <div>
                  <div className="text-sm font-black text-[#111] mb-2">{n.title}</div>
                  <div className="text-sm text-[#888] leading-relaxed">{n.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA / #111 bg ── */}
      <section className="bg-[#111] py-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--red)]" />
        <div className="max-w-[900px] mx-auto px-6 text-center text-white">
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[3px] mb-5">─ START NOW</div>
          <h2 className="text-[38px] font-black tracking-tight leading-tight mb-5">
            지금 바로 시뮬레이터로
            <br />
            <span className="text-[var(--yellow)]">무료 시안</span>을 만들어보세요
          </h2>
          <p className="text-white/50 text-sm leading-relaxed mb-10">
            시안 제작 무료 · 무제한 수정 · 저작권 안전 보장
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/embroidery/simulator"
              className="bg-[var(--red)] text-white px-10 py-4 font-black text-sm tracking-[0.5px] hover:bg-white hover:text-[var(--red)] transition-all">
              자수 시뮬레이터 →
            </Link>
            <Link href="/bulk-order"
              className="border border-white/20 text-white px-10 py-4 font-bold text-sm hover:border-white transition-colors">
              단체주문 견적
            </Link>
          </div>
          <div className="flex gap-8 justify-center mt-10 pt-8 border-t border-white/10 font-[var(--font-mono)] text-[11px] text-white/30">
            {["시안 제작 무료", "무제한 무료 수정", "저작권 안전 보장", "5~7일 빠른 납품", "전국 무료 배송"].map((t) => (
              <span key={t}>✓ {t}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
