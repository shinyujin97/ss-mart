"use client";

import { useState } from "react";

const SAMPLE_NOTICES = [
  { id: 1, category: "공지", title: "SS Mart 그랜드 오픈 안내", pinned: true, date: "2026-04-26", views: 1240, active: true },
  { id: 2, category: "공지", title: "단체주문 서비스 개선 안내", pinned: true, date: "2026-04-20", views: 890, active: true },
  { id: 3, category: "이벤트", title: "신규 가입 2,000P 적립 이벤트", pinned: false, date: "2026-04-15", views: 2310, active: true },
  { id: 4, category: "안내", title: "자수 시뮬레이터 사용 가이드", pinned: false, date: "2026-04-10", views: 654, active: true },
  { id: 5, category: "업데이트", title: "카카오 알림톡 서비스 시작", pinned: false, date: "2026-04-05", views: 423, active: true },
];

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState(SAMPLE_NOTICES);
  const [writing, setWriting] = useState(false);
  const [form, setForm] = useState({ category: "공지", title: "", content: "", pinned: false });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-[var(--font-mono)] text-[10px] text-[#555] tracking-[2px] mb-1">ADMIN / NOTICES</div>
          <h1 className="text-xl font-black text-white">공지사항 관리</h1>
        </div>
        <button
          onClick={() => setWriting(!writing)}
          className="bg-[#c8161d] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#9c0e15] transition-colors"
        >
          {writing ? "취소" : "+ 공지 등록"}
        </button>
      </div>

      {/* 작성 폼 */}
      {writing && (
        <div className="bg-[#1a1a1a] border border-[#c8161d]/50 p-6 space-y-4">
          <div className="font-[var(--font-mono)] text-[10px] text-[#c8161d] tracking-[1.5px] mb-2">NEW NOTICE</div>
          <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
            <label className="font-[var(--font-mono)] text-[11px] text-[#666]">분류</label>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="bg-[#111] border border-[#333] text-white px-3 py-2 text-sm outline-none focus:border-[#c8161d] w-full">
              {["공지","이벤트","안내","업데이트"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
            <label className="font-[var(--font-mono)] text-[11px] text-[#666]">제목</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="공지 제목"
              className="bg-[#111] border border-[#333] text-white px-3 py-2 text-sm outline-none focus:border-[#c8161d] w-full" />
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <label className="font-[var(--font-mono)] text-[11px] text-[#666] pt-2">내용</label>
            <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={5} placeholder="공지 내용을 입력하세요"
              className="bg-[#111] border border-[#333] text-white px-3 py-2 text-sm outline-none focus:border-[#c8161d] w-full resize-none leading-relaxed" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setWriting(false)} className="px-5 py-2 border border-[#333] text-[#888] text-sm hover:border-white hover:text-white transition-colors">
              취소
            </button>
            <button onClick={() => setWriting(false)} className="px-5 py-2 bg-[#c8161d] text-white text-sm font-bold hover:bg-[#9c0e15] transition-colors">
              등록하기
            </button>
          </div>
        </div>
      )}

      {/* 목록 */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a]">
        <div className="grid font-[var(--font-mono)] text-[10px] text-[#555] tracking-[0.5px] px-5 py-3 bg-[#111] border-b border-[#2a2a2a]"
          style={{ gridTemplateColumns: "60px 80px 1fr 80px 80px 100px" }}>
          <div>번호</div><div>분류</div><div>제목</div><div>날짜</div><div>조회수</div><div>관리</div>
        </div>
        {notices.map((n) => (
          <div key={n.id} className={`grid items-center px-5 py-3.5 border-b border-[#222] hover:bg-[#1f1f1f] text-sm ${n.pinned ? "bg-[#1e1a00]/20" : ""}`}
            style={{ gridTemplateColumns: "60px 80px 1fr 80px 80px 100px" }}>
            <div className="font-[var(--font-mono)] text-[11px] text-[#555]">
              {n.pinned ? <span className="text-[#c8161d] font-bold">고정</span> : n.id}
            </div>
            <div>
              <span className="font-[var(--font-mono)] text-[10px] border border-[#333] text-[#888] px-1.5 py-0.5">{n.category}</span>
            </div>
            <div className="text-[#ddd] truncate pr-4 font-semibold">{n.title}</div>
            <div className="font-[var(--font-mono)] text-[10px] text-[#555]">{n.date}</div>
            <div className="font-[var(--font-mono)] text-[11px] text-[#666]">{n.views.toLocaleString()}</div>
            <div className="flex gap-1.5">
              <button className="font-[var(--font-mono)] text-[10px] px-2 py-1 border border-[#333] text-[#888] hover:border-white hover:text-white transition-colors">
                수정
              </button>
              <button className="font-[var(--font-mono)] text-[10px] px-2 py-1 border border-[#333] text-[#888] hover:border-[#c8161d] hover:text-[#c8161d] transition-colors">
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
