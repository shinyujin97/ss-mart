"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const SLIDES = [
  {
    bg: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1600&q=85&auto=format&fit=crop",
    vol: "VOL.04 / 2026 WINTER",
    tag: "TIME SALE",
    stripe: "━━ 한정수량 진행중",
    title: ["동절기 작업복", "최대 50% OFF"],
    sub: "피오젠 · K2세이프티 · 코오롱 동절기 컬렉션 한정 특가",
    meta: [{ label: "DISCOUNT", value: "-50%", accent: true }, { label: "TEL", value: "031-430-0497" }, { label: "UNTIL", value: "05:23:47" }],
    btn: "SHOP NOW →",
    href: "/categories/workwear",
  },
  {
    bg: "https://images.unsplash.com/photo-1759673824670-e4cd35617f8e?w=1600&q=85&auto=format&fit=crop",
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
    bg: "https://images.unsplash.com/photo-1772351721250-58367a2aecba?w=1600&q=85&auto=format&fit=crop",
    vol: "VOL.04 / EMBROIDERY SERVICE",
    tag: "EMBROIDERY",
    stripe: "━━ 누적 12,000건 작업",
    title: ["우리 회사 로고", "맞춤 자수 제작"],
    sub: "고객 디자인 기반 시안 · 저작권 안전 캐릭터 디자인 · 5~7일 빠른 납품",
    meta: [{ label: "DESIGN", value: "FREE" }, { label: "DELIVERY", value: "5~7 DAYS" }, { label: "PROJECTS", value: "12,000+", accent: true }],
    btn: "REQUEST QUOTE →",
    href: "/embroidery",
  },
  {
    bg: "https://images.unsplash.com/photo-1520399636535-24741e71b160?w=1600&q=85&auto=format&fit=crop",
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

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  // 5초마다 자동 슬라이드
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[current];

  return (
    <div className="relative overflow-hidden h-full">
      {/* 배경 이미지만 fade */}
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
          style={{
            backgroundImage: `url('${s.bg}')`,
            opacity: i === current ? 1 : 0,
          }}
        />
      ))}

      {/* 그라데이션 오버레이 — 고정 */}
      <div className="absolute inset-0 bg-black/60" />

      {/* 텍스트 — 고정 (애니메이션 없음) */}
      <div className="absolute top-5 right-5 font-[var(--font-mono)] text-[10px] text-white/40 tracking-[2px]">
        {slide.vol}
      </div>

      <div className="relative h-full flex flex-col justify-end p-10 pb-14">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-[var(--red)] text-white text-[11px] font-bold px-3 py-1 font-[var(--font-mono)] tracking-[1px]">
            {slide.tag}
          </span>
          <span className="text-white/60 text-[12px] font-[var(--font-mono)]">{slide.stripe}</span>
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
              <div className="font-[var(--font-mono)] text-[9px] text-white/40 tracking-[1px]">{m.label}</div>
              <div className={`font-[var(--font-display)] text-[22px] ${m.accent ? "text-[var(--yellow)]" : "text-white"}`}>
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

      <div className="absolute bottom-5 right-5 flex items-center gap-4">
        <span className="font-[var(--font-mono)] text-white/60 text-[11px]">
          <span className="text-white font-bold">{String(current + 1).padStart(2, "0")}</span>{" "}
          / {String(SLIDES.length).padStart(2, "0")}
        </span>
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-6 h-1 transition-all ${i === current ? "bg-white" : "bg-white/30"}`}
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
  );
}
