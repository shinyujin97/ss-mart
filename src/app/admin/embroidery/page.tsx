import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { STATUS_LABELS } from "@/lib/embroidery/status";
import { EMBROIDERY_TYPES, POSITION_LABELS, SIZE_LABELS } from "@/constants/embroidery";

export const metadata = { title: "자수 시안 요청" };

const STATUS_BADGE: Record<string, string> = {
  DRAFT:              "text-[#555] bg-[#222]",
  REVIEW_PENDING:     "text-[#ffd400] bg-yellow-900/30",
  REVIEW_IN_PROGRESS: "text-orange-300 bg-orange-900/30",
  CUSTOMER_REVIEW:    "text-blue-300 bg-blue-900/30",
  REVISION_REQUESTED: "text-orange-300 bg-orange-900/30",
  CONFIRMED:          "text-green-300 bg-green-900/30",
  IN_PRODUCTION:      "text-purple-300 bg-purple-900/30",
  COMPLETED:          "text-green-400 bg-green-900/20",
  CANCELLED:          "text-[#444] bg-[#1a1a1a]",
  REJECTED:           "text-[#c8161d] bg-[#c8161d]/10",
};

const POSITION_COORDS: Record<string, { x: number; y: number }> = {
  LEFT_CHEST:   { x: 148, y: 165 }, RIGHT_CHEST:  { x: 252, y: 165 },
  BACK_CENTER:  { x: 200, y: 290 }, BACK_TOP:     { x: 200, y: 165 },
  LEFT_SLEEVE:  { x: 64,  y: 210 }, RIGHT_SLEEVE: { x: 336, y: 210 },
  MULTIPLE:     { x: 200, y: 210 },
};
const SIZE_DIMS: Record<string, { w: number; h: number }> = {
  SMALL: {w:44,h:30}, MEDIUM: {w:70,h:48}, LARGE: {w:88,h:60},
  XLARGE: {w:130,h:88}, XXLARGE: {w:172,h:116},
};

function MiniPreview({ position, size, text, imageUrl }: {
  position: string; size: string; text: string | null; imageUrl: string | null;
}) {
  const coords = POSITION_COORDS[position] ?? { x: 200, y: 220 };
  const { w: W, h: H } = SIZE_DIMS[size] ?? SIZE_DIMS.MEDIUM;
  const { x, y } = coords;
  return (
    <svg viewBox="0 0 400 500" className="w-full h-full">
      <defs>
        <linearGradient id="msg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#f0f0f0" />
        </linearGradient>
      </defs>
      <path d="M 88 88 L 18 145 L 22 155 L 45 165 L 90 165 Z" fill="url(#msg)" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      <path d="M 312 88 L 382 145 L 378 155 L 355 165 L 310 165 Z" fill="url(#msg)" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      <path d="M 88 88 L 45 165 L 45 440 L 355 440 L 355 165 L 312 88 L 260 66 C 248 110 152 110 140 66 Z" fill="url(#msg)" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      <path d="M 140 66 C 152 110 248 110 260 66" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
      <rect x={x-W/2} y={y-H/2} width={W} height={H} fill="rgba(200,22,29,0.1)" stroke="#c8161d" strokeWidth="1.5" />
      {text && <text x={x} y={y+4} textAnchor="middle" fill="#111" fontSize={Math.max(7,Math.min(11,W/8))} fontWeight="bold" fontFamily="monospace">{text.slice(0,8)}</text>}
      {!text && imageUrl && <image href={imageUrl} x={x-W/2+3} y={y-H/2+3} width={W-6} height={H-6} preserveAspectRatio="xMidYMid meet" />}
    </svg>
  );
}

