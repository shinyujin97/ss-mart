"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type Tab = "individual" | "business";

export default function LoginForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("individual");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="login-form-wrapper bg-white border border-[var(--line)] border-l-0 p-[50px] flex flex-col">
      {/* 탭 */}
      <div className="flex border-b-2 border-[var(--black)] mb-[30px]">
        {(
          [
            { key: "individual", num: "/01", label: "개인 회원" },
            { key: "business", num: "/02", label: "법인 / 사업자 회원" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-[14px] text-sm font-bold transition-all relative ${
              tab === t.key
                ? "text-[var(--black)]"
                : "text-[var(--gray-500)] hover:text-[var(--black)]"
            }`}
          >
            <span
              className={`font-[var(--font-mono)] text-[10px] tracking-[0.5px] mr-1.5 ${
                tab === t.key ? "text-[var(--red)]" : "text-[var(--gray-300)]"
              }`}
            >
              {t.num}
            </span>
            {t.label}
            {tab === t.key && (
              <span className="absolute bottom-[-2px] left-0 right-0 h-1 bg-[var(--red)]" />
            )}
          </button>
        ))}
      </div>

      {/* 헤더 */}
      <div className="mb-6">
        <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[2px] mb-1.5">
          ─ MEMBER LOGIN
        </div>
        <h2 className="text-2xl font-black tracking-tight">로그인</h2>
        <div className="font-[var(--font-mono)] text-xs text-[var(--gray-500)] mt-1.5 tracking-[0.3px]">
          welcome back ─ 에스에스종합상사
        </div>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* 이메일 */}
        <div className="relative pt-[22px]">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] tracking-[1.5px] font-semibold mb-1.5 absolute top-0">
            ─ EMAIL / ID
          </div>
          <span className="absolute left-[14px] top-[calc(50%+11px)] -translate-y-1/2 font-[var(--font-mono)] text-[11px] text-[var(--gray-500)] font-semibold tracking-[0.5px] pointer-events-none">
            @
          </span>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 또는 아이디 입력"
            required
            className="w-full pl-11 pr-4 py-[14px] border border-[1.5px] border-[var(--line)] text-sm outline-none transition-colors focus:border-[var(--black)] font-[var(--font-sans)]"
          />
        </div>

        {/* 비밀번호 */}
        <div className="relative pt-[22px]">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] tracking-[1.5px] font-semibold mb-1.5 absolute top-0">
            ─ PASSWORD
          </div>
          <span className="absolute left-[14px] top-[calc(50%+11px)] -translate-y-1/2 font-[var(--font-mono)] text-[11px] text-[var(--gray-500)] font-semibold tracking-[0.5px] pointer-events-none">
            PW
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 입력"
            required
            className="w-full pl-11 pr-4 py-[14px] border border-[1.5px] border-[var(--line)] text-sm outline-none transition-colors focus:border-[var(--black)] font-[var(--font-sans)]"
          />
        </div>

        {/* 에러 */}
        {error && (
          <p className="text-[var(--red)] text-xs font-[var(--font-mono)]">
            ✕ {error}
          </p>
        )}

        {/* 옵션 */}
        <div className="flex items-center justify-between mt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="w-4 h-4 border-2 border-[var(--black)] flex items-center justify-center text-[8px]">
              ✓
            </span>
            <span className="text-xs text-[var(--gray-700)]">로그인 유지</span>
          </label>
          <div className="flex gap-3 text-xs text-[var(--gray-500)]">
            <button type="button" className="hover:text-[var(--black)]">
              아이디 찾기
            </button>
            <button type="button" className="hover:text-[var(--black)]">
              비밀번호 찾기
            </button>
          </div>
        </div>

        {/* 로그인 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 bg-[var(--black)] text-white py-[15px] font-bold text-sm tracking-[1px] hover:bg-[var(--gray-900)] transition-colors disabled:opacity-60"
        >
          {loading ? "로그인 중..." : "LOGIN →"}
        </button>
      </form>

      {/* OR 구분선 */}
      <div className="relative my-5 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--line)]" />
        </div>
        <span className="relative bg-white px-3 font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] tracking-[1.5px]">
          OR CONTINUE WITH
        </span>
      </div>

      {/* 소셜 로그인 */}
      <div className="grid grid-cols-2 gap-1.5 mb-5">
        <button className="flex items-center justify-center gap-2.5 py-[14px] text-[13px] font-bold bg-[#fee500] text-[#1a1a1a] border border-[#fee500] hover:bg-[#f5dc00] transition-colors">
          <span className="font-[var(--font-mono)] text-[11px] font-black w-5 h-5 flex items-center justify-center">
            KA
          </span>
          카카오
        </button>
        <button className="flex items-center justify-center gap-2.5 py-[14px] text-[13px] font-bold bg-[#03c75a] text-white border border-[#03c75a] hover:bg-[#02a64a] transition-colors">
          <span className="font-[var(--font-mono)] text-[11px] font-black w-5 h-5 flex items-center justify-center">
            N
          </span>
          네이버
        </button>
        <button className="flex items-center justify-center gap-2.5 py-[14px] text-[13px] font-bold bg-white text-[#1a1a1a] border border-[var(--line)] hover:border-[var(--black)] transition-colors">
          <span className="font-[var(--font-mono)] text-[11px] font-black w-5 h-5 flex items-center justify-center">
            G
          </span>
          Google
        </button>
        <button className="flex items-center justify-center gap-2.5 py-[14px] text-[13px] font-bold bg-[#1a1a1a] text-white border border-[#1a1a1a] hover:bg-[var(--gray-900)] transition-colors">
          <span className="font-[var(--font-mono)] text-[11px] font-black w-5 h-5 flex items-center justify-center">
            A
          </span>
          Apple
        </button>
      </div>

      {/* 회원가입 */}
      <div className="border border-[var(--line)] p-5 flex items-center justify-between">
        <div>
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--red)] tracking-[1px] mb-1">
            ▶ NEW MEMBER
          </div>
          <div className="text-sm font-bold">아직 회원이 아니신가요?</div>
          <div className="text-xs text-[var(--gray-500)] mt-0.5">
            2,000P + 10% 쿠폰 즉시 지급
          </div>
        </div>
        <Link
          href="/signup"
          className="bg-[var(--red)] text-white px-5 py-3 text-xs font-bold tracking-[0.5px] hover:bg-[var(--red-dark)] transition-colors whitespace-nowrap"
        >
          회원가입 →
        </Link>
      </div>
    </div>
  );
}
