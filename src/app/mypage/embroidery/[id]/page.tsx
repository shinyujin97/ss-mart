import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { EMBROIDERY_TYPES, POSITION_LABELS, SIZE_LABELS } from "@/constants/embroidery";
import DesignProgress from "../DesignProgress";
import DraftActions from "./DraftActions";
import DraftReviewActions from "./DraftReviewActions";
import QuoteActions from "./QuoteActions";
import DraftViewer from "./DraftViewer";

const SIZE_CM: Record<string, string> = {
  SMALL:   "가로 5CM × 세로 5CM",
  MEDIUM:  "가로 8CM × 세로 8CM",
  LARGE:   "가로 10CM × 세로 10CM",
  XLARGE:  "가로 15CM × 세로 15CM",
  XXLARGE: "가로 20CM × 세로 20CM",
};

const POSITION_COORDS: Record<string, { x: number; y: number }> = {
  LEFT_CHEST:   { x: 148, y: 165 },
  RIGHT_CHEST:  { x: 252, y: 165 },
  BACK_CENTER:  { x: 200, y: 290 },
  BACK_TOP:     { x: 200, y: 165 },
  LEFT_SLEEVE:  { x: 64,  y: 210 },
  RIGHT_SLEEVE: { x: 336, y: 210 },
  MULTIPLE:     { x: 200, y: 210 },
};

const SIZE_DIMS: Record<string, { w: number; h: number }> = {
  SMALL:   { w: 44,  h: 30  },
  MEDIUM:  { w: 70,  h: 48  },
  LARGE:   { w: 88,  h: 60  },
  XLARGE:  { w: 130, h: 88  },
  XXLARGE: { w: 172, h: 116 },
};