export default async function AdminEmbroideryPage() {
  await requireAdmin();

  const designs = await prisma.embroideryDesign.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { member: { select: { name: true, loginId: true } } },
  });

  const PRIORITY = ["REVIEW_PENDING", "REVIEW_IN_PROGRESS", "REVISION_REQUESTED"];
  const urgent = designs.filter((d) => PRIORITY.includes(d.status));
  const statusGroups = ["REVIEW_PENDING", "CUSTOMER_REVIEW", "REVISION_REQUESTED", "CONFIRMED", "IN_PRODUCTION", "COMPLETED"];

  return (
    <div className="space-y-5">
      <div>
        <div className="font-[var(--font-mono)] text-[10px] text-[#555] tracking-[2px] mb-1">ADMIN / EMBROIDERY</div>
        <h1 className="text-xl font-black text-[#111]">자수 시안 요청</h1>
      </div>

      {/* 긴급 배너 */}
      {urgent.length > 0 && (
        <div className="border border-[#c8161d]/40 bg-[#c8161d]/5 px-5 py-4">
          <div className="font-[var(--font-mono)] text-[10px] text-[#c8161d] tracking-[1.5px] mb-3 font-bold">
            ⚠ 처리 필요 ({urgent.length}건)
          </div>
          <div className="space-y-1.5">
            {urgent.map((d) => (
              <Link key={d.id} href={`/admin/embroidery/${d.id}`}
                className="flex items-center justify-between bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-2.5 hover:border-[#c8161d]/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-[var(--font-mono)] text-[11px] text-[#c8161d] font-bold">{d.designNumber}</span>
                  <span className="text-sm font-bold text-white">{d.member?.name ?? "비회원"}</span>
                  <span className="text-xs text-[#555]">
                    {EMBROIDERY_TYPES[d.embroideryType as keyof typeof EMBROIDERY_TYPES]?.name}
                    {" · "}{POSITION_LABELS[d.position as keyof typeof POSITION_LABELS]}
                  </span>
                </div>
                <span className={`font-[var(--font-mono)] text-[10px] px-2 py-0.5 font-bold ${STATUS_BADGE[d.status]}`}>
                  {STATUS_LABELS[d.status as keyof typeof STATUS_LABELS]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 상태별 카운트 */}
      <div className="grid grid-cols-6 gap-2">
        {statusGroups.map((s) => {
          const count = designs.filter((d) => d.status === s).length;
          return (
            <div key={s} className="bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-3">
              <div className="font-[var(--font-mono)] text-[9px] text-[#555] mb-1">
                {STATUS_LABELS[s as keyof typeof STATUS_LABELS]}
              </div>
              <div className={`font-[var(--font-display)] text-xl ${count > 0 ? "text-white" : "text-[#333]"}`}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-4 gap-3">
        {designs.map((d) => {
          const typeName = EMBROIDERY_TYPES[d.embroideryType as keyof typeof EMBROIDERY_TYPES]?.name ?? d.embroideryType;
          const posLabel = POSITION_LABELS[d.position as keyof typeof POSITION_LABELS] ?? d.position;
          const sizeLabel = SIZE_LABELS[d.size as keyof typeof SIZE_LABELS] ?? d.size;
          return (
            <Link key={d.id} href={`/admin/embroidery/${d.id}`}
              className="bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#c8161d]/50 transition-colors group">
              {/* 썸네일 */}
              <div className="bg-[#f8f8f8] border-b border-[#2a2a2a] flex items-center justify-center p-4" style={{ height: 160 }}>
                <MiniPreview position={d.position} size={d.size} text={d.textContent} imageUrl={d.logoImageUrl ?? d.designImageUrl} />
              </div>
              {/* 정보 */}
              <div className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-[var(--font-mono)] text-[9px] text-[#555]">{d.designNumber}</div>
                    <div className="text-sm font-bold text-white mt-0.5">{d.member?.name ?? "비회원"}</div>
                    {d.member?.loginId && <div className="font-[var(--font-mono)] text-[10px] text-[#444]">@{d.member.loginId}</div>}
                  </div>
                  <span className={`font-[var(--font-mono)] text-[9px] px-2 py-0.5 font-bold flex-shrink-0 ${STATUS_BADGE[d.status] ?? "text-[#888] bg-[#222]"}`}>
                    {STATUS_LABELS[d.status as keyof typeof STATUS_LABELS] ?? d.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[{label:"종류",val:typeName},{label:"위치",val:posLabel},{label:"크기",val:sizeLabel}].map((item) => (
                    <div key={item.label} className="bg-[#111] border border-[#222] px-2 py-1.5 text-center">
                      <div className="font-[var(--font-mono)] text-[8px] text-[#444]">{item.label}</div>
                      <div className="text-[10px] font-bold text-[#aaa] mt-0.5 truncate">{item.val}</div>
                    </div>
                  ))}
                </div>
                {d.textContent && <div className="font-[var(--font-mono)] text-[10px] text-[#555] truncate">"{d.textContent}"</div>}
                <div className="flex items-center justify-between pt-1 border-t border-[#222]">
                  <span className="font-[var(--font-mono)] text-[10px] text-[#444]">
                    {new Date(d.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                  <span className="font-[var(--font-display)] text-sm text-[#c8161d]">
                    {d.totalPrice.toLocaleString()}원
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {designs.length === 0 && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] py-20 text-center">
          <div className="font-[var(--font-display)] text-[50px] text-[#222] leading-none mb-3">EMPTY</div>
          <p className="text-sm text-[#444] font-[var(--font-mono)]">자수 시안 신청이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
