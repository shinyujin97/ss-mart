import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

const BENEFITS = [
  { num: "BENEFIT / 01", name: "2,000P 즉시 적립", desc: "신규 가입 즉시" },
  { num: "BENEFIT / 02", name: "10% 첫 구매 쿠폰", desc: "최대 5만원" },
  { num: "BENEFIT / 03", name: "무료 자수 시안", desc: "고객 디자인 기반" },
  { num: "BENEFIT / 04", name: "단체주문 30%", desc: "100벌 이상" },
];

const STATS = [
  { label: "MEMBERS", value: "12,000+" },
  { label: "PRODUCTS", value: "5,940+" },
  { label: "REVIEWS", value: "38,420" },
];

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="min-h-screen bg-[var(--gray-50)] flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-[1000px] grid grid-cols-[1fr_420px]">
        {/* 좌측: 비주얼 */}
        <div
          className="relative flex flex-col justify-between p-[50px] text-white"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 100%), url('https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=85&auto=format&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* 상단 */}
          <div>
            <div className="font-[var(--font-mono)] text-[11px] tracking-[3px] text-white/60 mb-4">
              MEMBER LOGIN / VOL.01
            </div>
            <h1 className="text-[36px] font-black leading-tight tracking-tight mb-4">
              현장의 신뢰
              <br />
              <span className="text-[var(--red)]">에스에스종합상사</span>
            </h1>
            <p className="text-sm text-white/70 leading-relaxed">
              80여 개 브랜드의 작업복 · 안전화 · 안전용품을
              <br />
              한 곳에서. 회원만의 특별한 혜택을 누려보세요.
            </p>
          </div>

          {/* 하단 */}
          <div>
            {/* 혜택 */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {BENEFITS.map((b) => (
                <div key={b.num} className="border border-white/20 p-4">
                  <div className="font-[var(--font-mono)] text-[10px] text-white/40 tracking-[1px] mb-1">
                    {b.num}
                  </div>
                  <div className="font-bold text-sm">{b.name}</div>
                  <div className="text-xs text-white/60 mt-0.5">{b.desc}</div>
                </div>
              ))}
            </div>

            {/* 통계 */}
            <div className="flex border-t border-white/20 pt-5 gap-6">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="font-[var(--font-mono)] text-[10px] text-white/40 tracking-[1px]">
                    {s.label}
                  </div>
                  <div className="font-[var(--font-display)] text-2xl text-white">
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 우측: 폼 */}
        <Suspense fallback={<div className="bg-white border border-[var(--line)] border-l-0" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
