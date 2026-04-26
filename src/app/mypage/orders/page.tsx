import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "결제 대기", PAID: "결제 완료", DESIGN_REVIEW: "시안 검토",
  IN_PRODUCTION: "제작 중", PREPARING: "출고 준비", SHIPPING: "배송 중",
  DELIVERED: "배송 완료", CONFIRMED: "구매 확정", CANCELLED: "취소",
  REFUND_REQUESTED: "환불 요청", REFUNDED: "환불 완료",
};

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-[var(--gray-100)] text-[var(--black)]",
  SHIPPING: "bg-blue-50 text-blue-700",
  DELIVERED: "bg-green-50 text-green-700",
  CONFIRMED: "bg-green-50 text-green-700",
  CANCELLED: "bg-[var(--gray-100)] text-[var(--gray-500)]",
  DESIGN_REVIEW: "bg-red-50 text-[var(--red)]",
  IN_PRODUCTION: "bg-orange-50 text-orange-700",
};

export const metadata = { title: "주문 내역 | 마이페이지" };

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { memberId: session.user.id as string },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: { select: { name: true, slug: true } },
          option: { select: { color: true, size: true } },
        },
      },
      payment: { select: { method: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black">주문 / 배송 조회</h2>
        <span className="font-[var(--font-mono)] text-xs text-[var(--gray-500)]">총 {orders.length}건</span>
      </div>

      {orders.length === 0 ? (
        <div className="border border-[var(--line)] bg-white py-20 text-center">
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--gray-300)] tracking-[2px] mb-3">NO ORDERS</div>
          <p className="text-sm text-[var(--gray-500)] mb-5">주문 내역이 없습니다.</p>
          <Link href="/" className="inline-block bg-[var(--black)] text-white px-6 py-3 text-sm font-bold hover:bg-[var(--gray-900)]">
            쇼핑하러 가기 →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="border border-[var(--line)] bg-white">
              {/* 주문 헤더 */}
              <div className="flex items-center justify-between px-5 py-3 bg-[var(--gray-50)] border-b border-[var(--line)]">
                <div className="flex items-center gap-3">
                  <span className="font-[var(--font-mono)] text-[11px] text-[var(--gray-600)] font-bold">{order.orderNumber}</span>
                  <span className="text-xs text-[var(--gray-500)]">{new Date(order.createdAt).toLocaleDateString("ko-KR")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-[var(--font-mono)] text-[10px] px-2 py-1 font-bold tracking-[0.3px] ${STATUS_COLORS[order.status] ?? "bg-[var(--gray-100)] text-[var(--gray-700)]"}`}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>
              </div>

              {/* 주문 상품 */}
              <div className="divide-y divide-[var(--line)]">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.product.slug}`} className="text-sm font-semibold hover:text-[var(--red)] transition-colors line-clamp-1">
                        {item.product.name}
                      </Link>
                      <div className="text-xs text-[var(--gray-500)] mt-0.5 font-[var(--font-mono)]">
                        {item.option.color} / {item.option.size} / {item.quantity}개
                      </div>
                    </div>
                    <div className="text-sm font-black flex-shrink-0">{item.totalPrice.toLocaleString()}원</div>
                  </div>
                ))}
              </div>

              {/* 주문 푸터 */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--line)]">
                <div className="text-sm">
                  총 <span className="font-black text-[var(--red)]">{order.totalAmount.toLocaleString()}</span>원
                </div>
                <div className="flex gap-2">
                  {/* [HIGH FIX 4] 자수 주문은 단순 취소 불가 — 상담 연결 */}
                  {["PAID", "SHIPPING"].includes(order.status) && !order.hasEmbroidery && (
                    <button className="text-[11px] px-3 py-1.5 border border-[var(--line)] font-[var(--font-mono)] hover:border-[var(--red)] hover:text-[var(--red)] transition-colors">
                      주문 취소
                    </button>
                  )}
                  {["PAID"].includes(order.status) && order.hasEmbroidery && (
                    <a href="https://pf.kakao.com/_ssmart" target="_blank" rel="noreferrer"
                      className="text-[11px] px-3 py-1.5 border border-[var(--yellow)] text-[var(--gray-700)] font-[var(--font-mono)] hover:bg-[var(--yellow)] transition-colors">
                      취소 상담 (자수 주문)
                    </a>
                  )}
                  {order.status === "DELIVERED" && (
                    <button className="text-[11px] px-3 py-1.5 border border-[var(--line)] font-[var(--font-mono)] hover:border-[var(--black)] transition-colors">
                      구매 확정
                    </button>
                  )}
                  <Link href={`/orders/complete/${order.id}`} className="text-[11px] px-3 py-1.5 border border-[var(--line)] font-[var(--font-mono)] hover:border-[var(--black)] transition-colors">
                    주문 상세
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
