import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "자수 갤러리 | 에스에스종합상사",
  description: "14년간 12,000여 거래처와 함께한 자수·마킹 작업 사례 갤러리.",
};

const FILTER_TYPES = ["전체", "컴퓨터 자수", "패치 자수", "아플리케", "실사 패치", "캐릭터 디자인", "실크 인쇄"];
const FILTER_INDUSTRIES = ["전체", "건설/중공업", "제조/공장", "물류/배송", "F&B/주방", "의료/위생", "환경미화", "스포츠/레저"];
const FILTER_POSITIONS = ["전체", "왼가슴", "등판", "소매", "여러 곳"];

// 실제 자수 사진
const REAL_ITEMS = [
  { id: 1, caseNum: "CASE/001", type: "컴퓨터 자수", industry: "전체", position: "왼가슴", client: "고객사 의뢰", rating: 5.0, imageUrl: "/embroidery/배터리.jpg" },
  { id: 2, caseNum: "CASE/002", type: "패치 자수",   industry: "전체", position: "등판",   client: "고객사 의뢰", rating: 5.0, imageUrl: "/embroidery/황금빛사자.jpg" },
  { id: 3, caseNum: "CASE/003", type: "컴퓨터 자수", industry: "전체", position: "소매",   client: "고객사 의뢰", rating: 5.0, imageUrl: "/embroidery/고양이.jpg" },
];

const GALLERY_ITEMS = REAL_ITEMS;

export default function GalleryPage() {
  return (
    <div className="bg-[var(--gray-50)] min-h-screen">
      {/* 히어로 */}
      <section className="bg-[var(--black)] text-white py-14">
        <div className="max-w-[1340px] mx-auto px-6 flex items-end justify-between">
          <div>
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[3px] mb-3">
              EMBROIDERY GALLERY / CASE STUDY
            </div>
            <h1 className="text-[42px] font-black leading-tight tracking-tight mb-3">
              자수 작업
              <br />
              <span className="text-[var(--red)]">갤러리</span>
            </h1>
            <p className="text-white/60 text-sm leading-relaxed">
              14년간 12,000여 거래처와 함께한 자수·마킹 작업 사례
            </p>
          </div>
          <div className="flex gap-8 pb-2">
            {[
              { label: "TOTAL CASES", value: "38,420" },
              { label: "CLIENTS", value: "12,000+" },
              { label: "RATING", value: "★ 4.9" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-[var(--font-display)] text-[32px] text-[var(--yellow)]">{s.value}</div>
                <div className="font-[var(--font-mono)] text-[10px] text-white/40 tracking-[1px] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-[1340px] mx-auto px-6 py-6">
        {/* 필터 */}
        <div className="bg-white border border-[var(--line)] p-5 mb-6 space-y-3">
          {[
            { label: "자수 종류", items: FILTER_TYPES },
            { label: "업종", items: FILTER_INDUSTRIES },
            { label: "위치", items: FILTER_POSITIONS },
          ].map((group) => (
            <div key={group.label} className="flex items-center gap-3">
              <span className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] w-16 flex-shrink-0 tracking-[0.5px]">
                {group.label}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((item, i) => (
                  <button
                    key={item}
                    className={`px-3 py-1.5 text-xs font-semibold border transition-all ${
                      i === 0
                        ? "border-[var(--black)] bg-[var(--black)] text-white"
                        : "border-[var(--line)] hover:border-[var(--gray-400)]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 결과 수 */}
        <div className="flex items-center justify-between mb-4">
          <div className="font-[var(--font-mono)] text-sm">
            총 <span className="text-[var(--red)] font-bold">{GALLERY_ITEMS.length}</span>건
          </div>
          <select className="px-3 py-2 border border-[var(--line)] text-xs outline-none focus:border-[var(--black)] bg-white">
            <option>최신순</option>
            <option>평점순</option>
            <option>추천순</option>
          </select>
        </div>

        {/* 갤러리 그리드 */}
        <div className="grid grid-cols-4 gap-4">
          {GALLERY_ITEMS.map((item) => (
            <div key={item.id} className="group bg-white border border-[var(--line)] hover:border-[var(--red)] transition-all hover:-translate-y-1 cursor-pointer">
              {/* 이미지 */}
              <div className="relative aspect-square overflow-hidden bg-[var(--gray-100)]">
                <img
                  src={item.imageUrl}
                  alt={item.caseNum}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="absolute top-2.5 left-2.5 bg-[var(--black)] text-white font-[var(--font-mono)] text-[9px] px-2 py-0.5 tracking-[0.5px]">
                  {item.caseNum}
                </span>
                <span className="absolute top-2.5 right-2.5 font-[var(--font-mono)] text-[9px] bg-[var(--yellow)] text-[var(--black)] px-2 py-0.5 font-bold">
                  ★ {item.rating.toFixed(1)}
                </span>
              </div>
              {/* 정보 */}
              <div className="p-3.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-bold text-[var(--black)]">{item.type}</span>
                  <span className="text-[var(--gray-300)]">·</span>
                  <span className="text-[11px] text-[var(--gray-500)]">{item.position}</span>
                </div>
                <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-400)]">{item.industry} · {item.client}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 더보기 */}
        <div className="text-center mt-10">
          <button className="border-2 border-[var(--black)] px-10 py-4 text-sm font-bold hover:bg-[var(--black)] hover:text-white transition-colors">
            더보기 (24 / 38,420)
          </button>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-[var(--black)] text-white p-10 text-center">
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[3px] mb-3">─ START YOUR PROJECT</div>
          <h2 className="text-2xl font-black mb-3">우리 회사 작업복에 로고를 새기세요</h2>
          <p className="text-white/60 text-sm mb-6">고객 디자인 기반 시안 무료 · 무제한 수정 · 저작권 안전</p>
          <a href="tel:031-430-0497" className="inline-block bg-[var(--red)] text-white px-8 py-4 font-black text-sm hover:bg-[var(--red-dark)] transition-colors">
            031-430-0497 전화 문의 →
          </a>
        </div>
      </div>
    </div>
  );
}
