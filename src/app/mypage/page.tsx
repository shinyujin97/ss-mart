import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING:        "결제 대기",
  PAID:           "결제 완료",
  DESIGN_REVIEW:  "시안 검토",
  IN_PRODUCTION:  "제작 중",
  PREPARING:      "출고 준비",
  SHIPPING:       "배송 중",
  DELIVERED:      "배송 완료",
  CONFIRMED:      "구매 확정",
  CANCELLED:      "취소",
  REFUNDED:       "환불 완료",
};

const STATUS_COLORS: Record<string, string> = {
  PAID: "text-[var(--black)] bg-[var(--gray-100)]",
  SHIPPING: "text-blue-700 bg-blue-50",
  DELIVERED: "text-green-700 bg-green-50",
  CONFIRMED: "text-green-700 bg-green-50",
  CANCELLED: "text-[var(--gray-500)] bg-[var(--gray-100)]",
  DESIGN_REVIEW: "text-[var(--red)] bg-red-50",
  IN_PRODUCTION: "text-orange-700 bg-orange-50",
};

export const metadata = { title: "마이페이지 | 에스에스종합상사" };

export default async function MypageDashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [recentOrders, recentDesigns, pointHistory] = await Promise.all([
    prisma.order.findMany({
      where: { memberId: session.user.id as string },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        items: { take: 1, include: { product: { select: { name: true } } } },
        payment: { select: { method: true } },
      },
    }),
    prisma.embroideryDesign.findMany({
      where: { memberId: session.user.id as string },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, designNumber: true, status: true, embroideryType: true, totalPrice: true, createdAt: true },
    }),
    prisma.pointHistory.findMany({
      where: { memberId: session.user.id as string },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { type: true, amount: true, balance: true, reason: true, createdAt: true },
    }),
  ]);

  const DESIGN_STATUS_LABELS: Record<string, string> = {
    DRAFT: "임시 저장",
    REVIEW_PENDING: "검토 대기",
    CUSTOMER_REVIEW: "시안 확인",
    CONFIRMED: "확정",
    IN_PRODUCTION: "작업 중",
    COMPLETED: "완료",
  };

  const SectionCard = ({ num, title, link, children }: { num: string; title: string; link?: string; children: React.ReactNode }) => (
    <div className="border border-[var(--line)] bg-white mb-3">
      <div className="flex items-center justify-between px-5 py-3.5 bg-[var(--gray-50)] border-b border-[var(--line)]">
        <div className="flex items-center gap-3 text-sm font-black">
          <span className="font-[var(--font-mono)] text-[10px] text-[var(--red)] border border-[var(--red)] px-2 py-0.5 font-bold tracking-[1.5px]">{num}</span>
          {title}
        </div>
        {link && (
          <Link href={link} className="font-[var(--font-mono)] text-[11px] text-[var(--gray-600)] hover:text-[var(--red)] tracking-[0.3px]">
            전체보기 →
          </Link>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <div>
      {/* 빠른 액션 */}
      <div className="grid grid-cols-4 border border-[var(--line)] bg-white mb-3">
        {[
          { href: "/categories/workwear", label: "작업복 쇼핑", icon: "👕", sub: "5,940+ 상품" },
          { href: "/embroidery/simulator", label: "자수 시뮬레이터", icon: "✍️", sub: "무료 시안 제작" },
          { href: "/bulk-order", label: "단체주문 견적", icon: "📋", sub: "최대 30% 할인" },
          { href: "/mypage/orders", label: "주문 내역", icon: "📦", sub: `총 ${recentOrders.length}건` },
        ].map((a, i) => (
          <Link
            key={a.href}
            href={a.href}
            className={`flex items-center gap-4 px-5 py-5 hover:bg-[var(--gray-50)] transition-colors ${i < 3 ? "border-r border-[var(--line)]" : ""}`}
          >
            <span className="text-2xl">{a.icon}</span>
            <div>
              <div className="text-sm font-bold">{a.label}</div>
              <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] mt-0.5">{a.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* 최근 주문 */}
      <SectionCard num="SECTION / 01" title="최근 주문 내역" link="/mypage/orders">
        {recentOrders.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--gray-400)]">
            주문 내역이 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] mb-1">{order.orderNumber}</div>
                  <div className="text-sm font-semibold truncate">
                    {order.items[0]?.product.name ?? "상품 정보 없음"}
                    {order.items.length > 1 && ` 외 ${order.items.length - 1}건`}
                  </div>
                  <div className="text-xs text-[var(--gray-500)] mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("ko-KR")}
                    <span className="mx-2">·</span>
                    {order.totalAmount.toLocaleString()}원
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`font-[var(--font-mono)] text-[10px] px-2 py-1 font-bold tracking-[0.3px] ${STATUS_COLORS[order.status] ?? "text-[var(--gray-700)] bg-[var(--gray-100)]"}`}>
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <Link href={`/mypage/orders/${order.id}`} className="text-[11px] px-3 py-1.5 border border-[var(--line)] font-[var(--font-mono)] hover:border-[var(--black)] transition-colors">
                    상세
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* 자수 시안 */}
      <SectionCard num="SECTION / 02" title="자수 시안 보관함" link="/mypage/embroidery">
        {recentDesigns.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-[var(--gray-400)] mb-3">저장된 자수 시안이 없습니다.</p>
            <Link href="/embroidery/simulator" className="inline-block bg-[var(--red)] text-white px-5 py-2.5 text-xs font-bold hover:bg-[var(--red-dark)] transition-colors">
              시뮬레이터 시작 →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 divide-x divide-[var(--line)]">
            {recentDesigns.map((d) => (
              <div key={d.id} className="p-4">
                <div className="font-[var(--font-mono)] text-[9px] text-[var(--gray-400)] mb-1">{d.designNumber}</div>
                <div className="text-sm font-bold mb-1">{d.embroideryType}</div>
                <div className="flex items-center gap-2">
                  <span className={`font-[var(--font-mono)] text-[10px] px-2 py-0.5 font-bold ${
                    d.status === "CONFIRMED" ? "bg-green-50 text-green-700" :
                    d.status === "IN_PRODUCTION" ? "bg-orange-50 text-orange-700" :
                    "bg-[var(--gray-100)] text-[var(--gray-600)]"
                  }`}>
                    {DESIGN_STATUS_LABELS[d.status] ?? d.status}
                  </span>
                </div>
                <div className="font-[var(--font-display)] text-base text-[var(--red)] mt-2">
                  {d.totalPrice.toLocaleString()}원
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* 적립금 내역 */}
      <SectionCard num="SECTION / 03" title="최근 적립금 내역" link="/mypage/points">
        {pointHistory.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-[var(--gray-400)]">적립금 내역이 없습니다.</div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {pointHistory.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <div className="font-semibold">{p.reason}</div>
                  <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] mt-0.5">
                    {new Date(p.createdAt).toLocaleDateString("ko-KR")}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold font-[var(--font-display)] text-base ${p.amount >= 0 ? "text-[var(--red)]" : "text-[var(--gray-700)]"}`}>
                    {p.amount >= 0 ? "+" : ""}{p.amount.toLocaleString()}P
                  </div>
                  <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)]">
                    잔액 {p.balance.toLocaleString()}P
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
