export default function HomePage() {
  return (
    <div className="max-w-[1340px] mx-auto px-6 py-20 text-center">
      <div
        className="leading-none select-none text-[var(--gray-100)]"
        style={{ fontFamily: "var(--font-bebas-neue), Impact, sans-serif", fontSize: "clamp(60px, 10vw, 120px)" }}
      >
        SS MART
      </div>
      <div
        className="text-xs tracking-[4px] text-[var(--gray-500)] mt-4"
        style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
      >
        PHASE 0 · SETUP COMPLETE
      </div>
    </div>
  );
}
