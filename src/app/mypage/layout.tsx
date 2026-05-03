import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MypageSidebar from "./MypageSidebar";

export default async function MypageLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/mypage");

  const member = await prisma.member.findUnique({
    where: { id: session.user.id as string },
    select: {
      id: true, name: true, email: true, grade: true, type: true,
      points: true, totalOrders: true, createdAt: true,
      _count: {
        select: {
          coupons: { where: { usedAt: null } },
          wishlist: true,
          embroideryDesigns: { where: { status: "DRAFT" } },
          quoteRequests: true,
        },
      },
    },
  });

  const embroideryRequestsCount = await prisma.embroideryDesign.count({
    where: {
      memberId: session.user.id as string,
      status: { not: "DRAFT" },
    },
  });

  if (!member) redirect("/login");

  const GRADE_LABELS: Record<string, string> = {
    FAMILY: "FAMILY",
    FRIEND: "FRIEND",
    VIP: "★ VIP",
    VVIP: "★★ VVIP",
  };

  const GRADE_NEXT: Record<string, { label: string; amount: number }> = {
    FAMILY: { label: "FRIEND", amount: 300000 },
    FRIEND: { label: "VIP",    amount: 1000000 },
    VIP:    { label: "VVIP",   amount: 5000000 },
    VVIP:   { label: "VVIP",   amount: 0 },
  };

  const nextGrade = GRADE_NEXT[member.grade];
  const initial = member.name.charAt(0);

  return (
    <div className="bg-[var(--gray-50)] min-h-screen">
      {/* 유저 히어로 */}
      <section className="bg-[var(--black)] text-white">
        <div className="max-w-[1340px] mx-auto px-6 py-8">
          <div className="flex items-center gap-8">
            {/* 아바타 */}
            <div className="w-16 h-16 bg-[var(--red)] flex items-center justify-center text-2xl font-black flex-shrink-0">
              {initial}
            </div>

            {/* 정보 */}
            <div className="flex-1">
              <div className="font-[var(--font-mono)] text-[10px] text-white/40 tracking-[2px] mb-1.5">
                MY PAGE / DASHBOARD
              </div>
              <div className="flex items-center gap-3 mb-1.5">
                <span className="text-xl font-black">{member.name}님</span>
                <span className="font-[var(--font-mono)] text-[11px] px-2.5 py-1 bg-[var(--yellow)] text-[var(--black)] font-bold tracking-[1px]">
                  {GRADE_LABELS[member.grade] ?? member.grade}
                </span>
              </div>
              <div className="text-xs text-white/40 font-[var(--font-mono)] tracking-[0.5px]">
                가입일 {new Date(member.createdAt).toLocaleDateString("ko-KR")}
                <span className="mx-2 opacity-40">|</span>
                총 주문 {member.totalOrders}건
                {nextGrade.amount > 0 && (
                  <>
                    <span className="mx-2 opacity-40">|</span>
                    다음 등급까지 {nextGrade.amount.toLocaleString()}원
                  </>
                )}
              </div>
            </div>

            {/* 통계 */}
            <div className="flex gap-0 border-l border-[#333]">
              {[
                { label: "POINTS",   value: `${member.points.toLocaleString()}P`, sub: "사용 가능" },
                { label: "COUPONS",  value: `${member._count.coupons}장`,          sub: "보유 쿠폰" },
                { label: "WISHLIST", value: `${member._count.wishlist}`,            sub: "관심 상품" },
              ].map((s) => (
                <div key={s.label} className="px-8 py-2 border-r border-[#333] text-center">
                  <div className="font-[var(--font-mono)] text-[9px] text-white/40 tracking-[1px] mb-1">{s.label}</div>
                  <div className="font-[var(--font-display)] text-xl text-[var(--yellow)]">{s.value}</div>
                  <div className="text-[10px] text-white/40 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 메인 콘텐츠 */}
      <div className="max-w-[1340px] mx-auto px-6 py-6">
        <div className="grid grid-cols-[220px_1fr] gap-5 items-start">
          <MypageSidebar
            counts={{
              orders: member.totalOrders,
              coupons: member._count.coupons,
              wishlist: member._count.wishlist,
              embroidery: member._count.embroideryDesigns,
              embroideryRequests: embroideryRequestsCount,
              quotes: member._count.quoteRequests,
              points: member.points,
            }}
          />
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
