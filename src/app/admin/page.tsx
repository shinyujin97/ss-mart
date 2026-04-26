import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = { title: "대시보드" };

export default async function AdminDashboard() {
  await requireAdmin();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    todayOrders, todayRevenue,
    monthOrders, monthRevenue,
    totalMembers, newMembersToday,
    pendingEmbroidery, pendingQuotes,
    recentOrders, recentQuotes,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: todayStart }, status: { not: "CANCELLED" } } }),
    prisma.order.aggregate({ where: { createdAt: { gte: todayStart }, status: { not: "CANCELLED" } }, _sum: { totalAmount: true } }),
    prisma.order.count({ where: { createdAt: { gte: monthStart }, status: { not: "CANCELLED" } } }),
    prisma.order.aggregate({ where: { createdAt: { gte: monthStart }, status: { not: "CANCELLED" } }, _sum: { totalAmount: true } }),
    prisma.member.count({ where: { status: "ACTIVE" } }),
    prisma.member.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.embroideryDesign.count({ where: { status: { in: ["REVIEW_PENDING", "REVIEW_IN_PROGRESS", "CUSTOMER_REVIEW"] } } }),
    prisma.quoteRequest.count({ where: { status: { in: ["PENDING", "ASSIGNED", "IN_REVIEW"] } } }),
    prisma.order.findMany({
      take: 8, orderBy: { createdAt: "desc" },
      include: { items: { take: 1, include: { product: { select: { name: true } } } } },
    }),
    prisma.quoteRequest.findMany({
      take: 5, orderBy: { createdAt: "desc" },
      select: { id: true, requestNumber: true, companyName: true, totalQuantity: true, status: true, createdAt: true },
    }),
  ]);

  const STAT_CARDS = [
    { label: "오늘 주문", value: `${todayOrders}건`, sub: `${(todayRevenue._sum.totalAmount ?? 0).toLocaleString()}원`, color: "border-[#c8161d]" },
    { label: "이번 달 매출", value: `${(monthRevenue._sum.totalAmount ?? 0).toLocaleString()}원`, sub: `주문 ${monthOrders}건`, color: "border-[#ffd400]" },
    { label: "전체 회원", value: `${totalMembers.toLocaleString()}명`, sub: `오늘 +${newMembersToday}`, color: "border-[#22c55e]" },
    { label: "처리 대기", value: `${pendingEmbroidery + pendingQuotes}건`, sub: `시안 ${pendingEmbroidery} · 견적 ${pendingQuotes}`, color: "border-blue-500" },
  ];

  const ORDER_STATUS_LABELS: Record<string, string> = {
    PENDING: "대기", PAID: "결제완료", SHIPPING: "배송중", DELIVERED: "배송완료",
    CONFIRMED: "구매확정", CANCELLED: "취소", DESIGN_REVIEW: "시안검토",
  };

  const QUOTE_STATUS_LABELS: Record<string, string> = {
    PENDING: "접수대기", ASSIGNED: "매니저배정", IN_REVIEW: "검토중", QUOTED: "견적발송",
    ACCEPTED: "수락", CONVERTED: "전환완료",
  };

  const AdminCard = ({ title, link, children }: { title: string; link?: string; children: React.ReactNode }) => (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a]">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2a2a2a]">
        <span className="font-[var(--font-mono)] text-xs text-[#888] tracking-[1px]">{title}</span>
        {link && <Link href={link} className="font-[var(--font-mono)] text-[10px] text-[#555] hover:text-[#c8161d] tracking-[0.5px]">전체보기 →</Link>}
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <div className="font-[var(--font-mono)] text-[10px] text-[#555] tracking-[2px] mb-1">ADMIN / DASHBOARD</div>
        <h1 className="text-2xl font-black text-white">대시보드</h1>
        <div className="font-[var(--font-mono)] text-[11px] text-[#555] mt-1">
          {now.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className={`bg-[#1a1a1a] border-l-2 ${s.color} p-5`}>
            <div className="font-[var(--font-mono)] text-[10px] text-[#555] tracking-[1px] mb-2">{s.label}</div>
            <div className="font-[var(--font-display)] text-2xl text-white mb-1">{s.value}</div>
            <div className="font-[var(--font-mono)] text-[11px] text-[#666]">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* 빠른 액션 */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { href: "/admin/products/new", label: "상품 등록", icon: "+" },
          { href: "/admin/embroidery", label: `시안 검토 (${pendingEmbroidery})`, icon: "✦" },
          { href: "/admin/bulk-orders", label: `견적 대기 (${pendingQuotes})`, icon: "◆" },
          { href: "/admin/orders", label: "주문 현황", icon: "▷" },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-3.5 flex items-center gap-3 hover:border-[#c8161d] hover:bg-[#1f1f1f] transition-all group">
            <span className="w-7 h-7 border border-[#333] flex items-center justify-center text-sm text-[#666] group-hover:border-[#c8161d] group-hover:text-[#c8161d] transition-all">{a.icon}</span>
            <span className="text-sm text-[#888] group-hover:text-white transition-colors font-semibold">{a.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-5">
        {/* 최근 주문 */}
        <AdminCard title="RECENT ORDERS" link="/admin/orders">
          <div className="divide-y divide-[#222]">
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="font-[var(--font-mono)] text-[10px] text-[#555] mb-0.5">{o.orderNumber}</div>
                  <div className="text-sm text-[#ccc] truncate">{o.items[0]?.product.name ?? "—"}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold text-white">{o.totalAmount.toLocaleString()}원</div>
                  <div className="font-[var(--font-mono)] text-[10px] text-[#555] mt-0.5">
                    {ORDER_STATUS_LABELS[o.status] ?? o.status}
                  </div>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-[#444]">주문이 없습니다.</div>
            )}
          </div>
        </AdminCard>

        {/* 최근 견적 */}
        <AdminCard title="RECENT QUOTES" link="/admin/bulk-orders">
          <div className="divide-y divide-[#222]">
            {recentQuotes.map((q) => (
              <div key={q.id} className="px-5 py-3">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-[var(--font-mono)] text-[10px] text-[#555]">{q.requestNumber}</span>
                  <span className={`font-[var(--font-mono)] text-[10px] px-1.5 py-0.5 font-bold ${
                    q.status === "PENDING" ? "bg-[#c8161d]/20 text-[#c8161d]" :
                    q.status === "ASSIGNED" ? "bg-yellow-900/30 text-yellow-400" :
                    "bg-[#222] text-[#888]"
                  }`}>
                    {QUOTE_STATUS_LABELS[q.status] ?? q.status}
                  </span>
                </div>
                <div className="text-sm text-[#ccc]">{q.companyName}</div>
                <div className="font-[var(--font-mono)] text-[10px] text-[#555] mt-0.5">{q.totalQuantity.toLocaleString()}벌</div>
              </div>
            ))}
            {recentQuotes.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-[#444]">견적 신청이 없습니다.</div>
            )}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
