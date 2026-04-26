import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";

export const metadata = { title: "회원 정보 수정 | 마이페이지" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const member = await prisma.member.findUnique({
    where: { id: session.user.id as string },
    select: { name: true, email: true, phone: true, birthDate: true, gender: true, marketingEmail: true, marketingSms: true },
  });

  if (!member) redirect("/login");

  return (
    <div>
      <h2 className="text-lg font-black mb-4">회원 정보 수정</h2>
      <ProfileForm member={member} />
    </div>
  );
}
