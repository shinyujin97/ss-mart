import { auth } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import HeaderAuthClient from "./HeaderAuthClient";
import NotificationBell from "./NotificationBell";

export default async function HeaderAuth() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="flex items-center">
        <Link
          href="/login"
          className="px-2.5 py-2 md:px-[18px] md:py-[10px] text-xs font-medium text-[var(--gray-700)] hover:text-[var(--red)] transition-colors border-l border-[var(--line)] whitespace-nowrap"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="px-2.5 py-2 md:px-[18px] md:py-[10px] text-xs font-medium text-[var(--gray-700)] hover:text-[var(--red)] transition-colors border-l border-[var(--line)] whitespace-nowrap"
        >
          회원가입
        </Link>
      </div>
    );
  }

  const isAdmin = (session.user as any).role === "ADMIN";

  const unreadCount = await prisma.notification.count({
    where: isAdmin
      ? { memberId: null, isRead: false }
      : { memberId: session.user.id as string, isRead: false },
  });

  return (
    <div className="flex items-center border-l border-[var(--line)]">
      <div className="px-2 border-r border-[var(--line)]">
        <NotificationBell initialCount={unreadCount} />
      </div>
      <HeaderAuthClient name={session.user.name ?? "회원"} isAdmin={isAdmin} />
    </div>
  );
}
