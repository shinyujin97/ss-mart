import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PaymentConfirmHandler from "./PaymentConfirmHandler";

interface Props {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ paymentKey?: string; amount?: string; orderId?: string }>;
}

export default async function OrderCompletePage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session) redirect("/login");

  const { orderId } = await params;
  const sp = await searchParams;

  const order = await prisma.order.findUnique({
    where: { id: orderId, memberId: session.user!.id as string },
    include: {
      items: {
        include: {
          product: { select: { name: true } },
          option: { select: { color: true, size: true } },
        },
        take: 3,
      },
      payment: true,
    },
  });

  if (!order) notFound();

  // 토스페이먼츠 콜백 처리 (paymentKey가 있으면 결제 승인 필요)
  const needsConfirm = !!sp.paymentKey && order.status === "PENDING";

  const STEP_LABELS = [
    { num: "01", label: "결제 완료" },
    { num: "02", label: "상품 준비" },
    { num: "03", label: "배송 중" },
    { num: "04", label: "배송 완료" },
    { num: "05", label: "구매 확정" },
  ];

  return (
    <div className="bg-[var(--gray-50)] min-h-screen">
      {/* 헤더 */}
      <div className="bg-white border-b border-[var(--line)]">
        <div className="max-w-[1340px] mx-auto px-6 py-4">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--red)] tracking-[2px] mb-1">
            ORDER / COMPLETE
          </div>
          <h1 className="text-xl font-black tracking-tight">결제 완료</h1>
        </div>
      </div>

      {/* 결제 승인 핸들러 (클라이언트) */}
      {needsConfirm && (
        <PaymentConfirmHandler
          paymentKey={sp.paymentKey!}
          orderId={orderId}
        />
      )}

      <div className="max-w-[800px] mx-auto px-6 py-10">
        {/* 완료 메시지 */}
        <div className="text-center mb-10">
          <div className="font-[var(--font-display)] text-[80px] text-[var(--gray-100)] leading-none mb-4">
            DONE
          </div>
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[3px] mb-3">
            ─ ORDER COMPLETE
          </div>
          <h2 className="text-2xl font-black mb-2">주문이 완료되었습니다!</h2>
          <p className="text-sm text-[var(--gray-500)]">
            주문번호:{" "}
            <span className="font-[var(--font-mono)] text-[var(--black)] font-bold">
              {order.orderNumber}
            </span>
          </p>
        </div>

        {/* 진행 단계 */}
        <div className="grid border border-[var(--line)] mb-6" style={{ gridTemplateColumns: `repeat(${STEP_LABELS.length}, 1fr)` }}>
          {STEP_LABELS.map((s, i) => (
            <div
              key={s.num}
              className={`px-4 py-3 flex items-center gap-2 border-r border-[var(--line)] last:border-r-0 ${
                i === 0 ? "bg-[var(--black)] text-white" : "bg-[var(--gray-50)]"
              }`}
            >
              <span className={`font-[var(--font-display)] text-lg leading-none ${i === 0 ? "text-[var(--yellow)]" : "text-[var(--gray-300)]"}`}>
                {s.num}
              </span>
              <span className="text-xs font-bold">{s.label}</span>
            </div>
          ))}
        </div>

        {/* 주문 정보 */}
        <div className="border border-[var(--line)] mb-4">
          <div className="px-5 py-3.5 bg-[var(--gray-50)] border-b border-[var(--line)]">
            <span className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[1.5px] font-bold">
              ORDER INFO
            </span>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {[
              { label: "주문번호", value: order.orderNumber },
              { label: "결제 금액", value: `${order.totalAmount.toLocaleString()}원` },
              { label: "결제 수단", value: order.payment?.method ?? "확인 중" },
              { label: "배송지", value: `${order.address} ${order.addressDetail ?? ""}` },
              { label: "예상 도착", value: order.hasEmbroidery ? "시안 확정 후 5~7영업일" : "1~2일 이내" },
            ].map((r) => (
              <div key={r.label} className="flex px-5 py-3 text-sm">
                <span className="w-24 text-[var(--gray-500)] font-[var(--font-mono)] text-[11px] tracking-[0.5px] flex-shrink-0 pt-0.5">
                  {r.label}
                </span>
                <span className="font-semibold">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 자수 안내 */}
        {order.hasEmbroidery && (
          <div className="border border-[var(--yellow)] bg-[var(--yellow)]/5 px-5 py-4 mb-4">
            <div className="font-[var(--font-mono)] text-[10px] text-[var(--black)] tracking-[1px] font-bold mb-2">
              ▶ 자수 / 마킹 안내
            </div>
            <p className="text-sm text-[var(--gray-700)] leading-relaxed">
              담당 디자이너가 24시간 내에 카카오 채널{" "}
              <strong>@ssmart</strong>으로 시안을 보내드립니다.
              <br />
              시안 확정 후 자수 작업이 시작됩니다.
            </p>
          </div>
        )}

        {/* 버튼 */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/mypage/orders"
            className="py-4 border-2 border-[var(--black)] text-sm font-bold text-center hover:bg-[var(--gray-50)] transition-colors"
          >
            주문 내역 보기
          </Link>
          <Link
            href="/"
            className="py-4 bg-[var(--black)] text-white text-sm font-bold text-center hover:bg-[var(--gray-900)] transition-colors"
          >
            쇼핑 계속하기 →
          </Link>
        </div>
      </div>
    </div>
  );
}
