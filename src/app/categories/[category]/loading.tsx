export default function CategoryLoading() {
  return (
    <div className="bg-[var(--gray-50)] min-h-screen">
      <div className="bg-white border-b border-[var(--line)]">
        <div className="max-w-[1340px] mx-auto px-4 md:px-6 py-3">
          <div className="h-4 w-40 bg-[var(--gray-100)] animate-pulse" />
        </div>
      </div>
      <div className="bg-white border-b border-[var(--line)]">
        <div className="max-w-[1340px] mx-auto px-4 md:px-6 flex gap-1 overflow-x-auto">
          {[80, 64, 72, 88, 60, 76].map((w, i) => (
            <div key={i} className="h-11 bg-[var(--gray-100)] animate-pulse my-1" style={{ width: w }} />
          ))}
        </div>
      </div>
      <div className="max-w-[1340px] mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
          <div className="hidden md:block">
            <div className="h-11 bg-[var(--black)] opacity-80" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-[var(--line)] border-t-0 h-24 animate-pulse" />
            ))}
          </div>
          <div>
            <div className="flex justify-between mb-5">
              <div className="h-5 w-36 bg-[var(--gray-100)] animate-pulse" />
              <div className="h-8 w-56 bg-[var(--gray-100)] animate-pulse" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
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
          </div>
        </div>
      </div>
    </div>
  );
}
