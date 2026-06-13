import Link from "next/link";

export const metadata = { title: "제품 문의 | 에스에스종합상사" };

export default function CartPage() {
  return (
    <div className="bg-[var(--gray-50)] min-h-screen flex items-center justify-center">
      <div className="bg-white border border-[var(--line)] p-8 md:p-16 text-center max-w-lg w-full mx-4 md:mx-6">
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--red)] tracking-[2px] mb-6">
          INQUIRY / CONTACT
        </div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--black)] mb-4">
          제품 문의
        </h1>
        <p className="text-sm text-[var(--gray-500)] leading-relaxed mb-8">
          현재 모든 제품은 전화 문의를 통해 안내드리고 있습니다.
          <br />
          제품명, 수량, 사이즈 등을 말씀해 주시면 빠르게 도와드리겠습니다.
        </p>
        <a
          href="tel:031-430-0497"
          className="block bg-[var(--black)] text-white py-5 font-bold text-lg tracking-[1px] hover:bg-[var(--gray-900)] transition-colors mb-3"
        >
          <span className="font-[var(--font-display)] text-[var(--yellow)] text-2xl tracking-wider">
            031-430-0497
          </span>
        </a>
        <p className="font-[var(--font-mono)] text-[10px] text-[var(--gray-400)] tracking-[1px] mb-8">
          평일 09:00 – 18:00 · 주말 / 공휴일 휴무
        </p>
        <Link
          href="/"
          className="text-xs text-[var(--gray-500)] underline underline-offset-4 hover:text-[var(--red)] transition-colors"
        >
          상품 카탈로그로 돌아가기
        </Link>
      </div>
    </div>
  );
}
