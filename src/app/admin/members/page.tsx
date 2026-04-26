import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "회원 관리" };

const GRADE_LABELS: Record<string, string> = { FAMILY: "FAMILY", FRIEND: "FRIEND", VIP: "VIP", VVIP: "VVIP" };
const GRADE_COLORS: Record<string, string> = {
  FAMILY: "text-[#888] bg-[#222]",
  FRIEND: "text-blue-400 bg-blue-900/30",
  VIP: "text-[#ffd400] bg-yellow-900/30",
  VVIP: "text-orange-400 bg-orange-900/30",
};
const TYPE_LABELS: Record<string, string> = { INDIVIDUAL: "개인", BUSINESS: "사업자" };

export default async function AdminMembersPage() {
  await requireAdmin();

  const members = await prisma.member.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, name: true, email: true, phone: true,
      type: true, grade: true, status: true,
      points: true, totalOrders: true, totalAmount: true,
      createdAt: true,
      businessInfo: { select: { companyName: true } },
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-[var(--font-mono)] text-[10px] text-[#555] tracking-[2px] mb-1">ADMIN / MEMBERS</div>
          <h1 className="text-xl font-black text-white">회원 관리</h1>
        </div>
        <div className="font-[var(--font-mono)] text-xs text-[#555]">총 {members.length.toLocaleString()}명</div>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "전체", value: members.length },
          { label: "사업자 회원", value: members.filter((m) => m.type === "BUSINESS").length },
          { label: "VIP 이상", value: members.filter((m) => ["VIP","VVIP"].includes(m.grade)).length },
          { label: "오늘 가입", value: members.filter((m) => new Date(m.createdAt) > new Date(new Date().setHours(0,0,0,0))).length },
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
          style={{ gridTemplateColumns: "1fr 150px 80px 60px 80px 100px 100px" }}>
          <div>이름 / 이메일</div><div>회사명</div><div>유형</div><div>등급</div><div>포인트</div><div>총 주문</div><div>가입일</div>
        </div>
        {members.map((m) => (
          <div key={m.id} className="grid items-center px-5 py-3 border-b border-[#222] hover:bg-[#1f1f1f] text-sm"
            style={{ gridTemplateColumns: "1fr 150px 80px 60px 80px 100px 100px" }}>
            <div>
              <div className="text-[#ddd] font-semibold">{m.name}</div>
              <div className="font-[var(--font-mono)] text-[10px] text-[#555] mt-0.5">{m.email}</div>
            </div>
            <div className="text-[#888] text-xs truncate">{m.businessInfo?.companyName ?? "—"}</div>
            <div className="font-[var(--font-mono)] text-[11px] text-[#666]">{TYPE_LABELS[m.type]}</div>
            <div>
              <span className={`font-[var(--font-mono)] text-[10px] px-2 py-0.5 font-bold ${GRADE_COLORS[m.grade]}`}>
                {GRADE_LABELS[m.grade]}
              </span>
            </div>
            <div className="font-[var(--font-mono)] text-[11px] text-[#666]">{m.points.toLocaleString()}P</div>
            <div className="text-[#888]">{m.totalOrders}건</div>
            <div className="font-[var(--font-mono)] text-[11px] text-[#555]">
              {new Date(m.createdAt).toLocaleDateString("ko-KR")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