export default async function EmbroideryDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const design = await prisma.embroideryDesign.findUnique({
    where: { id },
    include: {
      member: { select: { name: true } },
      draftImages: { orderBy: { revisionNo: "asc" } },
    },
    // quotePrice, quoteMessage 포함 (findUnique는 기본적으로 모든 scalar 포함)
  });

  if (!design) notFound();
  if (design.memberId !== session.user.id) notFound();

  const savedAddresses = await prisma.address.findMany({
    where: { memberId: session.user.id as string },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    select: {
      id: true, label: true, isDefault: true,
      recipientName: true, recipientPhone: true,
      zipCode: true, address: true, addressDetail: true,
    },
  });

  const typeName = EMBROIDERY_TYPES[design.embroideryType as keyof typeof EMBROIDERY_TYPES]?.name ?? design.embroideryType;
  const posLabel = POSITION_LABELS[design.position as keyof typeof POSITION_LABELS] ?? design.position;
  const sizeLabel = SIZE_CM[design.size] ?? SIZE_LABELS[design.size as keyof typeof SIZE_LABELS] ?? design.size;

  // customPositions 우선 사용 (시뮬레이터에서 드래그한 위치), 없으면 기본 좌표
  const savedPositions = design.customPositions as Record<string, { x: number; y: number }> | null;
  const defaultCoords = POSITION_COORDS[design.position] ?? { x: 200, y: 220 };
  const coords = savedPositions?.[design.position] ?? defaultCoords;
  const { w: W, h: H } = SIZE_DIMS[design.size] ?? SIZE_DIMS.MEDIUM;
  const { x, y } = coords;
  const isBackPosition = ["BACK_CENTER", "BACK_TOP"].includes(design.position);

  // 시안 순번 (1차, 2차...)
  const revisionLabel = design.revisionCount > 0 ? `${design.revisionCount + 1}차` : "1차";

  return (
    <div className="max-w-[720px] mx-auto">

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/mypage/embroidery"
          className="font-[var(--font-mono)] text-[11px] text-[var(--gray-500)] hover:text-[var(--red)] transition-colors">
          ← 시안 보관함
        </Link>
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-400)]">{design.designNumber}</div>
      </div>

      {/* 시안 박스 */}
      <div className="border-2 border-[#c8161d] bg-white">

        {/* 타이틀 */}
        <div className="bg-white px-5 py-3 border-b border-[#e0e0e0]">
          <div className="text-sm font-black text-[#111]">
            [{design.member?.name ?? "고객"}님] {revisionLabel} 시안
          </div>
        </div>

        {/* 자수위치 / 디테일 탭 (클라이언트 컴포넌트) */}
        <DraftViewer
          shirtPreview={
            <div className="flex items-center justify-center bg-[#f8f8f8] py-6">
              <div className="text-center mb-2">
                <span className="font-[var(--font-mono)] text-[10px] text-[#999]">
                  {isBackPosition ? "뒷면" : "앞면"} · {posLabel}
                </span>
              </div>
              <svg viewBox="0 0 400 500" className="w-full max-w-[260px]"
                style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.1))" }}>
                <defs>
                  <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f0f0f0" />
                  </linearGradient>
                </defs>
                {/* 셔츠 - 앞/뒷면 구분 */}
                <path d="M 88 88 L 18 145 L 22 155 L 45 165 L 90 165 Z" fill="url(#sg)" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
                <path d="M 312 88 L 382 145 L 378 155 L 355 165 L 310 165 Z" fill="url(#sg)" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
                <path d="M 88 88 L 45 165 L 45 440 L 355 440 L 355 165 L 312 88 L 260 66 C 248 110 152 110 140 66 Z" fill="url(#sg)" stroke="rgba(0,0,0,0.12)" strokeWidth="1.5" />
                {!isBackPosition && (
                  <path d="M 140 66 C 152 110 248 110 260 66" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                )}
                {isBackPosition && (
                  <text x="200" y="460" textAnchor="middle" fill="rgba(0,0,0,0.07)" fontSize="13" fontFamily="monospace" letterSpacing="4">BACK</text>
                )}
                {/* 디자인 (테두리 없이 이미지만) */}
                {design.textContent && (
                  <text x={x} y={y+5} textAnchor="middle" fill="#111"
                    fontSize={Math.max(9, Math.min(14, W/7))} fontWeight="bold" fontFamily="monospace">
                    {design.textContent.slice(0, 10)}
                  </text>
                )}
                {!design.textContent && (design.logoImageUrl ?? design.designImageUrl) && (
                  <image href={design.logoImageUrl ?? design.designImageUrl ?? ""}
                    x={x-W/2} y={y-H/2} width={W} height={H}
                    preserveAspectRatio="xMidYMid meet" />
                )}
              </svg>
            </div>
          }
        />

        {/* 구분선 */}
        <div className="border-b border-[#e0e0e0]" />

        {/* 견적 확인 */}
        {design.status === "QUOTE_SENT" && design.quotePrice && (
          <QuoteActions
            designId={design.id}
            quotePrice={design.quotePrice}
            quoteColorCount={design.quoteColorCount ?? null}
            quoteDeliveryDays={design.quoteDeliveryDays ?? null}
            quoteMessage={design.quoteMessage ?? null}
            originalPrice={design.totalPrice}
            typeName={typeName}
            posLabel={posLabel}
            sizeLabel={SIZE_LABELS[design.size as keyof typeof SIZE_LABELS] ?? design.size}
            sizeCm={SIZE_CM[design.size] ?? ""}
            quantity={design.quantity}
            savedAddresses={savedAddresses}
          />
        )}

        {/* 견적 승인/거절 결과 표시 */}
        {(design.status === "QUOTE_APPROVED" || design.status === "QUOTE_REJECTED") && design.quotePrice && (
          <div className={`px-5 py-4 border-b border-[#e0e0e0] ${design.status === "QUOTE_APPROVED" ? "bg-green-50" : "bg-[#f4f4f4]"}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`font-[var(--font-mono)] text-[11px] font-bold ${design.status === "QUOTE_APPROVED" ? "text-green-700" : "text-[#888]"}`}>
                  {design.status === "QUOTE_APPROVED" ? "✓ 견적 승인 완료" : "견적 거절됨"}
                </div>
                <div className="font-[var(--font-display)] text-lg text-[#111] mt-0.5">
                  {design.quotePrice.toLocaleString()}원
                </div>
              </div>
              {design.status === "QUOTE_APPROVED" && (
                <span className="font-[var(--font-mono)] text-[10px] text-green-700 bg-green-100 px-2 py-1">담당자 배정 대기</span>
              )}
            </div>
          </div>
        )}

        {/* 관리자 시안 이미지 */}
        {design.draftImages.length > 0 && (
          <div className="border-b border-[#e0e0e0]">
            {design.draftImages.map((draft, idx) => {
              const isLatest = draft.revisionNo === design.draftImages.length;
              return (
                <div key={draft.id} className="border-b border-[#f0f0f0] last:border-b-0">
                  {/* 시안 헤더 */}
                  <div className={`flex items-center justify-between px-5 py-3 ${isLatest ? "bg-[#c8161d]" : "bg-[#f4f4f4]"}`}>
                    <div className={`font-[var(--font-mono)] text-[11px] font-bold ${isLatest ? "text-white" : "text-[#888]"}`}>
                      {draft.revisionNo}차 시안
                      {isLatest && <span className="ml-2 text-[10px] font-normal opacity-80">최신</span>}
                    </div>
                    <div className={`font-[var(--font-mono)] text-[10px] ${isLatest ? "text-white/60" : "text-[#bbb]"}`}>
                      {new Date(draft.createdAt).toLocaleDateString("ko-KR")}
                    </div>
                  </div>
                  {/* 시안 이미지 */}
                  <div className="bg-[#fafafa] flex items-center justify-center p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={draft.imageUrl} alt={`${draft.revisionNo}차 시안`} className="max-w-full max-h-[320px] object-contain" />
                  </div>
                  {/* 관리자 메시지 */}
                  {draft.message && (
                    <div className="px-5 py-3 bg-blue-50 border-t border-blue-100">
                      <div className="font-[var(--font-mono)] text-[10px] text-blue-400 mb-1">관리자 메시지</div>
                      <p className="text-sm text-[#333] leading-relaxed">{draft.message}</p>
                    </div>
                  )}
                  {/* CUSTOMER_REVIEW 상태일 때 확정/수정요청 버튼
                      - 시안이 1개: 최신 시안에만 표시 (수정요청 + 확정)
                      - 시안이 2개 이상: 모든 시안에 표시 (해당 차수로 확정) */}
                  {design.status === "CUSTOMER_REVIEW" && (isLatest || design.draftImages.length >= 2) && (
                    <DraftReviewActions
                      designId={design.id}
                      revisionNo={draft.revisionNo}
                      totalDrafts={design.draftImages.length}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 진행 상태 */}
        <DesignProgress status={design.status} />

        {/* 하단 버튼 */}
        <DraftActions
          designId={design.id}
          canRequest={design.status === "DRAFT"}
        />
      </div>

      {/* 안내 */}
      <div className="mt-4 text-xs text-[var(--gray-500)] leading-relaxed text-center font-[var(--font-mono)]">
        시안 확인 후 수정이 필요하시면 [수정 요청하기]를 클릭해 주세요.
        <br />
        시안 확정 후에는 단순 변심 환불이 어렵습니다.
      </div>
    </div>
  );
}
