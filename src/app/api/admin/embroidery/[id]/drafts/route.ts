import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const { imageUrl, message } = await req.json();

  if (!imageUrl) return NextResponse.json({ error: "이미지가 필요합니다." }, { status: 400 });

  const design = await prisma.embroideryDesign.findUnique({
    where: { id },
    select: { status: true, memberId: true, designNumber: true, draftImages: { select: { id: true } } },
  });
  if (!design) return NextResponse.json({ error: "시안을 찾을 수 없습니다." }, { status: 404 });

  const revisionNo = design.draftImages.length + 1;

  const [draftImage] = await prisma.$transaction([
    prisma.embroideryDraftImage.create({
      data: { designId: id, revisionNo, imageUrl, message: message ?? null },
    }),
    prisma.embroideryDesign.update({
      where: { id },
      data: { status: "CUSTOMER_REVIEW" },
    }),
  ]);

  // 고객 알림
  if (design.memberId) {
    await createNotification({
      memberId: design.memberId,
      type: "USER_EMBROIDERY_STATUS",
      title: `[${design.designNumber}] ${revisionNo}차 자수 시안이 도착했습니다`,
      body: `${revisionNo}차 시안을 확인하고 승인 또는 수정 요청을 해주세요. 지금 바로 확인하세요.`,
      link: `/mypage/embroidery/${id}`,
    });
  }

  return NextResponse.json({ id: draftImage.id, revisionNo });
}
