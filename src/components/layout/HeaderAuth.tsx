import { auth } from "@/lib/auth";
import Link from "next/link";
import HeaderAuthClient from "./HeaderAuthClient";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

export default async function HeaderAuth() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="flex items-center">
        <Link
          href="/login"
          className="px-[18px] py-[10px] text-xs font-medium text-[var(--gray-700)] hover:text-[var(--red)] transition-colors border-l border-[var(--line)]"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="px-[18px] py-[10px] text-xs font-medium text-[var(--gray-700)] hover:text-[var(--red)] transition-colors border-l border-[var(--line)]"
        >
          회원가입
        </Link>
      </div>
    );
  }

  const isAdmin = ADMIN_EMAILS.includes(session.user.email ?? "");

  return (
    <HeaderAuthClient name={session.user.name ?? "회원"} isAdmin={isAdmin} />
  );
}
