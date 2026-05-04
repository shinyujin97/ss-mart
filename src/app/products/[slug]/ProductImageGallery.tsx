"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductImage {
  id: string;
  url: string;
  isMain: boolean;
}

interface Props {
  images: ProductImage[];
  productName: string;
  certifications: { id: string; type: string }[];
  certLabels: Record<string, string>;
}

export default function ProductImageGallery({ images, productName, certifications, certLabels }: Props) {
  const galleryImages = images.filter((i) => !i.url.includes("_dt"));
  const [activeUrl, setActiveUrl] = useState(
    galleryImages.find((i) => i.isMain)?.url ?? galleryImages[0]?.url ?? ""
  );

  return (
    <div>
      {/* 메인 이미지 — LCP: priority로 즉시 로드 */}
      <div className="relative aspect-square bg-[var(--gray-100)] mb-3 overflow-hidden">
        {activeUrl ? (
          <Image
            src={activeUrl}
            alt={productName}
            fill
            priority
            sizes="(max-width: 1340px) 50vw, 784px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--gray-300)] text-sm">
            이미지 준비 중
          </div>
        )}
        {certifications.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {certifications.map((c) => (
              <span
                key={c.id}
                className="bg-[var(--black)] text-[var(--yellow)] font-[var(--font-mono)] text-[9px] px-2 py-1 font-bold tracking-[0.5px]"
              >
                {certLabels[c.type] ?? c.type}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 썸네일 — lazy load */}
      {galleryImages.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {galleryImages.map((img) => (
            <button
              key={img.id}
              onClick={() => setActiveUrl(img.url)}
              className={`relative aspect-square bg-[var(--gray-100)] overflow-hidden border-2 transition-colors ${
                activeUrl === img.url
                  ? "border-[var(--black)]"
                  : "border-transparent hover:border-[var(--gray-300)]"
              }`}
            >
              <Image
                src={img.url}
                alt={productName}
                fill
                loading="lazy"
                sizes="(max-width: 1340px) 10vw, 150px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
