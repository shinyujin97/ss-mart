import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { STATUS_LABELS } from "@/lib/embroidery/status";
import { EMBROIDERY_TYPES } from "@/constants/embroidery";
import EmbroideryPreview from "../EmbroideryPreview";
import DesignProgress from "../DesignProgress";

export const metadata = { title: "자수 신청현황 | 마이페이지" };

const STATUS_BADGE: Record<string, string> = {
  REVIEW_PENDING:     "bg-yellow-50 text-yellow-700",
  REVIEW_IN_PROGRESS: "bg-blue-50 text-blue-700",
  CUSTOMER_REVIEW:    "bg-indigo-50 text-indigo-700",
  REVISION_REQUESTED: "bg-orange-50 text-orange-700",
  CONFIRMED:          "bg-green-50 text-green-700",
  IN_PRODUCTION:      "bg-orange-100 text-orange-800",
  COMPLETED:          "bg-green-100 text-green-800",
  CANCELLED:          "bg-[var(--gray-100)] text-[var(--gray-500)]",
  REJECTED:           "bg-red-50 text-[var(--red)]",
};

export default async function EmbroideryRequestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const designs = await prisma.embroideryDesign.findMany({
    where: {
      memberId: session.user.id as string,
      status: { not: "DRAFT" },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black">자수 신청현황</h2>
        <Link
          href="/mypage/embroidery"
          className="font-[var(--font-mono)] text-[11px] text-[var(--gray-500)] hover:text-[var(--red)] transition-colors"
        >
          ← 시안 보관함
        </Link>
      </div>

      {designs.length === 0 ? (
        <div className="border border-[var(--line)] bg-white py-20 text-center">
          <div className="font-[var(--font-display)] text-[60px] text-[var(--gray-100)] leading-none mb-4">EMPTY</div>
          <p className="text-sm text-[var(--gray-500)] mb-5">신청된 자수 시안이 없습니다.</p>
          <Link
            href="/mypage/embroidery"
            className="inline-block border border-[#111] text-[#111] px-6 py-3 text-sm font-bold hover:bg-[#111] hover:text-white transition-colors"
          >
            시안 보관함으로 이동 →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {designs.map((d) => (
            <Link
              key={d.id}
              href={`/mypage/embroidery/${d.id}`}
              className="block border border-[var(--line)] bg-white hover:border-[var(--red)] transition-colors"
            >
              <EmbroideryPreview
                position={d.position}
                size={d.size}
                text={d.textContent}
                imageUrl={d.logoImageUrl ?? d.designImageUrl}
              />
              <div className="p-4">
                <div className="font-[var(--font-mono)] text-[9px] text-[var(--gray-400)] mb-1">{d.designNumber}</div>
                <div className="text-sm font-bold mb-2">
                  {EMBROIDERY_TYPES[d.embroideryType as keyof typeof EMBROIDERY_TYPES]?.name ?? d.embroideryType}
                </div>
                <div className="flex items-center mb-3">
                  <span
                    className={`font-[var(--font-mono)] text-[10px] px-2 py-0.5 font-bold ${
                      STATUS_BADGE[d.status] ?? "bg-[var(--gray-100)] text-[var(--gray-600)]"
                    }`}
                  >
                    {STATUS_LABELS[d.status as keyof typeof STATUS_LABELS] ?? d.status}
                  </span>
                </div>
                {d.textContent && (
                  <div className="text-xs text-[var(--gray-600)] mb-2 font-[var(--font-mono)] truncate">
                    &quot;{d.textContent}&quot;
                  </div>
                )}
              </div>
              <DesignProgress status={d.status} />
              <div className="px-4 py-3 border-t border-[var(--line)]">
                <div className="font-[var(--font-mono)] text-[9px] text-[var(--gray-400)]">
                  신청일: {new Date(d.createdAt).toLocaleDateString("ko-KR")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
