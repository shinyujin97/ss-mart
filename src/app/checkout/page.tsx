import CheckoutClient from "./CheckoutClient";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "주문 / 결제 | 에스에스종합상사" };

export default async function CheckoutPage() {
  const session = await auth();
  if (!session) redirect("/login?next=/checkout");

  return (
    <div className="bg-[var(--gray-50)] min-h-screen">
      <div className="bg-white border-b border-[var(--line)]">
        <div className="max-w-[1340px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="font-[var(--font-mono)] text-[10px] text-[var(--red)] tracking-[2px] mb-1">
              ORDER / CHECKOUT
            </div>
            <h1 className="text-xl font-black tracking-tight">주문서 / 결제</h1>
          </div>
          <div className="flex items-center gap-2 font-[var(--font-mono)] text-[11px]">
            {["장바구니", "주문서 / 결제", "결제 완료"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                {i > 0 && <span className="text-[var(--gray-300)]">━</span>}
                <span className={i === 1 ? "text-[var(--black)] font-bold" : "text-[var(--gray-400)]"}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <CheckoutClient />
    </div>
  );
}
