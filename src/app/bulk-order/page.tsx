import BulkOrderForm from "./BulkOrderForm";

export const metadata = { title: "단체주문 견적 신청 | 에스에스종합상사" };

const BENEFITS = [
  { num: "01", title: "최대 30% 할인", desc: "100벌+ 20% · 200벌+ 25% · 500벌+ 30%" },
  { num: "02", title: "자수 무료 포함", desc: "컴퓨터 자수 무료" },
  { num: "03", title: "전담 매니저 배정", desc: "1:1 전담 매니저 2시간 내 배정" },
  { num: "04", title: "세금계산서 발행", desc: "사업자 회원 자동 발행" },
  { num: "05", title: "분할 배송 가능", desc: "사업장별 분할 납품 협의 가능" },
];

const PROCESS_STEPS = [
  { num: "01", title: "견적 신청", desc: "폼 작성 후 제출" },
  { num: "02", title: "매니저 배정", desc: "2시간 내 (영업시간)" },
  { num: "03", title: "견적서 발송", desc: "1~2영업일" },
  { num: "04", title: "계약 / 결제", desc: "세금계산서 자동 발행" },
  { num: "05", title: "제작", desc: "5~14영업일" },
  { num: "06", title: "납품", desc: "분할 배송 가능" },
];

export default function BulkOrderPage() {
  return (
    <div className="bg-[var(--gray-50)] min-h-screen">
      {/* 히어로 */}
      <section
        className="text-white py-16 relative overflow-hidden"
        style={{
          backgroundImage: "linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 60%, transparent 100%), url('https://images.unsplash.com/photo-1520399636535-24741e71b160?w=1600&q=85&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-[1340px] mx-auto px-4 md:px-6">
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[3px] mb-3 flex items-center gap-3">
            <span className="w-7 h-px bg-[var(--red)]" />
            BULK ORDER / B2B QUOTE
          </div>
          <h1 className="text-[30px] md:text-[44px] font-black leading-tight tracking-tight mb-4">
            단체주문 견적 신청
            <br />
            <span className="text-[var(--yellow)]">최대 30% 할인</span>
          </h1>
          <p className="text-white/70 text-sm leading-relaxed mb-8 max-w-lg">
            100벌 이상 단체주문 전용 · 자수 / 마킹 무료 포함
            <br />
            전담 매니저 1:1 배정 · 세금계산서 자동 발행
          </p>
          {/* 통계 */}
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            {[
              { label: "누적 단체주문", value: "3,200+" },
              { label: "최대 할인율", value: "30%" },
              { label: "평균 납기", value: "7일" },
              { label: "재주문율", value: "92%" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-[var(--font-display)] text-2xl text-[var(--yellow)]">{s.value}</div>
                <div className="font-[var(--font-mono)] text-[10px] text-white/40 tracking-[1px] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 메인 콘텐츠 */}
      <div className="max-w-[1340px] mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 items-start">
          {/* 폼 */}
          <BulkOrderForm />

          {/* 사이드바 */}
          <div className="md:sticky md:top-6 space-y-3">
            {/* 진행 단계 */}
            <div className="border border-[var(--line)] bg-white">
              <div className="bg-[var(--black)] text-white px-5 py-3.5">
                <div className="font-[var(--font-mono)] text-[10px] text-white/50 tracking-[1.5px] mb-0.5">PROCESS</div>
                <div className="font-bold text-sm">진행 단계</div>
              </div>
              <div className="p-4 space-y-2.5">
                {PROCESS_STEPS.map((s) => (
                  <div key={s.num} className="flex items-center gap-3">
                    <span className="font-[var(--font-display)] text-[28px] text-[var(--gray-200)] leading-none w-8 flex-shrink-0">{s.num}</span>
                    <div>
                      <div className="text-xs font-bold">{s.title}</div>
                      <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)]">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 혜택 */}
            <div className="border border-[var(--line)] bg-white">
              <div className="bg-[var(--red)] text-white px-5 py-3.5">
                <div className="font-[var(--font-mono)] text-[10px] text-white/60 tracking-[1.5px] mb-0.5">BENEFITS</div>
                <div className="font-bold text-sm">단체주문 5가지 혜택</div>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {BENEFITS.map((b) => (
                  <div key={b.num} className="flex gap-3 px-4 py-3">
                    <span className="font-[var(--font-mono)] text-[10px] text-[var(--red)] font-bold mt-0.5 flex-shrink-0">{b.num}</span>
                    <div>
                      <div className="text-xs font-bold">{b.title}</div>
                      <div className="text-[11px] text-[var(--gray-500)] mt-0.5">{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 직접 문의 */}
            <div className="border border-[var(--line)] bg-white p-5">
              <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] tracking-[1px] mb-2">DIRECT CONTACT</div>
              <div className="font-[var(--font-display)] text-[32px] text-[var(--black)] leading-none mb-1">031-430-0497</div>
              <div className="text-xs text-[var(--gray-500)] mb-3">평일 09:00 - 18:00 (점심 12-13시)</div>
              <a
                href="https://pf.kakao.com/_ssmart"
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#fee500] text-[#1a1a1a] text-sm font-bold hover:bg-[#f5dc00] transition-colors"
              >
                <span className="font-[var(--font-mono)] font-black text-xs">KA</span>
                카카오톡 채널 상담
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
