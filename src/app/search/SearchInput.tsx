"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchInput({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  function handleSearch() {
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="flex items-center border border-[var(--line)] h-[44px] focus-within:border-[var(--red)] transition-colors bg-white">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        placeholder="다른 검색어 입력..."
        className="flex-1 px-4 text-sm outline-none bg-transparent"
        autoFocus
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
