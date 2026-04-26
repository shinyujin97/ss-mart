import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { STATUS_LABELS } from "@/lib/embroidery/status";
import { EMBROIDERY_TYPES } from "@/constants/embroidery";

export const metadata = { title: "자수 시안 보관함 | 마이페이지" };

export default async function EmbroideryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const designs = await prisma.embroideryDesign.findMany({
    where: { memberId: session.user.id as string },
    orderBy: { createdAt: "desc" },
  });

  const STATUS_BADGE: Record<string, string> = {
    DRAFT: "bg-[var(--gray-100)] text-[var(--gray-600)]",
    REVIEW_PENDING: "bg-yellow-50 text-yellow-700",
    CUSTOMER_REVIEW: "bg-blue-50 text-blue-700",
    CONFIRMED: "bg-green-50 text-green-700",
    IN_PRODUCTION: "bg-orange-50 text-orange-700",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-[var(--gray-100)] text-[var(--gray-500)]",
    REJECTED: "bg-red-50 text-[var(--red)]",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black">자수 시안 보관함</h2>
        <Link href="/embroidery/simulator" className="bg-[var(--red)] text-white px-4 py-2 text-xs font-bold hover:bg-[var(--red-dark)] transition-colors">
          + 새 시안 만들기
        </Link>
      </div>

      {designs.length === 0 ? (
        <div className="border border-[var(--line)] bg-white py-20 text-center">
          <div className="font-[var(--font-display)] text-[60px] text-[var(--gray-100)] leading-none mb-4">EMPTY</div>
          <p className="text-sm text-[var(--gray-500)] mb-5">저장된 자수 시안이 없습니다.</p>
          <Link href="/embroidery/simulator" className="inline-block bg-[var(--red)] text-white px-6 py-3 text-sm font-bold hover:bg-[var(--red-dark)]">
            시뮬레이터로 시안 만들기 →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {designs.map((d) => (
            <div key={d.id} className="border border-[var(--line)] bg-white hover:border-[var(--red)] transition-colors">
              {/* 미리보기 영역 */}
              <div className="aspect-square bg-[var(--gray-50)] flex items-center justify-center border-b border-[var(--line)]">
                <div className="text-center">
                  <div className="font-[var(--font-display)] text-[50px] text-[var(--gray-200)] leading-none">{d.embroideryType.slice(0, 2)}</div>
                  <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-400)] mt-1">{d.position}</div>
                </div>
              </div>
              {/* 정보 */}
              <div className="p-4">
                <div className="font-[var(--font-mono)] text-[9px] text-[var(--gray-400)] mb-1">{d.designNumber}</div>
                <div className="text-sm font-bold mb-2">
                  {EMBROIDERY_TYPES[d.embroideryType as keyof typeof EMBROIDERY_TYPES]?.name ?? d.embroideryType}
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-[var(--font-mono)] text-[10px] px-2 py-0.5 font-bold ${STATUS_BADGE[d.status] ?? "bg-[var(--gray-100)] text-[var(--gray-600)]"}`}>
                    {STATUS_LABELS[d.status as keyof typeof STATUS_LABELS] ?? d.status}
                  </span>
                  <span className="font-[var(--font-display)] text-base text-[var(--red)]">{d.totalPrice.toLocaleString()}원</span>
                </div>
                {d.textContent && (
                  <div className="text-xs text-[var(--gray-600)] mb-2 font-[var(--font-mono)] truncate">"{d.textContent}"</div>
                )}
                <div className="flex gap-1.5">
                  <button className="flex-1 text-[10px] py-2 border border-[var(--line)] font-[var(--font-mono)] hover:border-[var(--black)] transition-colors font-bold">
                    수정 요청
                  </button>
                  <button className="flex-1 text-[10px] py-2 border border-[var(--line)] font-[var(--font-mono)] hover:border-[var(--black)] transition-colors">
                    재구매
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
