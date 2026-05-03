import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "쿠폰 관리" };

export default async function AdminCouponsPage() {
  await requireAdmin();

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { memberCoupons: true } } },
  });

  const DISCOUNT_LABELS: Record<string, string> = {
    FIXED_AMOUNT: "원 할인", PERCENTAGE: "% 할인",
    FREE_SHIPPING: "무료배송", FREE_EMBROIDERY: "자수무료",
  };

  const now = new Date();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-[var(--font-mono)] text-[10px] text-[#555] tracking-[2px] mb-1">ADMIN / COUPONS</div>
          <h1 className="text-xl font-black text-[#111]">쿠폰 관리</h1>
        </div>
        <button className="bg-[#c8161d] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#9c0e15] transition-colors">
          + 쿠폰 생성
        </button>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a]">
        <div className="grid font-[var(--font-mono)] text-[10px] text-[#555] tracking-[0.5px] px-5 py-3 bg-[#111] border-b border-[#2a2a2a]"
          style={{ gridTemplateColumns: "160px 1fr 100px 120px 80px 100px 80px" }}>
          <div>코드</div><div>쿠폰명</div><div>할인</div><div>유효기간</div><div>발급수</div><div>사용수</div><div>상태</div>
        </div>
        {coupons.map((c) => {
          const isExpired = new Date(c.validUntil) < now;
          const usageRate = c.usageLimit ? Math.round((c.usedCount / c.usageLimit) * 100) : null;

          return (
            <div key={c.id} className="grid items-center px-5 py-3.5 border-b border-[#222] hover:bg-[#1f1f1f] text-sm"
              style={{ gridTemplateColumns: "160px 1fr 100px 120px 80px 100px 80px" }}>
              <div className="font-[var(--font-mono)] text-[11px] text-[#c8161d]">{c.code}</div>
              <div className="text-[#ddd] font-semibold truncate pr-4">{c.name}</div>
              <div className="font-bold text-white">
                {c.discountValue.toLocaleString()}{DISCOUNT_LABELS[c.discountType]}
              </div>
              <div className="font-[var(--font-mono)] text-[10px] text-[#666]">
                ~{new Date(c.validUntil).toLocaleDateString("ko-KR")}
              </div>
              <div className="font-[var(--font-display)] text-base text-white">{c._count.memberCoupons}</div>
              <div>
                <div className="font-[var(--font-display)] text-base text-white">{c.usedCount}</div>
                {usageRate !== null && (
                  <div className="font-[var(--font-mono)] text-[9px] text-[#555]">{usageRate}%</div>
                )}
              </div>
              <div>
                <span className={`font-[var(--font-mono)] text-[10px] px-2 py-0.5 font-bold ${
                  !c.isActive || isExpired ? "text-[#444] bg-[#1a1a1a]" : "text-green-400 bg-green-900/30"
                }`}>
                  {isExpired ? "만료" : c.isActive ? "활성" : "비활성"}
                </span>
              </div>
            </div>
          );
        })}
        {coupons.length === 0 && (
          <div className="px-5 py-12 text-center text-[#444] text-sm">쿠폰이 없습니다.</div>
        )}
      </div>
    </div>
  );
}
