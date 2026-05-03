"use client";

import { useState } from "react";

type Tab = "notice" | "faq" | "inquiry";

const NOTICES = [
  { id: 1, pinned: true, category: "공지", title: "SS Mart 그랜드 오픈 안내", date: "2026.04.26", views: 1240 },
  { id: 2, pinned: true, category: "공지", title: "단체주문 서비스 개선 안내", date: "2026.04.20", views: 890 },
  { id: 3, category: "이벤트", title: "신규 가입 2,000P 적립 이벤트", date: "2026.04.15", views: 2310 },
  { id: 4, category: "안내", title: "자수 시뮬레이터 사용 가이드", date: "2026.04.10", views: 654 },
  { id: 5, category: "업데이트", title: "카카오 알림톡 서비스 시작", date: "2026.04.05", views: 423 },
];

const FAQS = [
  {
    category: "배송",
    items: [
      { q: "배송비는 얼마인가요?", a: "전 상품 무료 배송입니다. 제주·도서산간 포함 추가 비용 없이 배송됩니다." },
      { q: "언제 출고되나요?", a: "평일 14시 이전 결제 완료 시 당일 출고됩니다. 자수 추가 상품은 시안 확정 후 3~7영업일 내 출고됩니다." },
      { q: "배송 조회는 어떻게 하나요?", a: "주문 완료 후 발송 처리 시 SMS/카카오 알림으로 운송장 번호를 안내해 드립니다. 마이페이지 > 주문 내역에서도 확인 가능합니다." },
    ],
  },
  {
    category: "교환/환불",
    items: [
      { q: "교환/환불 신청 방법은?", a: "수령 후 7일 이내 마이페이지 > 주문 내역 > 취소/환불 신청, 또는 고객센터(031-430-0497)로 연락해 주세요." },
      { q: "자수 추가 상품도 환불되나요?", a: "자수 시안 확정 전에는 환불 가능합니다. 시안 확정 후에는 전자상거래법 맞춤제작 조항에 따라 단순 변심 환불이 불가합니다. 단, 자수 불량이나 오작업의 경우 전액 환불됩니다." },
      { q: "반품 배송비는 누가 부담하나요?", a: "상품 하자/오배송의 경우 당사 부담, 단순 변심의 경우 고객 부담입니다." },
    ],
  },
  {
    category: "자수/마킹",
    items: [
      { q: "자수 시안은 무료인가요?", a: "네, 시안 제작은 무료입니다. 시안 확정 전까지 무제한 무료 수정이 가능합니다." },
      { q: "자수 작업 기간은 얼마나 걸리나요?", a: "1~10벌은 3~5영업일, 10~99벌은 5~7영업일, 100벌 이상 단체주문은 7~14영업일 소요됩니다." },
      { q: "저작권 있는 캐릭터도 자수 가능한가요?", a: "아닙니다. 디즈니, 마블 등 저작권 보호 IP는 작업이 불가합니다. 고객사 자체 로고, 오리지널 디자인만 가능합니다." },
    ],
  },
  {
    category: "단체주문",
    items: [
      { q: "단체주문 최소 수량은?", a: "100벌 이상부터 단체주문 혜택이 적용됩니다. 자수·마킹 추가 시 50벌 이상도 가능합니다." },
      { q: "세금계산서 발행이 가능한가요?", a: "사업자 회원으로 가입하시면 자동으로 세금계산서가 발행됩니다." },
    ],
  },
];

