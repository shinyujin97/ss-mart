import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignupForm from "./SignupForm";

export const metadata = {
  title: "회원가입 | 에스에스종합상사",
};

export default async function SignupPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="bg-[var(--gray-50)] py-10">
      <div className="max-w-[900px] mx-auto px-4 md:px-6 mb-8">
        <div className="font-[var(--font-mono)] text-[11px] text-[var(--gray-500)] tracking-[2px] mb-2">
          MEMBERSHIP / REGISTER
        </div>
        <h1 className="text-[28px] font-black tracking-tight">회원가입</h1>
      </div>
      <SignupForm />
    </div>
  );
}
