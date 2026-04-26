import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// 관리자 이메일 목록 (env로 관리)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login?next=/admin");

  if (!ADMIN_EMAILS.includes(session.user.email)) {
    redirect("/");
  }

  return session;
}
