import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS } from "@/lib/embroidery/status";
import { EMBROIDERY_TYPES } from "@/constants/embroidery";

export const metadata = { title: "자수 시안 관리" };

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "text-[#555] bg-[#222]",
  REVIEW_PENDING: "text-[#ffd400] bg-yellow-900/30",
  REVIEW_IN_PROGRESS: "text-orange-400 bg-orange-900/30",
  CUSTOMER_REVIEW: "text-blue-400 bg-blue-900/30",
  REVISION_REQUESTED: "text-orange-400 bg-orange-900/30",
  CONFIRMED: "text-green-400 bg-green-900/30",
  IN_PRODUCTION: "text-purple-400 bg-purple-900/30",
  COMPLETED: "text-green-400 bg-green-900/20",
  CANCELLED: "text-[#444] bg-[#1a1a1a]",
  REJECTED: "text-[#c8161d] bg-[#c8161d]/10",
};

export default async function AdminEmbroideryPage() {
  await requireAdmin();

  const designs = await prisma.embroideryDesign.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      member: { select: { name: true, email: true } },
    },
  });

  const PRIORITY_STATUSES = ["REVIEW_PENDING", "REVIEW_IN_PROGRESS", "REVISION_REQUESTED"];
  const urgent = designs.filter((d) => PRIORITY_STATUSES.includes(d.status));

  return (
    <div className="space-y-5">
      <div>
        <div className="font-[var(--font-mono)] text-[10px] text-[#555] tracking-[2px] mb-1">ADMIN / EMBROIDERY</div>
        <h1 className="text-xl font-black text-white">자수 시안 관리</h1>
      </div>

      {/* 긴급 처리 */}
      {urgent.length > 0 && (
        <div className="border border-[#c8161d]/50 bg-[#c8161d]/5 px-5 py-4">
          <div className="font-[var(--font-mono)] text-[10px] text-[#c8161d] tracking-[1.5px] mb-3 font-bold">
            ⚠ 검토 필요 ({urgent.length}건)
          </div>
          <div className="space-y-2">
            {urgent.map((d) => (
              <div key={d.id} className="flex items-center justify-between bg-[#1a1a1a] px-4 py-3">
                <div>
                  <span className="font-[var(--font-mono)] text-[11px] text-[#888]">{d.designNumber}</span>
                  <span className="text-sm text-[#ddd] ml-3">{d.member?.name ?? "비회원"}</span>
                  <span className="text-xs text-[#555] ml-2">
                    {EMBROIDERY_TYPES[d.embroideryType as keyof typeof EMBROIDERY_TYPES]?.name}
                  </span>
                </div>
                <span className={`font-[var(--font-mono)] text-[10px] px-2 py-1 font-bold ${STATUS_COLORS[d.status]}`}>
                  {STATUS_LABELS[d.status as keyof typeof STATUS_LABELS]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 상태별 요약 */}
      <div className="grid grid-cols-5 gap-2">
        {["REVIEW_PENDING", "CUSTOMER_REVIEW", "CONFIRMED", "IN_PRODUCTION", "COMPLETED"].map((s) => {
          const count = designs.filter((d) => d.status === s).length;
          return (
            <div key={s} className="bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-3">
              <div className="font-[var(--font-mono)] text-[9px] text-[#555] mb-1 tracking-[0.5px]">
                {STATUS_LABELS[s as keyof typeof STATUS_LABELS]}
              </div>
              <div className="font-[var(--font-display)] text-xl text-white">{count}</div>
            </div>
          );
        })}
      </div>

      {/* 전체 목록 */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a]">
        <div className="grid font-[var(--font-mono)] text-[10px] text-[#555] tracking-[0.5px] px-5 py-3 bg-[#111] border-b border-[#2a2a2a]"
          style={{ gridTemplateColumns: "160px 120px 120px 100px 100px 120px 100px" }}>
          <div>시안번호</div><div>회원</div><div>자수 종류</div><div>위치</div><div>크기</div><div>금액</div><div>상태</div>
        </div>
        {designs.map((d) => (
          <div key={d.id} className="grid items-center px-5 py-3 border-b border-[#222] hover:bg-[#1f1f1f] text-sm"
            style={{ gridTemplateColumns: "160px 120px 120px 100px 100px 120px 100px" }}>
            <div className="font-[var(--font-mono)] text-[11px] text-[#c8161d]">{d.designNumber}</div>
            <div className="text-[#888] truncate">{d.member?.name ?? "비회원"}</div>
            <div className="text-[#ccc]">{EMBROIDERY_TYPES[d.embroideryType as keyof typeof EMBROIDERY_TYPES]?.name ?? d.embroideryType}</div>
            <div className="font-[var(--font-mono)] text-[11px] text-[#666]">{d.position}</div>
            <div className="font-[var(--font-mono)] text-[11px] text-[#666]">{d.size}</div>
            <div className="font-bold text-white">{d.totalPrice.toLocaleString()}원</div>
            <div>
              <span className={`font-[var(--font-mono)] text-[10px] px-2 py-0.5 font-bold ${STATUS_COLORS[d.status] ?? "text-[#888] bg-[#222]"}`}>
                {STATUS_LABELS[d.status as keyof typeof STATUS_LABELS] ?? d.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
