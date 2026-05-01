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
    ACTIVE: "text-green-700 bg-green-50 border-green-200",
    OUT_OF_STOCK: "text-orange-600 bg-orange-50 border-orange-200",
    DISCONTINUED: "text-gray-400 bg-gray-50 border-gray-200",
    HIDDEN: "text-gray-400 bg-gray-50 border-gray-200",
  };

  const stats = [
    { label: "전체 상품", value: products.length, color: "text-[#111]" },
    { label: "판매중", value: products.filter((p) => p.status === "ACTIVE").length, color: "text-green-600" },
    { label: "품절", value: products.filter((p) => p.status === "OUT_OF_STOCK").length, color: "text-orange-500" },
    { label: "숨김/단종", value: products.filter((p) => ["HIDDEN","DISCONTINUED"].includes(p.status)).length, color: "text-gray-400" },
  ];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-[var(--font-mono)] text-[10px] text-[#aaa] tracking-[2px] mb-1">ADMIN / PRODUCTS</div>
          <h1 className="text-2xl font-black text-[#111]">상품 관리</h1>
        </div>
        <Link href="/admin/products/new" className="bg-[#c8161d] text-white px-6 py-3 text-sm font-bold hover:bg-[#9c0e15] transition-colors">
          + 상품 등록
        </Link>
      </div>

      {/* INFO 카드 — 중앙 크게 */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-[#e5e5e5] px-6 py-6 text-center shadow-sm">
            <div className="font-[var(--font-mono)] text-[10px] text-[#aaa] tracking-[1.5px] mb-3">{s.label}</div>
            <div className={`font-[var(--font-display)] text-5xl font-bold ${s.color}`}>{s.value}</div>
            <div className="font-[var(--font-mono)] text-[10px] text-[#ccc] mt-2">ITEMS</div>
          </div>
        ))}
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-[#e5e5e5] shadow-sm">
        <div
          className="grid font-[var(--font-mono)] text-[10px] text-[#aaa] tracking-[0.5px] px-5 py-3 bg-[#fafafa] border-b border-[#e5e5e5]"
          style={{ gridTemplateColumns: "60px 1fr 120px 110px 80px 80px 90px" }}
        >
          <div>이미지</div><div>상품명</div><div>브랜드</div><div>판매가</div><div>옵션수</div><div>배지</div><div>상태</div>
        </div>
        {products.map((p) => (
          <div
            key={p.id}
            className="grid items-center px-5 py-3.5 border-b border-[#f0f0f0] hover:bg-[#fafafa] transition-colors"
            style={{ gridTemplateColumns: "60px 1fr 120px 110px 80px 80px 90px" }}
          >
            <div className="w-10 h-10 bg-[#f4f4f4] border border-[#e5e5e5] overflow-hidden flex-shrink-0">
              {p.images[0] && <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />}
            </div>
            <div className="pr-4 min-w-0">
              <Link href={`/admin/products/${p.id}`} className="text-sm text-[#111] hover:text-[#c8161d] transition-colors font-semibold line-clamp-1">
                {p.name}
              </Link>
              <div className="font-[var(--font-mono)] text-[10px] text-[#bbb] mt-0.5">{p.slug}</div>
            </div>
            <div className="text-xs text-[#777]">{p.brand.name}</div>
            <div className="text-sm font-bold text-[#111]">{p.salePrice.toLocaleString()}원</div>
            <div className="font-[var(--font-mono)] text-[11px] text-[#aaa]">{p._count.options}개</div>
            <div className="flex gap-1">
              {p.isNew && <span className="font-[var(--font-mono)] text-[9px] bg-[#c8161d] text-white px-1.5 py-0.5">NEW</span>}
              {p.isBest && <span className="font-[var(--font-mono)] text-[9px] bg-[#ffd400] text-[#111] px-1.5 py-0.5">BEST</span>}
            </div>
            <div>
              <span className={`font-[var(--font-mono)] text-[10px] px-2 py-0.5 border font-bold ${STATUS_COLORS[p.status]}`}>
                {STATUS_LABELS[p.status]}
              </span>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="px-5 py-16 text-center text-[#bbb] font-[var(--font-mono)] text-sm">
            등록된 상품이 없습니다
          </div>
        )}
      </div>
    </div>
  );
}
