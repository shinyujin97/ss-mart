import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/admin");

  if ((session.user as any).role !== "ADMIN") redirect("/");

  return session;
}
