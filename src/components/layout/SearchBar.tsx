"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSearch() {
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="w-full relative flex items-center border border-[var(--line)] h-[46px] focus-within:border-[var(--red)] transition-colors">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        placeholder="브랜드, 상품명, 카테고리로 검색하세요"
        className="flex-1 px-4 text-sm outline-none bg-transparent"
      />
      <button
        onClick={handleSearch}
        className="px-4 text-xl text-[var(--gray-500)] hover:text-[var(--red)] transition-colors"
      >
        ⌕
      </button>
    </div>
  );
}
