import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = { title: "상품 관리" };

export default async function AdminProductsPage() {
  await requireAdmin();

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      brand: { select: { name: true } },
      images: { where: { isMain: true }, take: 1 },
      _count: { select: { options: true } },
    },
  });

  const STATUS_LABELS: Record<string, string> = {
    ACTIVE: "판매중", OUT_OF_STOCK: "품절", DISCONTINUED: "단종", HIDDEN: "숨김",
  };
  const STATUS_COLORS: Record<string, string> = {
    ACTIVE: "text-green-400 bg-green-900/30",
    OUT_OF_STOCK: "text-orange-400 bg-orange-900/30",
    DISCONTINUED: "text-[#555] bg-[#222]",
    HIDDEN: "text-[#666] bg-[#1a1a1a]",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-[var(--font-mono)] text-[10px] text-[#555] tracking-[2px] mb-1">ADMIN / PRODUCTS</div>
          <h1 className="text-xl font-black text-white">상품 관리</h1>
        </div>
        <Link href="/admin/products/new" className="bg-[#c8161d] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#9c0e15] transition-colors">
          + 상품 등록
        </Link>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "전체 상품", value: products.length },
          { label: "판매중", value: products.filter((p) => p.status === "ACTIVE").length },
          { label: "품절", value: products.filter((p) => p.status === "OUT_OF_STOCK").length },
          { label: "숨김/단종", value: products.filter((p) => ["HIDDEN","DISCONTINUED"].includes(p.status)).length },
        ].map((s) => (
          <div key={s.label} className="bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-3.5">
            <div className="font-[var(--font-mono)] text-[10px] text-[#555] mb-1">{s.label}</div>
            <div className="font-[var(--font-display)] text-2xl text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {/* 테이블 */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a]">
        <div className="grid font-[var(--font-mono)] text-[10px] text-[#555] tracking-[0.5px] px-5 py-3 bg-[#111] border-b border-[#2a2a2a]"
          style={{ gridTemplateColumns: "60px 1fr 120px 100px 100px 80px 80px" }}>
          <div>이미지</div><div>상품명</div><div>브랜드</div><div>판매가</div><div>옵션수</div><div>배지</div><div>상태</div>
        </div>
        {products.map((p) => (
          <div key={p.id} className="grid items-center px-5 py-3 border-b border-[#222] hover:bg-[#1f1f1f]"
            style={{ gridTemplateColumns: "60px 1fr 120px 100px 100px 80px 80px" }}>
            <div className="w-10 h-10 bg-[#222] overflow-hidden flex-shrink-0">
              {p.images[0] && <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />}
            </div>
            <div className="pr-4 min-w-0">
              <Link href={`/admin/products/${p.id}`} className="text-sm text-[#ddd] hover:text-[#c8161d] transition-colors font-semibold line-clamp-1">
                {p.name}
              </Link>
              <div className="font-[var(--font-mono)] text-[10px] text-[#444] mt-0.5">{p.slug}</div>
            </div>
            <div className="text-xs text-[#888]">{p.brand.name}</div>
            <div className="text-sm font-bold text-white">{p.salePrice.toLocaleString()}원</div>
            <div className="font-[var(--font-mono)] text-[11px] text-[#666]">{p._count.options}개</div>
            <div className="flex gap-1">
              {p.isNew && <span className="font-[var(--font-mono)] text-[9px] bg-[#c8161d]/20 text-[#c8161d] px-1 py-0.5">NEW</span>}
              {p.isBest && <span className="font-[var(--font-mono)] text-[9px] bg-yellow-900/30 text-yellow-400 px-1 py-0.5">BEST</span>}
            </div>
            <div>
              <span className={`font-[var(--font-mono)] text-[10px] px-2 py-0.5 font-bold ${STATUS_COLORS[p.status]}`}>
                {STATUS_LABELS[p.status]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
