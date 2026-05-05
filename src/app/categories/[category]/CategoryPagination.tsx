"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  children: React.ReactNode;
  page: number;
  totalPages: number;
  pageNumbers: number[];
}

function ProductSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white border border-[var(--line)]">
          <div className="aspect-square bg-[var(--gray-100)] animate-pulse" />
          <div className="p-3 space-y-2">
            <div className="h-3 w-16 bg-[var(--gray-100)] animate-pulse" />
            <div className="h-4 w-full bg-[var(--gray-100)] animate-pulse" />
            <div className="h-5 w-20 bg-[var(--gray-100)] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CategoryPagination({ children, page, totalPages, pageNumbers }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = (p: number) => {
    if (p === page || p < 1 || p > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const btnBase = "w-9 h-9 flex items-center justify-center border font-[var(--font-mono)] text-sm transition-colors";
  const btnActive = `${btnBase} border-[var(--line)] text-[var(--gray-700)] hover:border-[var(--black)] hover:text-[var(--black)] cursor-pointer`;
  const btnDisabled = `${btnBase} border-[var(--gray-100)] text-[var(--gray-300)] cursor-not-allowed pointer-events-none`;

  return (
    <>
      {/* 상품 그리드 — isPending 시 즉시 스켈레톤 표시 */}
      <div className="relative min-h-[400px]">
        {isPending ? (
          <ProductSkeleton />
        ) : (
          children
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 mt-10">
          <button onClick={() => navigate(1)} disabled={page <= 1} className={page > 1 ? btnActive : btnDisabled}>{"<<"}</button>
          <button onClick={() => navigate(page - 1)} disabled={page <= 1} className={page > 1 ? btnActive : btnDisabled}>{"<"}</button>
          {pageNumbers.map((p) => (
            <button
              key={p}
              onClick={() => navigate(p)}
              className={`w-9 h-9 flex items-center justify-center text-sm font-[var(--font-mono)] border transition-colors cursor-pointer ${
                p === page
                  ? "bg-[var(--black)] text-white border-[var(--black)]"
                  : "border-[var(--line)] text-[var(--gray-700)] hover:border-[var(--black)]"
              }`}
            >
              {p}
            </button>
          ))}
          <button onClick={() => navigate(page + 1)} disabled={page >= totalPages} className={page < totalPages ? btnActive : btnDisabled}>{">"}</button>
          <button onClick={() => navigate(totalPages)} disabled={page >= totalPages} className={page < totalPages ? btnActive : btnDisabled}>{">>"}</button>
        </div>
      )}
    </>
  );
}
