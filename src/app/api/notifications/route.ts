import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const isAdmin = (session.user as any).role === "ADMIN";
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50);

  const where = isAdmin
    ? { memberId: null }
    : { memberId: session.user.id as string };

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, type: true, title: true, body: true, link: true, isRead: true, createdAt: true },
    }),
    prisma.notification.count({ where: { ...where, isRead: false } }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

// 전체 읽음 처리
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const isAdmin = (session.user as any).role === "ADMIN";
  const where = isAdmin
    ? { memberId: null, isRead: false }
    : { memberId: session.user.id as string, isRead: false };

  await prisma.notification.updateMany({
    where,
    data: { isRead: true, readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
