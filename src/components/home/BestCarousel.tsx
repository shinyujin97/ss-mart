"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  basePrice: number;
  salePrice: number;
  imageUrl: string;
}

export default function BestCarousel({ products }: { products: Product[] }) {
  const [current, setCurrent] = useState(0);
  const VISIBLE = 4;
  const total = products.length;
  const maxIndex = total - VISIBLE;

  const next = useCallback(() => {
    setCurrent((c) => (c >= maxIndex ? 0 : c + 1));
  }, [maxIndex]);

  const prev = () => {
    setCurrent((c) => (c <= 0 ? maxIndex : c - 1));
  };

  // 5초마다 자동 슬라이드
  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="relative">
      {/* 좌측 화살표 */}
      <button
        onClick={prev}
        className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-[var(--line)] hover:border-[var(--black)] hover:bg-[var(--black)] hover:text-white transition-all flex items-center justify-center shadow-md"
      >
        ‹
      </button>

      {/* 카드 뷰포트 */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out gap-5"
          style={{ transform: `translateX(calc(-${current * (100 / VISIBLE)}% - ${current * 20 / VISIBLE}px))` }}
        >
          {products.map((p) => {
            const discount = Math.round(((p.basePrice - p.salePrice) / p.basePrice) * 100);
            return (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                className="flex-shrink-0 bg-white border border-[var(--line)] hover:border-[var(--black)] hover:shadow-lg transition-all group"
                style={{ width: `calc(${100 / VISIBLE}% - ${20 * (VISIBLE - 1) / VISIBLE}px)` }}
              >
                {/* 이미지 */}
                <div className="relative aspect-square overflow-hidden bg-[var(--gray-50)]">
                  <Image
                    src={p.imageUrl}
                    alt={p.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                  {discount > 0 && (
                    <span className="absolute top-3 left-3 bg-[var(--red)] text-white font-[var(--font-mono)] text-[10px] px-2 py-1 font-bold">
                      -{discount}%
                    </span>
                  )}
                </div>

                {/* 정보 */}
                <div className="p-4">
                  <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-400)] tracking-[1px] mb-1">
                    {p.brandName}
                  </div>
                  <p className="text-sm font-bold text-[var(--black)] leading-snug mb-3 line-clamp-2 min-h-[40px]">
                    {p.name}
                  </p>
                  <div className="flex items-baseline gap-2">
                    {discount > 0 && (
                      <span className="font-[var(--font-display)] text-[var(--red)] text-lg">{discount}%</span>
                    )}
                    <span className="font-black text-[var(--black)] text-lg">
                      {p.salePrice.toLocaleString()}
                      <span className="text-sm font-normal text-[var(--gray-500)]">원</span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 우측 화살표 */}
      <button
        onClick={next}
        className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-[var(--line)] hover:border-[var(--black)] hover:bg-[var(--black)] hover:text-white transition-all flex items-center justify-center shadow-md"
      >
        ›
      </button>

      {/* 인디케이터 */}
      <div className="flex justify-center gap-1.5 mt-5">
        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 transition-all ${i === current ? "w-6 bg-[var(--black)]" : "w-2 bg-[var(--gray-300)]"}`}
          />
        ))}
      </div>
    </div>
  );
}
