import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const isAdmin = (session.user as any).role === "ADMIN";

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) return NextResponse.json({ error: "알림을 찾을 수 없습니다." }, { status: 404 });

  const isOwner = isAdmin ? notification.memberId === null : notification.memberId === session.user.id;
  if (!isOwner) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  await prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
