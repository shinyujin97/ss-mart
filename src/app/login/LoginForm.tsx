"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

type Modal = null | "findEmail" | "findPassword";

function formatPhone(value: string) {
  const nums = value.replace(/\D/g, "").slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
  return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7)}`;
}

export default function LoginForm() {
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [modal, setModal] = useState<Modal>(null);

  // 아이디 찾기
  const [feName, setFeName] = useState("");
  const [fePhone, setFePhone] = useState("");
  const [feResult, setFeResult] = useState("");
  const [feError, setFeError] = useState("");
  const [feLoading, setFeLoading] = useState(false);

  // 비밀번호 찾기
  const [fpLoginId, setFpLoginId] = useState("");
  const [fpName, setFpName] = useState("");
  const [fpPhone, setFpPhone] = useState("");
  const [fpResult, setFpResult] = useState<{ message: string; tempPassword?: string } | null>(null);
  const [fpError, setFpError] = useState("");
  const [fpLoading, setFpLoading] = useState(false);

  function openModal(m: Modal) {
    setModal(m);
    setFeName(""); setFePhone(""); setFeResult(""); setFeError("");
    setFpLoginId(""); setFpName(""); setFpPhone(""); setFpResult(null); setFpError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      loginId,
      password,
      rememberMe: String(remember),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    const callbackUrl = searchParams.get("callbackUrl") || "/";
    window.location.href = callbackUrl;
  }

  async function handleFindEmail(e: React.FormEvent) {
    e.preventDefault();
    setFeError(""); setFeResult("");
    setFeLoading(true);
    try {
      const res = await fetch("/api/auth/find-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: feName, phone: fePhone }),
      });
      const data = await res.json();
      if (!res.ok) { setFeError(data.error ?? "조회 실패"); return; }
      setFeResult(data.loginId);
    } catch {
      setFeError("네트워크 오류가 발생했습니다.");
    } finally {
      setFeLoading(false);
    }
  }

  async function handleFindPassword(e: React.FormEvent) {
    e.preventDefault();
    setFpError(""); setFpResult(null);
    setFpLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId: fpLoginId, name: fpName, phone: fpPhone }),
      });
      const data = await res.json();
      if (!res.ok) { setFpError(data.error ?? "처리 실패"); return; }
      setFpResult(data);
    } catch {
      setFpError("네트워크 오류가 발생했습니다.");
    } finally {
      setFpLoading(false);
    }
  }

  return (
    <>
      <div className="login-form-wrapper bg-white border border-[var(--line)] border-l-0 p-[50px] flex flex-col">
        {/* 회원가입 완료 배너 */}
        {justRegistered && (
          <div className="bg-[#111] text-white px-4 py-3 mb-5 flex items-center gap-3">
            <span className="text-[var(--yellow)] font-bold text-sm">✓</span>
            <div>
              <p className="text-sm font-bold">회원가입이 완료되었습니다!</p>
              <p className="font-[var(--font-mono)] text-[11px] text-white/60 mt-0.5">2,000P가 즉시 적립되었습니다. 로그인해주세요.</p>
            </div>
          </div>
        )}


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
          {/* 아이디 */}
          <div className="relative pt-[22px]">
            <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] tracking-[1.5px] font-semibold mb-1.5 absolute top-0">
              ─ ID / 아이디
            </div>
            <span className="absolute left-[14px] top-[calc(50%+11px)] -translate-y-1/2 font-[var(--font-mono)] text-[11px] text-[var(--gray-500)] font-semibold tracking-[0.5px] pointer-events-none">
              ID
            </span>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="아이디 입력"
              required
              autoComplete="username"
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
            <label
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => setRemember((v) => !v)}
            >
              <span
                className={`w-4 h-4 border-2 flex items-center justify-center text-[8px] transition-colors ${
                  remember
                    ? "border-[var(--black)] bg-[var(--black)] text-white"
                    : "border-[var(--gray-300)]"
                }`}
              >
                {remember && "✓"}
              </span>
              <span className="text-xs text-[var(--gray-700)]">로그인 유지</span>
            </label>
            <div className="flex gap-3 text-xs text-[var(--gray-500)]">
              <button
                type="button"
                onClick={() => openModal("findEmail")}
                className="hover:text-[var(--black)] transition-colors"
              >
                아이디 찾기
              </button>
              <button
                type="button"
                onClick={() => openModal("findPassword")}
                className="hover:text-[var(--black)] transition-colors"
              >
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
            <span className="font-[var(--font-mono)] text-[11px] font-black w-5 h-5 flex items-center justify-center">KA</span>
            카카오
          </button>
          <button className="flex items-center justify-center gap-2.5 py-[14px] text-[13px] font-bold bg-[#03c75a] text-white border border-[#03c75a] hover:bg-[#02a64a] transition-colors">
            <span className="font-[var(--font-mono)] text-[11px] font-black w-5 h-5 flex items-center justify-center">N</span>
            네이버
          </button>
          <button className="flex items-center justify-center gap-2.5 py-[14px] text-[13px] font-bold bg-white text-[#1a1a1a] border border-[var(--line)] hover:border-[var(--black)] transition-colors">
            <span className="font-[var(--font-mono)] text-[11px] font-black w-5 h-5 flex items-center justify-center">G</span>
            Google
          </button>
          <button className="flex items-center justify-center gap-2.5 py-[14px] text-[13px] font-bold bg-[#1a1a1a] text-white border border-[#1a1a1a] hover:bg-[var(--gray-900)] transition-colors">
            <span className="font-[var(--font-mono)] text-[11px] font-black w-5 h-5 flex items-center justify-center">A</span>
            Apple
          </button>
        </div>

        {/* 회원가입 */}
        <div className="border border-[var(--line)] p-5 flex items-center justify-between">
          <div>
            <div className="font-[var(--font-mono)] text-[10px] text-[var(--red)] tracking-[1px] mb-1">▶ NEW MEMBER</div>
            <div className="text-sm font-bold">아직 회원이 아니신가요?</div>
            <div className="text-xs text-[var(--gray-500)] mt-0.5">2,000P + 10% 쿠폰 즉시 지급</div>
          </div>
          <Link
            href="/signup"
            className="bg-[var(--red)] text-white px-5 py-3 text-xs font-bold tracking-[0.5px] hover:bg-[var(--red-dark)] transition-colors whitespace-nowrap"
          >
            회원가입 →
          </Link>
        </div>
      </div>

      {/* 아이디 찾기 모달 */}
      {modal === "findEmail" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white border border-[#e5e5e5] shadow-xl w-[400px]">
            <div className="flex items-center justify-between px-6 pt-5 pb-1">
              <div>
                <div className="font-[var(--font-mono)] text-[10px] tracking-[2px] text-[#aaa]">FIND / ID</div>
                <h3 className="text-base font-black text-[#111] mt-0.5">아이디 찾기</h3>
              </div>
              <button onClick={() => setModal(null)} className="text-[#bbb] hover:text-[#111] text-lg">✕</button>
            </div>
            <div className="px-6 py-5">
              {feResult ? (
                <div className="text-center py-4 space-y-3">
                  <div className="font-[var(--font-mono)] text-[10px] tracking-[2px] text-[var(--red)]">─ RESULT</div>
                  <p className="text-sm text-[#555]">회원님의 아이디는</p>
                  <p className="text-xl font-black text-[#111] tracking-widest font-[var(--font-mono)]">{feResult}</p>
                  <p className="text-xs text-[#aaa] font-[var(--font-mono)]">입니다.</p>
                  <button
                    onClick={() => openModal("findPassword")}
                    className="text-xs text-[var(--red)] underline underline-offset-2 mt-2"
                  >
                    비밀번호도 찾기 →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFindEmail} className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-[var(--font-mono)] text-[10px] tracking-[1.5px] text-[#555]">─ 이름</label>
                    <input
                      type="text"
                      value={feName}
                      onChange={(e) => setFeName(e.target.value)}
                      placeholder="가입 시 입력한 이름"
                      required
                      className="w-full border border-[#ddd] px-3 py-2.5 text-sm outline-none focus:border-[#111] placeholder:text-[#ccc]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-[var(--font-mono)] text-[10px] tracking-[1.5px] text-[#555]">─ 전화번호</label>
                    <input
                      type="text"
                      value={fePhone}
                      onChange={(e) => setFePhone(formatPhone(e.target.value))}
                      placeholder="010-1234-5678"
                      required
                      className="w-full border border-[#ddd] px-3 py-2.5 text-sm outline-none focus:border-[#111] placeholder:text-[#ccc] font-[var(--font-mono)]"
                    />
                  </div>
                  {feError && (
                    <p className="text-[var(--red)] text-xs font-[var(--font-mono)]">✕ {feError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={feLoading}
                    className="w-full bg-[#111] text-white py-3 text-sm font-bold hover:bg-[#333] transition-colors disabled:opacity-60 mt-1"
                  >
                    {feLoading ? "조회 중..." : "아이디 찾기"}
                  </button>
                </form>
              )}
            </div>
            <div className="border-t border-[#e5e5e5] px-6 py-3 flex justify-end">
              <button onClick={() => setModal(null)} className="text-xs text-[#888] hover:text-[#111] transition-colors">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 찾기 모달 */}
      {modal === "findPassword" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white border border-[#e5e5e5] shadow-xl w-[400px]">
            <div className="flex items-center justify-between px-6 pt-5 pb-1">
              <div>
                <div className="font-[var(--font-mono)] text-[10px] tracking-[2px] text-[#aaa]">FIND / PASSWORD</div>
                <h3 className="text-base font-black text-[#111] mt-0.5">비밀번호 찾기</h3>
              </div>
              <button onClick={() => setModal(null)} className="text-[#bbb] hover:text-[#111] text-lg">✕</button>
            </div>
            <div className="px-6 py-5">
              {fpResult ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-10 h-10 bg-[#111] flex items-center justify-center mx-auto">
                    <span className="text-white text-base">✓</span>
                  </div>
                  <p className="text-sm text-[#555]">임시 비밀번호가 발급되었습니다.</p>
                  {fpResult.tempPassword && (
                    <div className="bg-[#f4f4f4] border border-[#e5e5e5] px-4 py-3">
                      <div className="font-[var(--font-mono)] text-[10px] text-[#aaa] mb-1">임시 비밀번호</div>
                      <div className="font-[var(--font-mono)] text-xl font-bold text-[#111] tracking-widest">
                        {fpResult.tempPassword}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-[#aaa] font-[var(--font-mono)]">
                    로그인 후 반드시 비밀번호를 변경해주세요.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFindPassword} className="space-y-3">
                  <p className="text-xs text-[#888] leading-relaxed">
                    아이디, 이름, 전화번호가 일치하면 임시 비밀번호를 발급해 드립니다.
                  </p>
                  <div className="space-y-1">
                    <label className="font-[var(--font-mono)] text-[10px] tracking-[1.5px] text-[#555]">─ 아이디</label>
                    <input
                      type="text"
                      value={fpLoginId}
                      onChange={(e) => setFpLoginId(e.target.value)}
                      placeholder="가입 시 사용한 아이디"
                      required
                      className="w-full border border-[#ddd] px-3 py-2.5 text-sm outline-none focus:border-[#111] placeholder:text-[#ccc] font-[var(--font-mono)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-[var(--font-mono)] text-[10px] tracking-[1.5px] text-[#555]">─ 이름</label>
                    <input
                      type="text"
                      value={fpName}
                      onChange={(e) => setFpName(e.target.value)}
                      placeholder="가입 시 입력한 이름"
                      required
                      className="w-full border border-[#ddd] px-3 py-2.5 text-sm outline-none focus:border-[#111] placeholder:text-[#ccc]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-[var(--font-mono)] text-[10px] tracking-[1.5px] text-[#555]">─ 전화번호</label>
                    <input
                      type="text"
                      value={fpPhone}
                      onChange={(e) => setFpPhone(formatPhone(e.target.value))}
                      placeholder="010-1234-5678"
                      required
                      className="w-full border border-[#ddd] px-3 py-2.5 text-sm outline-none focus:border-[#111] placeholder:text-[#ccc] font-[var(--font-mono)]"
                    />
                  </div>
                  {fpError && (
                    <p className="text-[var(--red)] text-xs font-[var(--font-mono)]">✕ {fpError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={fpLoading}
                    className="w-full bg-[#111] text-white py-3 text-sm font-bold hover:bg-[#333] transition-colors disabled:opacity-60 mt-1"
                  >
                    {fpLoading ? "처리 중..." : "임시 비밀번호 발급"}
                  </button>
                </form>
              )}
            </div>
            <div className="border-t border-[#e5e5e5] px-6 py-3 flex justify-end">
              <button onClick={() => setModal(null)} className="text-xs text-[#888] hover:text-[#111] transition-colors">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
