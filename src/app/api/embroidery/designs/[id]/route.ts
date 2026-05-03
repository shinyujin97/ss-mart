import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const { notes, action, revisionNo, shipping } = await req.json().catch(() => ({}));

  const design = await prisma.embroideryDesign.findUnique({
    where: { id },
    select: { memberId: true, status: true, designNumber: true },
  });

  if (!design) {
    return NextResponse.json({ error: "시안을 찾을 수 없습니다." }, { status: 404 });
  }

  if (design.memberId !== session.user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  // 고객이 견적 승인
  if (action === "APPROVE_QUOTE") {
    if (design.status !== "QUOTE_SENT") {
      return NextResponse.json({ error: "견적 확인 대기 상태에서만 승인할 수 있습니다." }, { status: 400 });
    }
    if (!shipping?.name || !shipping?.phone || !shipping?.zipCode || !shipping?.address) {
      return NextResponse.json({ error: "배송지 정보를 모두 입력해 주세요." }, { status: 400 });
    }
    const updated = await prisma.embroideryDesign.update({
      where: { id },
      data: {
        status: "QUOTE_APPROVED",
        shippingName: shipping.name,
        shippingPhone: shipping.phone,
        shippingZipCode: shipping.zipCode,
        shippingAddress: shipping.address,
        shippingAddressDetail: shipping.addressDetail ?? null,
        shippingRequest: shipping.request ?? null,
      },
      select: { id: true, status: true },
    });
    await createNotification({
      memberId: null,
      type: "ADMIN_NEW_REQUEST",
      title: "고객이 견적을 승인했습니다",
      body: `${design.designNumber} 견적이 승인되었습니다. 시안 제작을 시작해 주세요.`,
      link: `/admin/embroidery/${id}`,
    });
    return NextResponse.json(updated);
  }

  // 고객이 견적 거절
  if (action === "REJECT_QUOTE") {
    if (design.status !== "QUOTE_SENT") {
      return NextResponse.json({ error: "견적 확인 대기 상태에서만 거절할 수 있습니다." }, { status: 400 });
    }
    const updated = await prisma.embroideryDesign.update({
      where: { id },
      data: { status: "QUOTE_REJECTED" },
      select: { id: true, status: true },
    });
    await createNotification({
      memberId: null,
      type: "ADMIN_NEW_REQUEST",
      title: "고객이 견적을 거절했습니다",
      body: `${design.designNumber} 견적이 거절되었습니다. 재견적을 검토해 주세요.`,
      link: `/admin/embroidery/${id}`,
    });
    return NextResponse.json(updated);
  }

  // 고객이 시안 확정
  if (action === "CONFIRM") {
    if (design.status !== "CUSTOMER_REVIEW") {
      return NextResponse.json({ error: "시안 확인 대기 상태에서만 확정할 수 있습니다." }, { status: 400 });
    }
    const updated = await prisma.embroideryDesign.update({
      where: { id },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        ...(revisionNo ? { confirmedRevisionNo: revisionNo } : {}),
      },
      select: { id: true, status: true },
    });
    await createNotification({
      memberId: null,
      type: "ADMIN_NEW_REQUEST",
      title: "고객이 시안을 확정했습니다",
      body: `${design.designNumber} 시안이 확정되었습니다. 제작을 시작해 주세요.`,
      link: `/admin/embroidery/${id}`,
    });
    return NextResponse.json(updated);
  }

  // 고객이 수정 요청
  if (action === "REVISION") {
    if (design.status !== "CUSTOMER_REVIEW") {
      return NextResponse.json({ error: "시안 확인 대기 상태에서만 수정 요청할 수 있습니다." }, { status: 400 });
    }
    const updated = await prisma.embroideryDesign.update({
      where: { id },
      data: {
        status: "REVISION_REQUESTED",
        revisionCount: { increment: 1 },
        ...(notes ? { notes } : {}),
      },
      select: { id: true, status: true },
    });
    await createNotification({
      memberId: null,
      type: "ADMIN_NEW_REQUEST",
      title: "고객이 시안 수정을 요청했습니다",
      body: `${design.designNumber} 시안 수정 요청이 접수되었습니다.${notes ? ` 요청사항: ${notes.slice(0, 40)}` : ""}`,
      link: `/admin/embroidery/${id}`,
    });
    return NextResponse.json(updated);
  }

  if (design.status !== "DRAFT") {
    return NextResponse.json({ error: "이미 신청된 시안입니다." }, { status: 400 });
  }

  const updated = await prisma.embroideryDesign.update({
    where: { id },
    data: { status: "REVIEW_PENDING", ...(notes ? { notes } : {}) },
    select: { id: true, status: true, designNumber: true, member: { select: { name: true } } },
  });

  // 관리자에게 알림 (memberId: null = 전체 관리자 대상)
  await createNotification({
    memberId: null,
    type: "ADMIN_NEW_REQUEST",
    title: "새 자수 시안 검토 요청",
    body: `${updated.member?.name ?? "고객"}님이 시안 ${updated.designNumber} 검토를 요청했습니다.`,
    link: `/admin/embroidery/${id}`,
  });

  return NextResponse.json({ id: updated.id, status: updated.status });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;

  const design = await prisma.embroideryDesign.findUnique({
    where: { id },
    select: { memberId: true, status: true },
  });

  if (!design) {
    return NextResponse.json({ error: "시안을 찾을 수 없습니다." }, { status: 404 });
  }

  if (design.memberId !== session.user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  // 제작 중·완료된 시안은 삭제 불가
  if (["IN_PRODUCTION", "COMPLETED"].includes(design.status)) {
    return NextResponse.json(
      { error: "제작이 시작된 시안은 삭제할 수 없습니다." },
      { status: 400 }
    );
  }

  await prisma.embroideryDesign.delete({ where: { id } });

  return NextResponse.json({ message: "삭제되었습니다." });
}
