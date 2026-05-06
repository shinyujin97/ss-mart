import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { STATUS_LABELS } from "@/lib/embroidery/status";
import { EMBROIDERY_TYPES } from "@/constants/embroidery";
import DeleteDesignButton from "./DeleteDesignButton";
import EmbroideryPreview from "./EmbroideryPreview";
import DesignProgress from "./DesignProgress";

export const metadata = { title: "자수 시안 보관함 (임시저장) | 마이페이지" };

export default async function EmbroideryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if ((session.user as any).role === "ADMIN") redirect("/admin/embroidery");

  const designs = await prisma.embroideryDesign.findMany({
    where: {
      memberId: session.user.id as string,
      status: "DRAFT",
    },
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
        <a href="tel:031-430-0497" className="bg-[var(--red)] text-white px-4 py-2 text-xs font-bold hover:bg-[var(--red-dark)] transition-colors">
          자수 문의 031-430-0497
        </a>
      </div>

      {designs.length === 0 ? (
        <div className="border border-[var(--line)] bg-white py-20 text-center">
          <div className="font-[var(--font-display)] text-[60px] text-[var(--gray-100)] leading-none mb-4">EMPTY</div>
          <p className="text-sm text-[var(--gray-500)] mb-5">자수 시안이 없습니다.</p>
          <a href="tel:031-430-0497" className="inline-block bg-[var(--red)] text-white px-6 py-3 text-sm font-bold hover:bg-[var(--red-dark)]">
            전화로 자수 문의하기 031-430-0497 →
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {designs.map((d) => (
            <div key={d.id} className="border border-[var(--line)] bg-white hover:border-[var(--red)] transition-colors">
              {/* 흰 티셔츠 미리보기 → 시안 확인 페이지로 이동 */}
              <Link href={`/mypage/embroidery/${d.id}`} className="block">
              <EmbroideryPreview
                position={d.position}
                size={d.size}
                text={d.textContent}
                imageUrl={d.logoImageUrl ?? d.designImageUrl}
                customPositions={d.customPositions as Record<string, { x: number; y: number }> | null}
              />
              </Link>
              {/* 정보 */}
              <div className="p-4">
                <div className="font-[var(--font-mono)] text-[9px] text-[var(--gray-400)] mb-1">{d.designNumber}</div>
                <div className="text-sm font-bold mb-2">
                  {EMBROIDERY_TYPES[d.embroideryType as keyof typeof EMBROIDERY_TYPES]?.name ?? d.embroideryType}
                </div>
                <div className="flex items-center mb-3">
                  <span className={`font-[var(--font-mono)] text-[10px] px-2 py-0.5 font-bold ${STATUS_BADGE[d.status] ?? "bg-[var(--gray-100)] text-[var(--gray-600)]"}`}>
                    {STATUS_LABELS[d.status as keyof typeof STATUS_LABELS] ?? d.status}
                  </span>
                </div>
                {d.textContent && (
                  <div className="text-xs text-[var(--gray-600)] mb-2 font-[var(--font-mono)] truncate">"{d.textContent}"</div>
                )}

                {/* 진행 상태 */}
              </div>
              <DesignProgress status={d.status} />
              <div className="p-4 pt-3">
                <div className="flex gap-1.5">
                  <a href="tel:031-430-0497"
                    className="flex-1 text-[10px] py-2 border border-[var(--red)] text-[var(--red)] font-[var(--font-mono)] hover:bg-[var(--red)] hover:text-white transition-colors text-center font-bold">
                    031-430-0497 문의
                  </a>
                  <DeleteDesignButton
                    id={d.id}
                    designNumber={d.designNumber}
                    disabled={["IN_PRODUCTION","COMPLETED"].includes(d.status)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
