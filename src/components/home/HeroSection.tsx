"use client";

import Link from "next/link";
import { useState } from "react";

const SLIDES = [
  {
    bg: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1600&q=85&auto=format&fit=crop",
    vol: "VOL.04 / 2026 WINTER",
    tag: "TIME SALE",
    stripe: "━━ 한정수량 진행중",
    title: ["동절기 작업복", "최대 50% OFF"],
    sub: "피오젠 · K2세이프티 · 코오롱 동절기 컬렉션 한정 특가",
    meta: [{ label: "DISCOUNT", value: "-50%", accent: true }, { label: "FROM", value: "44,500원" }, { label: "UNTIL", value: "05:23:47" }],
    btn: "SHOP NOW →",
    href: "/categories/workwear",
  },
  {
    bg: "https://images.unsplash.com/photo-1542219550-37153d387c27?w=1600&q=85&auto=format&fit=crop",
    vol: "VOL.04 / SAFETY FOOTWEAR",
    tag: "NEW ARRIVAL",
    stripe: "━━ KCs 인증 안전화",
    title: ["현장을 지키는", "프리미엄 안전화"],
    sub: "K2 · RED WING · KOLON 정품 입고 · 절연 / 방수 / 내답발 안전화 풀라인업",
    meta: [{ label: "BRANDS", value: "12+" }, { label: "ITEMS", value: "1,560" }, { label: "CERTIFIED", value: "KCs", accent: true }],
    btn: "VIEW COLLECTION →",
    href: "/categories/safety-shoes",
  },
  {
    bg: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&q=85&auto=format&fit=crop",
    vol: "VOL.04 / EMBROIDERY SERVICE",
    tag: "EMBROIDERY",
    stripe: "━━ 누적 12,000건 작업",
    title: ["우리 회사 로고", "맞춤 자수 제작"],
    sub: "전문 디자이너의 무료 시안 · 저작권 안전 캐릭터 디자인 · 5~7일 빠른 납품",
    meta: [{ label: "DESIGN", value: "FREE" }, { label: "DELIVERY", value: "5~7 DAYS" }, { label: "PROJECTS", value: "12,000+", accent: true }],
    btn: "REQUEST QUOTE →",
    href: "/embroidery",
  },
  {
    bg: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1600&q=85&auto=format&fit=crop",
    vol: "VOL.04 / BULK ORDER",
    tag: "BULK ORDER",
    stripe: "━━ B2B 전문 견적",
    title: ["단체주문 전용", "최대 30% 할인"],
    sub: "100벌 이상 견적 상담 · 전담 매니저 1:1 배정 · 자수 / 마킹 무료 포함",
    meta: [{ label: "MIN.QTY", value: "100+" }, { label: "DISCOUNT", value: "-30%", accent: true }, { label: "SUPPORT", value: "1:1 PM" }],
    btn: "GET QUOTE →",
    href: "/bulk-order",
  },
];

