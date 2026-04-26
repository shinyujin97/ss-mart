import CartClient from "./CartClient";

export const metadata = { title: "장바구니 | 에스에스종합상사" };

export default function CartPage() {
  return (
    <div className="bg-[var(--gray-50)] min-h-screen">
      <div className="bg-white border-b border-[var(--line)]">
        <div className="max-w-[1340px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="font-[var(--font-mono)] text-[10px] text-[var(--red)] tracking-[2px] mb-1">
              SHOPPING / CART
            </div>
            <h1 className="text-xl font-black tracking-tight">장바구니</h1>
          </div>
          {/* 진행 단계 */}
          <div className="flex items-center gap-2 font-[var(--font-mono)] text-[11px]">
            {["장바구니", "주문서 / 결제", "결제 완료"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                {i > 0 && <span className="text-[var(--gray-300)]">━</span>}
                <span className={i === 0 ? "text-[var(--black)] font-bold" : "text-[var(--gray-400)]"}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <CartClient />
    </div>
  );
}
