import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EMBROIDERY_TYPES, POSITION_LABELS, SIZE_LABELS } from "@/constants/embroidery";
import { STATUS_LABELS } from "@/lib/embroidery/status";
import StatusUpdater from "./StatusUpdater";

export const metadata = { title: "자수 시안 상세" };

const POSITION_VIEW: Record<string, "front" | "back"> = {
  LEFT_CHEST: "front", RIGHT_CHEST: "front",
  LEFT_SLEEVE: "front", RIGHT_SLEEVE: "front",
  BACK_CENTER: "back", BACK_TOP: "back", MULTIPLE: "front",
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

export default async function EmbroideryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const design = await prisma.embroideryDesign.findUnique({
    where: { id },
    include: { member: { select: { name: true, loginId: true, phone: true, email: true } } },
  });

  if (!design) notFound();

  const view = POSITION_VIEW[design.position] ?? "front";
  const isFront = view === "front";
  const coords = POSITION_COORDS[design.position] ?? { x: 200, y: 220 };
  const { w: W, h: H } = SIZE_DIMS[design.size] ?? SIZE_DIMS.MEDIUM;
  const { x, y } = coords;

  const typeName = EMBROIDERY_TYPES[design.embroideryType as keyof typeof EMBROIDERY_TYPES]?.name ?? design.embroideryType;
  const posLabel = POSITION_LABELS[design.position as keyof typeof POSITION_LABELS] ?? design.position;
  const sizeLabel = SIZE_LABELS[design.size as keyof typeof SIZE_LABELS] ?? design.size;

  const SIZE_CM: Record<string, string> = {
    SMALL: "가로 5cm × 세로 5cm", MEDIUM: "가로 8cm × 세로 8cm",
    LARGE: "가로 10cm × 세로 10cm", XLARGE: "가로 15cm × 세로 15cm",
    XXLARGE: "가로 20cm × 세로 20cm",
  };
  const sizeCm = SIZE_CM[design.size] ?? "";

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <div className="font-[var(--font-mono)] text-[10px] text-[#555] tracking-[2px] mb-1">
            <Link href="/admin/embroidery" className="hover:text-[#c8161d] transition-colors">ADMIN / EMBROIDERY</Link>
            {" / "}{design.designNumber}
          </div>
          <h1 className="text-xl font-black text-[#111]">{typeName} 자수 시안</h1>
        </div>
        <Link href="/admin/embroidery"
          className="border border-[#2a2a2a] text-[#555] px-4 py-2 text-xs font-[var(--font-mono)] hover:border-[#c8161d]/50 hover:text-[#aaa] transition-colors">
          ← 목록
        </Link>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-5">

        {/* 좌측: 시안 미리보기 + 상세 */}
        <div className="space-y-4">

          {/* 시안 미리보기 */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a]">
            <div className="font-[var(--font-mono)] text-[10px] text-[#555] tracking-[1.5px] px-5 py-3 border-b border-[#2a2a2a] flex items-center justify-between">
              <span>시안 미리보기</span>
              <span className="text-[#444]">{isFront ? "정면" : "뒷면"}</span>
            </div>
            <div className="p-10 flex items-center justify-center bg-[#111]">
              <div className="w-full max-w-[300px]" style={{ filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.8))" }}>
                <svg viewBox="0 0 400 500" className="w-full">
                  <defs>
                    <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#f0f0f0" />
                    </linearGradient>
                  </defs>
                  <path d="M 88 88 L 18 145 L 22 155 L 45 165 L 90 165 Z" fill="url(#sg)" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                  <path d="M 312 88 L 382 145 L 378 155 L 355 165 L 310 165 Z" fill="url(#sg)" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                  <path d="M 88 88 L 45 165 L 45 440 L 355 440 L 355 165 L 312 88 L 260 66 C 248 110 152 110 140 66 Z" fill="url(#sg)" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                  <path d="M 140 66 C 152 110 248 110 260 66" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
                  {!isFront && (
                    <text x="200" y="120" textAnchor="middle" fill="rgba(0,0,0,0.1)" fontSize="11" fontFamily="monospace" letterSpacing="2">BACK</text>
                  )}
                  <rect x={x - W/2} y={y - H/2} width={W} height={H}
                    fill="rgba(200,22,29,0.08)" stroke="#c8161d" strokeWidth="2" />
                  {([[x-W/2,y-H/2],[x+W/2,y-H/2],[x-W/2,y+H/2],[x+W/2,y+H/2]] as [number,number][]).map(([hx,hy],i) => (
                    <rect key={i} x={hx-4} y={hy-4} width={8} height={8} fill="#c8161d" />
                  ))}
                  {design.textContent && (
                    <text x={x} y={y + 5} textAnchor="middle" fill="#111"
                      fontSize={Math.max(9, Math.min(14, W / 7))} fontWeight="bold" fontFamily="monospace">
                      {design.textContent.slice(0, 14)}
                    </text>
                  )}
                  {!design.textContent && (design.logoImageUrl ?? design.designImageUrl) && (
                    <image
                      href={design.logoImageUrl ?? design.designImageUrl ?? ""}
                      x={x - W/2 + 4} y={y - H/2 + 4} width={W - 8} height={H - 8}
                      preserveAspectRatio="xMidYMid meet"
                    />
                  )}
                  {!design.textContent && !design.logoImageUrl && !design.designImageUrl && (
                    <text x={x} y={y + 4} textAnchor="middle" fill="#c8161d" fontSize="9" fontFamily="monospace">
                      이미지 자수
                    </text>
                  )}
                  <text x={x} y={y + H/2 + 16} textAnchor="middle" fill="#c8161d" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    {posLabel}
                  </text>
                </svg>
              </div>
            </div>
          </div>

          {/* 업로드된 이미지 원본 */}
          {(design.logoImageUrl ?? design.designImageUrl) && (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a]">
              <div className="font-[var(--font-mono)] text-[10px] text-[#555] tracking-[1.5px] px-5 py-3 border-b border-[#2a2a2a]">
                고객 업로드 원본 이미지
              </div>
              <div className="p-5 flex items-center justify-center bg-[#111]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={design.logoImageUrl ?? design.designImageUrl ?? ""}
                  alt="고객 업로드 디자인"
                  className="max-w-full max-h-[200px] object-contain"
                />
              </div>
            </div>
          )}

          {/* 시안 상세 정보 */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a]">
            <div className="font-[var(--font-mono)] text-[10px] text-[#555] tracking-[1.5px] px-5 py-3 border-b border-[#2a2a2a]">
              시안 정보
            </div>
            <div className="grid grid-cols-3 divide-x divide-[#2a2a2a]">
              {[
                { label: "자수 종류", value: typeName },
                { label: "위치",     value: posLabel },
                { label: "크기",     value: sizeLabel },
                { label: "수량",     value: `${design.quantity}벌` },
                { label: "단가",     value: `${design.unitPrice.toLocaleString()}원` },
                { label: "합계",     value: `${design.totalPrice.toLocaleString()}원` },
              ].map((item) => (
                <div key={item.label} className="px-5 py-4 border-b border-[#2a2a2a] last:border-b-0">
                  <div className="font-[var(--font-mono)] text-[10px] text-[#555] mb-1">{item.label}</div>
                  <div className="text-sm font-bold text-white">{item.value}</div>
                </div>
              ))}
            </div>
            {design.textContent && (
              <div className="px-5 py-4 border-t border-[#2a2a2a]">
                <div className="font-[var(--font-mono)] text-[10px] text-[#555] mb-1">텍스트 내용</div>
                <div className="text-sm text-[#aaa] font-[var(--font-mono)]">"{design.textContent}"</div>
              </div>
            )}
            {design.notes && (
              <div className="px-5 py-4 border-t border-[#2a2a2a]">
                <div className="font-[var(--font-mono)] text-[10px] text-[#555] mb-1">고객 요청사항</div>
                <div className="text-sm text-[#aaa] leading-relaxed whitespace-pre-wrap">{design.notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* 우측: 고객 정보 + 상태 관리 */}
        <div className="space-y-4">

          {/* 고객 정보 */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a]">
            <div className="font-[var(--font-mono)] text-[10px] text-[#555] tracking-[1.5px] px-5 py-3 border-b border-[#2a2a2a]">
              고객 정보
            </div>
            <div className="px-5 py-4 space-y-3">
              {design.member ? (
                <>
                  <div>
                    <div className="font-[var(--font-mono)] text-[10px] text-[#555] mb-0.5">이름</div>
                    <div className="text-sm font-bold text-white">{design.member.name}</div>
                  </div>
                  <div>
                    <div className="font-[var(--font-mono)] text-[10px] text-[#555] mb-0.5">아이디</div>
                    <div className="text-sm text-[#aaa] font-[var(--font-mono)]">@{design.member.loginId}</div>
                  </div>
                  {design.member.phone && (
                    <div>
                      <div className="font-[var(--font-mono)] text-[10px] text-[#555] mb-0.5">연락처</div>
                      <div className="text-sm text-[#aaa] font-[var(--font-mono)]">{design.member.phone}</div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-[#555]">비회원 신청</div>
              )}
              <div>
                <div className="font-[var(--font-mono)] text-[10px] text-[#555] mb-0.5">신청일시</div>
                <div className="text-sm text-[#444] font-[var(--font-mono)]">
                  {new Date(design.createdAt).toLocaleString("ko-KR")}
                </div>
              </div>
            </div>
          </div>

          {/* 배송지 */}
          {design.shippingAddress && (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a]">
              <div className="font-[var(--font-mono)] text-[10px] text-[#555] tracking-[1.5px] px-5 py-3 border-b border-[#2a2a2a]">
                배송지
              </div>
              <div className="px-5 py-4 space-y-2">
                <div>
                  <div className="font-[var(--font-mono)] text-[10px] text-[#555] mb-0.5">받는 분</div>
                  <div className="text-sm font-bold text-white">{design.shippingName}</div>
                </div>
                <div>
                  <div className="font-[var(--font-mono)] text-[10px] text-[#555] mb-0.5">연락처</div>
                  <div className="text-sm text-[#aaa] font-[var(--font-mono)]">{design.shippingPhone}</div>
                </div>
                <div>
                  <div className="font-[var(--font-mono)] text-[10px] text-[#555] mb-0.5">주소</div>
                  <div className="text-sm text-[#aaa] leading-relaxed">
                    [{design.shippingZipCode}] {design.shippingAddress}
                    {design.shippingAddressDetail && ` ${design.shippingAddressDetail}`}
                  </div>
                </div>
                {design.shippingRequest && (
                  <div>
                    <div className="font-[var(--font-mono)] text-[10px] text-[#555] mb-0.5">배송 요청사항</div>
                    <div className="text-sm text-[#aaa] leading-relaxed">{design.shippingRequest}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 상태 관리 */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a]">
            <div className="font-[var(--font-mono)] text-[10px] text-[#555] tracking-[1.5px] px-5 py-3 border-b border-[#2a2a2a]">
              상태 관리
            </div>
            <div className="px-5 py-4">
              <StatusUpdater
                id={design.id}
                currentStatus={design.status}
                currentNotes={design.notes}
                currentQuotePrice={design.quotePrice}
                currentQuoteColorCount={design.quoteColorCount}
                currentQuoteDeliveryDays={design.quoteDeliveryDays}
                designSpec={{
                  typeName,
                  posLabel,
                  sizeLabel,
                  sizeCm,
                  quantity: design.quantity,
                  estimatedPrice: design.totalPrice,
                  type: design.embroideryType as any,
                  size: design.size as any,
                  positions: [design.position as any],
                }}
              />
            </div>
          </div>

          {/* 진행 이력 */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a]">
            <div className="font-[var(--font-mono)] text-[10px] text-[#555] tracking-[1.5px] px-5 py-3 border-b border-[#2a2a2a]">
              진행 이력
            </div>
            <div className="px-5 py-4 space-y-2">
              {[
                { label: "신청",      date: design.createdAt },
                { label: "검토 시작", date: design.reviewedAt },
                { label: "시안 확정", date: design.confirmedAt },
                { label: "제작 시작", date: design.productionStartedAt },
                { label: "작업 완료", date: design.completedAt },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="font-[var(--font-mono)] text-[10px] text-[#555]">{item.label}</span>
                  <span className={`font-[var(--font-mono)] text-[10px] ${item.date ? "text-[#aaa]" : "text-[#333]"}`}>
                    {item.date ? new Date(item.date).toLocaleDateString("ko-KR") : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