const CATEGORIES = [
  { label: "자수 / 마킹 주문", href: "/embroidery", special: true },
  { label: "작업복 상의", href: "/categories/workwear-top", count: "2,140" },
  { label: "작업복 하의", href: "/categories/workwear-bottom", count: "1,820" },
  { label: "작업복 세트", href: "/categories/workwear-set", count: "980" },
  { label: "안전화", href: "/categories/safety-shoes", count: "1,560" },
  { label: "안전모", href: "/categories/safety-helmet", count: "420" },
  { label: "안전장갑", href: "/categories/gloves", count: "680" },
  { label: "마스크 / 보호구", href: "/categories/mask", count: "510" },
  { label: "안전조끼", href: "/categories/safety-vest", count: "320" },
  { label: "F&B 유니폼", href: "/categories/fnb-uniform", count: "890" },
  { label: "의료 / 위생", href: "/categories/medical-uniform", count: "450" },
  { label: "방한 / 동절기", href: "/categories/workwear-winter", count: "760" },
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);

  const slide = SLIDES[current];

  return (
    <section className="flex" style={{ height: 560 }}>
      {/* 좌측: 카테고리 리스트 */}
      <div className="w-[200px] flex-shrink-0 border-r border-[var(--line)] bg-white">
        <div className="bg-[var(--black)] text-white px-4 py-3 font-[var(--font-mono)] text-[11px] tracking-[1px] font-semibold flex items-center gap-2">
          ▣ CATEGORY
        </div>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.href}
            href={cat.href}
            className={`flex items-center justify-between px-4 py-[11px] text-[13px] border-b border-[var(--line)] transition-colors ${
              cat.special
                ? "text-[var(--red)] font-bold hover:bg-[var(--red)] hover:text-white"
                : "text-[var(--gray-700)] hover:bg-[var(--gray-50)] hover:text-[var(--red)]"
            }`}
          >
            <span>{cat.label}</span>
            {cat.special ? (
              <span className="text-xs">→</span>
            ) : (
              <span className="font-[var(--font-mono)] text-[11px] text-[var(--gray-500)]">
                {cat.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* 메인 배너 */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url('${slide.bg}')` }}
        />
        <div className="absolute inset-0 bg-black/60" />

        {/* 코너 마크 */}
        <div className="absolute top-5 right-5 font-[var(--font-mono)] text-[10px] text-white/40 tracking-[2px]">
          {slide.vol}
        </div>

        {/* 콘텐츠 */}
        <div className="relative h-full flex flex-col justify-end p-10 pb-14">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-[var(--red)] text-white text-[11px] font-bold px-3 py-1 font-[var(--font-mono)] tracking-[1px]">
              {slide.tag}
            </span>
            <span className="text-white/60 text-[12px] font-[var(--font-mono)]">
              {slide.stripe}
            </span>
          </div>

          <h2 className="text-[42px] font-black text-white leading-tight tracking-tight mb-3">
            {slide.title[0]}
            <br />
            <span className="text-[var(--red)]">{slide.title[1]}</span>
          </h2>

          <p className="text-white/60 text-sm mb-6">{slide.sub}</p>

          <div className="flex items-center gap-6 mb-6">
            {slide.meta.map((m) => (
              <div key={m.label}>
                <div className="font-[var(--font-mono)] text-[9px] text-white/40 tracking-[1px]">
                  {m.label}
                </div>
                <div
                  className={`font-[var(--font-display)] text-[22px] ${
                    m.accent ? "text-[var(--yellow)]" : "text-white"
                  }`}
                >
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          <Link
            href={slide.href}
            className="inline-block bg-white text-[var(--black)] px-6 py-3 font-bold text-sm tracking-[0.5px] hover:bg-[var(--yellow)] transition-colors w-fit"
          >
            {slide.btn}
          </Link>
        </div>

        {/* 슬라이더 컨트롤 */}
        <div className="absolute bottom-5 right-5 flex items-center gap-4">
          <span className="font-[var(--font-mono)] text-white/60 text-[11px]">
            <span className="text-white font-bold">
              {String(current + 1).padStart(2, "0")}
            </span>{" "}
            / {String(SLIDES.length).padStart(2, "0")}
          </span>
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-6 h-1 transition-all ${
                  i === current ? "bg-white" : "bg-white/30"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length)}
              className="w-8 h-8 border border-white/30 text-white hover:border-white transition-colors text-lg leading-none flex items-center justify-center"
            >
              ‹
            </button>
            <button
              onClick={() => setCurrent((c) => (c + 1) % SLIDES.length)}
              className="w-8 h-8 border border-white/30 text-white hover:border-white transition-colors text-lg leading-none flex items-center justify-center"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* 우측 사이드 배너 */}
      <div className="w-[180px] flex-shrink-0 flex flex-col">
        <Link
          href="/embroidery"
          className="flex-1 flex flex-col justify-end p-5 text-white relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(200,22,29,0.9), rgba(156,14,21,0.98))",
          }}
        >
          <div className="font-[var(--font-mono)] text-[9px] text-white/60 tracking-[1px] mb-2">
            ▶ EMBROIDERY
          </div>
          <div className="text-sm font-black leading-tight mb-1">
            우리 회사
            <br />
            로고 자수
          </div>
          <div className="text-[11px] text-white/70 leading-relaxed mb-3">
            전문 디자이너 시안 무료 제작
          </div>
          <div className="font-[var(--font-mono)] text-[10px] text-white/60">━ MORE</div>
        </Link>
        <Link
          href="/bulk-order"
          className="flex-1 flex flex-col justify-end p-5 text-white relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(26,26,26,0.95), rgba(0,0,0,0.98))",
          }}
        >
          <div className="font-[var(--font-mono)] text-[9px] text-white/60 tracking-[1px] mb-2">
            ▶ BULK ORDER
          </div>
          <div className="text-sm font-black leading-tight mb-1">
            단체주문
            <br />
            최대 30%
          </div>
          <div className="text-[11px] text-white/70 leading-relaxed mb-3">
            100벌 이상 견적 상담
          </div>
          <div className="font-[var(--font-mono)] text-[10px] text-white/60">━ MORE</div>
        </Link>
      </div>
    </section>
  );
}