export default function SupportTabs() {
  const [tab, setTab] = useState<Tab>("notice");
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <div>
      {/* 탭 */}
      <div className="flex border-b-2 border-[var(--black)] mb-6">
        {([
          { key: "notice", label: "공지사항" },
          { key: "faq",    label: "자주 묻는 질문 (FAQ)" },
          { key: "inquiry",label: "1:1 문의" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-6 py-3.5 text-sm font-bold relative transition-colors ${
              tab === t.key ? "text-[var(--black)]" : "text-[var(--gray-500)] hover:text-[var(--black)]"
            }`}
          >
            {t.label}
            {tab === t.key && <span className="absolute bottom-[-2px] left-0 right-0 h-1 bg-[var(--red)]" />}
          </button>
        ))}
      </div>

      {/* 공지사항 */}
      {tab === "notice" && (
        <div className="border border-[var(--line)] bg-white">
          <div className="grid grid-cols-[60px_80px_1fr_100px_80px] font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] tracking-[0.5px] px-5 py-3 bg-[var(--gray-50)] border-b border-[var(--line)]">
            <div>번호</div><div>분류</div><div>제목</div><div className="text-center">날짜</div><div className="text-center">조회</div>
          </div>
          {NOTICES.map((n) => (
            <div key={n.id} className={`grid grid-cols-[60px_80px_1fr_100px_80px] items-center px-5 py-4 border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--gray-50)] cursor-pointer ${n.pinned ? "bg-[#fffef5]" : ""}`}>
              <div className="font-[var(--font-mono)] text-[11px] text-[var(--gray-400)]">
                {n.pinned ? <span className="text-[var(--red)] font-bold">고정</span> : n.id}
              </div>
              <div>
                <span className="font-[var(--font-mono)] text-[10px] border border-[var(--gray-300)] px-1.5 py-0.5 text-[var(--gray-600)]">{n.category}</span>
              </div>
              <div className="text-sm font-semibold hover:text-[var(--red)]">{n.title}</div>
              <div className="font-[var(--font-mono)] text-[11px] text-[var(--gray-500)] text-center">{n.date}</div>
              <div className="font-[var(--font-mono)] text-[11px] text-[var(--gray-500)] text-center">{n.views.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      {/* FAQ */}
      {tab === "faq" && (
        <div className="space-y-4">
          {FAQS.map((group) => (
            <div key={group.category} className="border border-[var(--line)] bg-white">
              <div className="px-6 py-4 border-b border-[var(--line)] flex items-center gap-3">
                <span className="font-[var(--font-mono)] text-[10px] text-[var(--red)] border border-[var(--red)] px-2 py-0.5 font-bold tracking-[1px]">
                  {group.category}
                </span>
              </div>
              {group.items.map((item, i) => {
                const key = `${group.category}-${i}`;
                const open = openFaq === key;
                return (
                  <div key={i} className="border-b border-[var(--line)] last:border-b-0">
                    <button
                      onClick={() => setOpenFaq(open ? null : key)}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-[var(--gray-50)] text-left transition-colors"
                    >
                      <span className="text-sm font-semibold flex items-center gap-2">
                        <span className="font-[var(--font-mono)] text-[var(--red)] font-bold">Q.</span>
                        {item.q}
                      </span>
                      <span className="text-[var(--gray-400)] font-[var(--font-mono)] text-sm ml-4 flex-shrink-0">{open ? "−" : "+"}</span>
                    </button>
                    {open && (
                      <div className="px-6 pb-5 pt-1">
                        <div className="flex gap-2 text-sm text-[var(--gray-700)] leading-relaxed">
                          <span className="font-[var(--font-mono)] text-[var(--black)] font-bold flex-shrink-0">A.</span>
                          {item.a}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* 1:1 문의 */}
      {tab === "inquiry" && (
        <div className="border border-[var(--line)] bg-white p-8">
          <h3 className="text-lg font-black mb-6">1:1 문의 작성</h3>
          <div className="space-y-4 max-w-2xl">
            {[
              { label: "문의 유형", type: "select", options: ["배송 문의", "교환/반품", "자수/마킹", "단체주문", "계정/결제", "기타"] },
              { label: "제목", type: "text", placeholder: "문의 제목을 입력하세요" },
            ].map((f) => (
              <div key={f.label} className="grid grid-cols-[120px_1fr] gap-3 items-center">
                <label className="text-xs font-semibold text-[var(--gray-700)]">{f.label} *</label>
                {f.type === "select" ? (
                  <select className="px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)] bg-white w-full">
                    {f.options?.map((o) => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type="text" placeholder={f.placeholder} className="px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)] w-full" />
                )}
              </div>
            ))}
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <label className="text-xs font-semibold text-[var(--gray-700)] pt-2">내용 *</label>
              <textarea rows={6} placeholder="문의 내용을 자세히 입력해 주세요" className="px-3 py-3 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)] resize-none leading-relaxed" />
            </div>
            <div className="flex justify-end">
              <button className="bg-[var(--red)] text-white px-8 py-3.5 font-bold text-sm hover:bg-[var(--red-dark)] transition-colors">
                문의 접수하기 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
