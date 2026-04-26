import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = { title: "주문 관리" };

const STATUS_LABELS: Record<string, string> = {
  PENDING: "결제대기", PAID: "결제완료", DESIGN_REVIEW: "시안검토",
  IN_PRODUCTION: "제작중", PREPARING: "출고준비", SHIPPING: "배송중",
  DELIVERED: "배송완료", CONFIRMED: "구매확정", CANCELLED: "취소",
  REFUND_REQUESTED: "환불요청", REFUNDED: "환불완료",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-[#888] bg-[#222]",
  PAID: "text-[#ffd400] bg-yellow-900/30",
  SHIPPING: "text-blue-400 bg-blue-900/30",
  DELIVERED: "text-green-400 bg-green-900/30",
  CONFIRMED: "text-green-400 bg-green-900/30",
  CANCELLED: "text-[#555] bg-[#1a1a1a]",
  DESIGN_REVIEW: "text-[#c8161d] bg-[#c8161d]/10",
  IN_PRODUCTION: "text-orange-400 bg-orange-900/30",
};

export default async function AdminOrdersPage() {
  await requireAdmin();

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      member: { select: { name: true, email: true } },
      items: { take: 1, include: { product: { select: { name: true } } } },
      payment: { select: { method: true } },
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-[var(--font-mono)] text-[10px] text-[#555] tracking-[2px] mb-1">ADMIN / ORDERS</div>
          <h1 className="text-xl font-black text-white">주문 관리</h1>
        </div>
        <div className="font-[var(--font-mono)] text-xs text-[#555]">총 {orders.length.toLocaleString()}건</div>
      </div>

      {/* 상태별 요약 */}
      <div className="grid grid-cols-6 gap-2">
        {["PAID", "DESIGN_REVIEW", "IN_PRODUCTION", "SHIPPING", "DELIVERED", "REFUND_REQUESTED"].map((s) => {
          const count = orders.filter((o) => o.status === s).length;
          return (
            <div key={s} className={`px-4 py-3 border border-[#2a2a2a] ${count > 0 ? "bg-[#1a1a1a]" : "bg-[#111]"}`}>
              <div className="font-[var(--font-mono)] text-[9px] text-[#555] tracking-[0.5px] mb-1">{STATUS_LABELS[s]}</div>
              <div className={`font-[var(--font-display)] text-xl ${count > 0 ? "text-white" : "text-[#333]"}`}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* 테이블 */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a]">
        <div className="grid font-[var(--font-mono)] text-[10px] text-[#555] tracking-[0.5px] px-5 py-3 bg-[#111] border-b border-[#2a2a2a]"
          style={{ gridTemplateColumns: "160px 1fr 120px 100px 120px 120px" }}>
          <div>주문번호</div><div>상품</div><div>회원</div><div>결제수단</div><div>금액</div><div>상태</div>
        </div>
        {orders.map((o) => (
          <div key={o.id} className="grid items-center px-5 py-3.5 border-b border-[#222] hover:bg-[#1f1f1f] transition-colors"
            style={{ gridTemplateColumns: "160px 1fr 120px 100px 120px 120px" }}>
            <div>
              <Link href={`/admin/orders/${o.id}`} className="font-[var(--font-mono)] text-[11px] text-[#c8161d] hover:text-white transition-colors">
                {o.orderNumber}
              </Link>
              <div className="font-[var(--font-mono)] text-[10px] text-[#444] mt-0.5">
                {new Date(o.createdAt).toLocaleDateString("ko-KR")}
              </div>
            </div>
            <div className="text-sm text-[#ccc] truncate pr-4">
              {o.items[0]?.product.name ?? "—"}
              {o.items.length > 1 && <span className="text-[#555]"> 외 {o.items.length - 1}건</span>}
            </div>
            <div className="text-xs text-[#888] truncate">{o.member.name}</div>
            <div className="font-[var(--font-mono)] text-[11px] text-[#666]">{o.payment?.method ?? "—"}</div>
            <div className="font-bold text-sm text-white">{o.totalAmount.toLocaleString()}원</div>
            <div>
              <span className={`font-[var(--font-mono)] text-[10px] px-2 py-1 font-bold ${STATUS_COLORS[o.status] ?? "text-[#888] bg-[#222]"}`}>
                {STATUS_LABELS[o.status] ?? o.status}
              </span>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="px-5 py-12 text-center text-[#444] text-sm">주문이 없습니다.</div>
        )}
      </div>
    </div>
  );
}
