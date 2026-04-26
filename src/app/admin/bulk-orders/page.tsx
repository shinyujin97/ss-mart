import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "단체주문 견적 관리" };

const STATUS_LABELS: Record<string, string> = {
  PENDING: "접수대기", ASSIGNED: "매니저배정", IN_REVIEW: "검토중",
  QUOTED: "견적발송", ACCEPTED: "수락", REJECTED: "거절", EXPIRED: "만료", CONVERTED: "전환완료",
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-[#c8161d] bg-[#c8161d]/10",
  ASSIGNED: "text-[#ffd400] bg-yellow-900/30",
  IN_REVIEW: "text-orange-400 bg-orange-900/30",
  QUOTED: "text-blue-400 bg-blue-900/30",
  ACCEPTED: "text-green-400 bg-green-900/30",
  CONVERTED: "text-green-400 bg-green-900/20",
  REJECTED: "text-[#555] bg-[#222]",
  EXPIRED: "text-[#444] bg-[#1a1a1a]",
};

export default async function AdminBulkOrdersPage() {
  await requireAdmin();

  const quotes = await prisma.quoteRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { member: { select: { name: true } } },
  });

  const pendingCount = quotes.filter((q) => q.status === "PENDING").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-[var(--font-mono)] text-[10px] text-[#555] tracking-[2px] mb-1">ADMIN / BULK ORDERS</div>
          <h1 className="text-xl font-black text-white">단체주문 견적 관리</h1>
        </div>
        {pendingCount > 0 && (
          <div className="font-[var(--font-mono)] text-sm text-[#c8161d] font-bold">
            ⚠ 배정 대기 {pendingCount}건
          </div>
        )}
      </div>

      {/* 상태별 요약 */}
      <div className="grid grid-cols-6 gap-2">
        {["PENDING","ASSIGNED","IN_REVIEW","QUOTED","ACCEPTED","CONVERTED"].map((s) => {
          const count = quotes.filter((q) => q.status === s).length;
          return (
            <div key={s} className="bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-3">
              <div className="font-[var(--font-mono)] text-[9px] text-[#555] mb-1 tracking-[0.5px]">{STATUS_LABELS[s]}</div>
              <div className={`font-[var(--font-display)] text-xl ${count > 0 && s === "PENDING" ? "text-[#c8161d]" : "text-white"}`}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* 테이블 */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a]">
        <div className="grid font-[var(--font-mono)] text-[10px] text-[#555] tracking-[0.5px] px-5 py-3 bg-[#111] border-b border-[#2a2a2a]"
          style={{ gridTemplateColumns: "150px 1fr 100px 80px 80px 100px 100px" }}>
          <div>견적번호</div><div>회사명</div><div>담당자</div><div>수량</div><div>자수</div><div>결제방식</div><div>상태</div>
        </div>
        {quotes.map((q) => (
          <div key={q.id} className="grid items-center px-5 py-3.5 border-b border-[#222] hover:bg-[#1f1f1f] text-sm"
            style={{ gridTemplateColumns: "150px 1fr 100px 80px 80px 100px 100px" }}>
            <div>
              <div className="font-[var(--font-mono)] text-[11px] text-[#c8161d]">{q.requestNumber}</div>
              <div className="font-[var(--font-mono)] text-[10px] text-[#444] mt-0.5">
                {new Date(q.createdAt).toLocaleDateString("ko-KR")}
              </div>
            </div>
            <div className="text-[#ddd] font-semibold truncate pr-4">{q.companyName}</div>
            <div className="text-[#888] text-xs truncate">{q.managerName}</div>
            <div className="font-[var(--font-display)] text-base text-white">{q.totalQuantity.toLocaleString()}</div>
            <div className="font-[var(--font-mono)] text-[11px]">
              {q.embroideryRequested
                ? <span className="text-[#ffd400]">포함</span>
                : <span className="text-[#444]">없음</span>}
            </div>
            <div className="font-[var(--font-mono)] text-[10px] text-[#666] truncate">{q.paymentMethod}</div>
            <div>
              <span className={`font-[var(--font-mono)] text-[10px] px-2 py-0.5 font-bold ${STATUS_COLORS[q.status] ?? "text-[#888] bg-[#222]"}`}>
                {STATUS_LABELS[q.status] ?? q.status}
              </span>
            </div>
          </div>
        ))}
        {quotes.length === 0 && (
          <div className="px-5 py-12 text-center text-[#444] text-sm">견적 신청이 없습니다.</div>
        )}
      </div>
    </div>
  );
}
