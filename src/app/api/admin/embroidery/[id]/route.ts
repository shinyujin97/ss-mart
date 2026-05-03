import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { canTransition } from "@/lib/embroidery/status";
import { createNotification, EMBROIDERY_STATUS_NOTIFICATIONS } from "@/lib/notifications";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const { status, notes, quotePrice, quoteColorCount, quoteDeliveryDays, quoteMessage } = await req.json();

  const design = await prisma.embroideryDesign.findUnique({
    where: { id },
    select: { status: true, memberId: true, designNumber: true },
  });
  if (!design) return NextResponse.json({ error: "시안을 찾을 수 없습니다." }, { status: 404 });

  if (status && status !== design.status && !canTransition(design.status as any, status)) {
    return NextResponse.json({ error: `${design.status} → ${status} 상태 변경이 허용되지 않습니다.` }, { status: 400 });
  }

  const updated = await prisma.embroideryDesign.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(quotePrice !== undefined ? { quotePrice } : {}),
      ...(quoteColorCount !== undefined ? { quoteColorCount } : {}),
      ...(quoteDeliveryDays !== undefined ? { quoteDeliveryDays } : {}),
      ...(quoteMessage !== undefined ? { quoteMessage } : {}),
      ...(status === "REVIEW_IN_PROGRESS" ? { reviewedAt: new Date() } : {}),
      ...(status === "CONFIRMED" ? { confirmedAt: new Date() } : {}),
      ...(status === "IN_PRODUCTION" ? { productionStartedAt: new Date() } : {}),
      ...(status === "COMPLETED" ? { completedAt: new Date() } : {}),
    },
    select: { id: true, status: true },
  });

  // 견적 발송 — 고객에게 알림
  if (status === "QUOTE_SENT" && design.memberId) {
    await createNotification({
      memberId: design.memberId,
      type: "USER_EMBROIDERY_STATUS",
      title: `[${design.designNumber}] 견적서가 도착했습니다`,
      body: `견적 내용을 확인하고 승인 또는 거절해 주세요.`,
      link: `/mypage/embroidery/${id}`,
    });
  }

  // 그 외 상태 변경 알림
  if (status && status !== design.status && status !== "QUOTE_SENT" && design.memberId) {
    const tpl = EMBROIDERY_STATUS_NOTIFICATIONS[status];
    if (tpl) {
      await createNotification({
        memberId: design.memberId,
        type: "USER_EMBROIDERY_STATUS",
        title: tpl.title,
        body: tpl.body(design.designNumber),
        link: `/mypage/embroidery/${id}`,
      });
    }
  }

  return NextResponse.json(updated);
}
