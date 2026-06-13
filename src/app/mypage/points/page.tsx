import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata = { title: "적립금 내역 | 마이페이지" };

const TYPE_LABELS: Record<string, string> = {
  EARN_SIGNUP:   "신규 가입 적립",
  EARN_PURCHASE: "구매 적립",
  EARN_REVIEW:   "리뷰 적립",
  EARN_BIRTHDAY: "생일 적립",
  EARN_EVENT:    "이벤트 적립",
  USE_PURCHASE:  "구매 사용",
  EXPIRE:        "만료",
  ADMIN_ADJUST:  "관리자 조정",
};

export default async function PointsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [member, history] = await Promise.all([
    prisma.member.findUnique({
      where: { id: session.user.id as string },
      select: { points: true },
    }),
    prisma.pointHistory.findMany({
      where: { memberId: session.user.id as string },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black">적립금 내역</h2>
      </div>

      {/* 적립금 잔액 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="border border-[var(--line)] bg-white p-5">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--red)] tracking-[1.5px] mb-2">AVAILABLE POINTS</div>
          <div className="font-[var(--font-display)] text-[42px] text-[var(--black)] leading-none mb-1">
            {(member?.points ?? 0).toLocaleString()}
          </div>
          <div className="text-xs text-[var(--gray-500)] font-[var(--font-mono)]">포인트 사용 가능</div>
        </div>
        <div className="border border-[var(--line)] bg-[var(--gray-50)] p-5">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] tracking-[1.5px] mb-3">POINT POLICY</div>
          {[
            ["사용 가능 단위", "1,000P 이상"],
            ["사용 한도", "결제 금액의 50%"],
            ["유효 기간", "적립일로부터 1년"],
            ["적립 시점", "구매 확정 후"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-xs mb-1.5">
              <span className="text-[var(--gray-500)]">{label}</span>
              <span className="font-semibold">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 내역 */}
      <div className="border border-[var(--line)] bg-white">
        <div className="px-5 py-3.5 bg-[var(--gray-50)] border-b border-[var(--line)]">
          <span className="font-[var(--font-mono)] text-[11px] font-bold tracking-[1px]">HISTORY</span>
        </div>
        {history.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--gray-400)]">적립금 내역이 없습니다.</div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <div className="text-sm font-semibold">{h.reason}</div>
                  <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] mt-0.5">
                    {TYPE_LABELS[h.type] ?? h.type} · {new Date(h.createdAt).toLocaleDateString("ko-KR")}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-[var(--font-display)] text-lg font-bold ${h.amount >= 0 ? "text-[var(--red)]" : "text-[var(--gray-700)]"}`}>
                    {h.amount >= 0 ? "+" : ""}{h.amount.toLocaleString()}P
                  </div>
                  <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-400)]">
                    잔액 {h.balance.toLocaleString()}P
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
