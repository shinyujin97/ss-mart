"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

type MemberType = "INDIVIDUAL" | "BUSINESS";

const STEPS = [
  { num: "01", label: "STEP / 01", name: "약관 동의" },
  { num: "02", label: "STEP / 02", name: "정보 입력" },
  { num: "03", label: "STEP / 03", name: "이메일 인증" },
  { num: "04", label: "STEP / 04", name: "가입 완료" },
];

const TERMS = [
  { id: "service", label: "이용약관 동의", required: true },
  { id: "privacy", label: "개인정보 처리방침 동의", required: true },
  { id: "age", label: "만 14세 이상 확인", required: true },
  { id: "marketing_email", label: "이메일 마케팅 수신 동의", required: false },
  { id: "marketing_sms", label: "SMS 마케팅 수신 동의", required: false },
];

export default function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [memberType, setMemberType] = useState<MemberType>("INDIVIDUAL");
  const [agreed, setAgreed] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    name: "",
    phone: "",
    // 사업자
    companyName: "",
    businessNumber: "",
    representativeName: "",
    taxInvoiceEmail: "",
  });

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAll() {
    const allChecked = TERMS.every((t) => agreed[t.id]);
    const next: Record<string, boolean> = {};
    TERMS.forEach((t) => (next[t.id] = !allChecked));
    setAgreed(next);
  }

  function canProceedStep1() {
    return TERMS.filter((t) => t.required).every((t) => agreed[t.id]);
  }

  function canProceedStep2() {
    const base =
      form.email && form.password && form.password === form.passwordConfirm &&
      form.name && form.phone && form.password.length >= 6;
    if (memberType === "BUSINESS") {
      return base && form.companyName && form.businessNumber;
    }
    return !!base;
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          phone: form.phone,
          type: memberType,
          marketingEmail: agreed["marketing_email"] ?? false,
          marketingSms: agreed["marketing_sms"] ?? false,
          ...(memberType === "BUSINESS"
            ? {
                businessInfo: {
                  companyName: form.companyName,
                  businessNumber: form.businessNumber,
                  representativeName: form.representativeName || form.name,
                  taxInvoiceEmail: form.taxInvoiceEmail || form.email,
                },
              }
            : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "회원가입에 실패했습니다.");
        return;
      }

      // 자동 로그인
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      setStep(4);
    } catch {
      setError("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[900px] mx-auto px-6 pb-16">
      {/* 스텝 진행 바 */}
      <div className="grid grid-cols-4 border border-[var(--line)] mb-8">
        {STEPS.map((s, i) => {
          const num = i + 1;
          const isDone = step > num;
          const isActive = step === num;
          return (
            <div
              key={s.num}
              className={`px-4 py-3.5 flex items-center gap-3 border-r border-[var(--line)] last:border-r-0 ${
                isActive
                  ? "bg-[var(--black)] text-white"
                  : isDone
                  ? "bg-white"
                  : "bg-[var(--gray-50)]"
              }`}
            >
              <span
                className={`font-[var(--font-display)] text-[22px] leading-none ${
                  isActive
                    ? "text-[var(--yellow)]"
                    : isDone
                    ? "text-[var(--gray-500)]"
                    : "text-[var(--gray-300)]"
                }`}
              >
                {s.num}
              </span>
              <div>
                <div
                  className={`font-[var(--font-mono)] text-[9px] tracking-[1px] ${
                    isActive ? "text-white/60" : "text-[var(--gray-500)]"
                  }`}
                >
                  {s.label}
                </div>
                <div className="text-xs font-bold">{s.name}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 회원 유형 탭 (step 1~3에만 표시) */}
      {step < 4 && (
        <div className="flex border-b-2 border-[var(--black)] mb-6">
          {(["INDIVIDUAL", "BUSINESS"] as const).map((t, i) => (
            <button
              key={t}
              onClick={() => setMemberType(t)}
              className={`flex-1 py-3.5 text-sm font-bold transition-all relative ${
                memberType === t
                  ? "text-[var(--black)]"
                  : "text-[var(--gray-500)] hover:text-[var(--black)]"
              }`}
            >
              <span
                className={`font-[var(--font-mono)] text-[10px] mr-1.5 ${
                  memberType === t ? "text-[var(--red)]" : "text-[var(--gray-300)]"
                }`}
              >
                /{String(i + 1).padStart(2, "0")}
              </span>
              {t === "INDIVIDUAL" ? "개인 회원" : "법인 / 사업자 회원"}
              {memberType === t && (
                <span className="absolute bottom-[-2px] left-0 right-0 h-1 bg-[var(--red)]" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* STEP 1: 약관 동의 */}
      {step === 1 && (
        <div className="bg-white border border-[var(--line)] p-6">
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--red)] tracking-[1.5px] mb-1">
            STEP / 01
          </div>
          <h2 className="text-xl font-black mb-6">약관 동의</h2>

          {/* 전체 동의 */}
          <button
            onClick={toggleAll}
            className="w-full flex items-center gap-3 p-4 border-2 border-[var(--black)] bg-[var(--gray-50)] mb-4 hover:bg-[var(--gray-100)] transition-colors"
          >
            <span
              className={`w-5 h-5 border-2 flex items-center justify-center text-xs font-bold ${
                TERMS.every((t) => agreed[t.id])
                  ? "border-[var(--red)] bg-[var(--red)] text-white"
                  : "border-[var(--gray-300)]"
              }`}
            >
              ✓
            </span>
            <span className="font-bold text-sm">전체 동의 (필수 + 선택)</span>
          </button>

          <div className="divide-y divide-[var(--line)] border border-[var(--line)]">
            {TERMS.map((t) => (
              <label
                key={t.id}
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-[var(--gray-50)] transition-colors"
              >
                <span
                  className={`w-4 h-4 border-2 flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    agreed[t.id]
                      ? "border-[var(--red)] bg-[var(--red)] text-white"
                      : "border-[var(--gray-300)]"
                  }`}
                  onClick={() =>
                    setAgreed((prev) => ({ ...prev, [t.id]: !prev[t.id] }))
                  }
                >
                  ✓
                </span>
                <span className="text-sm flex-1">{t.label}</span>
                {t.required ? (
                  <span className="text-[var(--red)] font-[var(--font-mono)] text-[10px]">
                    필수
                  </span>
                ) : (
                  <span className="text-[var(--gray-400)] font-[var(--font-mono)] text-[10px]">
                    선택
                  </span>
                )}
              </label>
            ))}
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!canProceedStep1()}
            className="w-full mt-6 bg-[var(--black)] text-white py-4 font-bold text-sm tracking-[0.5px] hover:bg-[var(--gray-900)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            다음 단계 →
          </button>
        </div>
      )}

      {/* STEP 2: 정보 입력 */}
      {step === 2 && (
        <div className="space-y-3">
          {/* 기본 정보 */}
          <div className="bg-white border border-[var(--line)]">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--line)] bg-[var(--gray-50)]">
              <span className="font-[var(--font-mono)] text-[10px] text-[var(--red)] border border-[var(--red)] px-2 py-0.5 font-bold tracking-[1.5px]">
                SECTION / 01
              </span>
              <span className="text-sm font-black">기본 정보</span>
            </div>
            <div className="p-6 space-y-4">
              {[
                { key: "name", label: "이름", type: "text", placeholder: "실명 입력", required: true },
                { key: "phone", label: "휴대폰 번호", type: "tel", placeholder: "010-0000-0000", required: true },
              ].map((f) => (
                <div key={f.key} className="grid grid-cols-[130px_1fr] gap-3.5 items-center">
                  <label className="text-xs font-semibold text-[var(--gray-700)]">
                    {f.label} {f.required && <span className="text-[var(--red)]">*</span>}
                  </label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) => updateForm(f.key, e.target.value)}
                    className="px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)] w-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 로그인 정보 */}
          <div className="bg-white border border-[var(--line)]">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--line)] bg-[var(--gray-50)]">
              <span className="font-[var(--font-mono)] text-[10px] text-[var(--red)] border border-[var(--red)] px-2 py-0.5 font-bold tracking-[1.5px]">
                SECTION / 02
              </span>
              <span className="text-sm font-black">로그인 정보</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-[130px_1fr] gap-3.5 items-center">
                <label className="text-xs font-semibold text-[var(--gray-700)]">
                  이메일 <span className="text-[var(--red)]">*</span>
                </label>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  className="px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)] w-full"
                />
              </div>
              <div className="grid grid-cols-[130px_1fr] gap-3.5 items-center">
                <label className="text-xs font-semibold text-[var(--gray-700)]">
                  비밀번호 <span className="text-[var(--red)]">*</span>
                </label>
                <div>
                  <input
                    type="password"
                    placeholder="6자 이상"
                    value={form.password}
                    onChange={(e) => updateForm("password", e.target.value)}
                    className="px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)] w-full"
                  />
                  {form.password && form.password.length < 6 && (
                    <p className="font-[var(--font-mono)] text-[11px] text-[var(--red)] mt-1">
                      비밀번호는 6자 이상이어야 합니다.
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-[130px_1fr] gap-3.5 items-center">
                <label className="text-xs font-semibold text-[var(--gray-700)]">
                  비밀번호 확인 <span className="text-[var(--red)]">*</span>
                </label>
                <div>
                  <input
                    type="password"
                    placeholder="비밀번호 재입력"
                    value={form.passwordConfirm}
                    onChange={(e) => updateForm("passwordConfirm", e.target.value)}
                    className="px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)] w-full"
                  />
                  {form.passwordConfirm && form.password !== form.passwordConfirm && (
                    <p className="font-[var(--font-mono)] text-[11px] text-[var(--red)] mt-1">
                      비밀번호가 일치하지 않습니다.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 사업자 정보 (BUSINESS만) */}
          {memberType === "BUSINESS" && (
            <div className="bg-white border border-[var(--line)]">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--line)] bg-[var(--gray-50)]">
                <span className="font-[var(--font-mono)] text-[10px] text-[var(--red)] border border-[var(--red)] px-2 py-0.5 font-bold tracking-[1.5px]">
                  SECTION / 03
                </span>
                <span className="text-sm font-black">사업자 정보</span>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { key: "companyName", label: "회사명", placeholder: "회사명 입력", required: true },
                  { key: "businessNumber", label: "사업자등록번호", placeholder: "000-00-00000", required: true },
                  { key: "representativeName", label: "대표자명", placeholder: "대표자 성명", required: false },
                  { key: "taxInvoiceEmail", label: "세금계산서 이메일", placeholder: "tax@company.com", required: false },
                ].map((f) => (
                  <div key={f.key} className="grid grid-cols-[130px_1fr] gap-3.5 items-center">
                    <label className="text-xs font-semibold text-[var(--gray-700)]">
                      {f.label} {f.required && <span className="text-[var(--red)]">*</span>}
                    </label>
                    <input
                      type="text"
                      placeholder={f.placeholder}
                      value={form[f.key as keyof typeof form]}
                      onChange={(e) => updateForm(f.key, e.target.value)}
                      className="px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)] w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-[var(--red)] text-xs font-[var(--font-mono)] px-1">
              ✕ {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-8 py-4 border-2 border-[var(--black)] text-sm font-bold hover:bg-[var(--gray-50)] transition-colors"
            >
              ← 이전
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canProceedStep2() || loading}
              className="flex-1 bg-[var(--red)] text-white py-4 font-bold text-sm tracking-[0.5px] hover:bg-[var(--red-dark)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "처리 중..." : "가입 완료 →"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: 가입 완료 */}
      {step === 4 && (
        <div className="bg-white border border-[var(--line)] p-16 text-center">
          <div className="font-[var(--font-display)] text-[80px] text-[var(--gray-100)] leading-none mb-6">
            WELCOME
          </div>
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[3px] mb-3">
            ─ SIGNUP COMPLETE
          </div>
          <h2 className="text-2xl font-black mb-2">{form.name}님, 환영합니다!</h2>
          <p className="text-sm text-[var(--gray-500)] mb-10">
            2,000P가 즉시 적립되었습니다.
          </p>

          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            <button
              onClick={() => router.push("/")}
              className="py-4 border-2 border-[var(--black)] text-sm font-bold hover:bg-[var(--gray-50)] transition-colors"
            >
              쇼핑 시작 →
            </button>
            <button
              onClick={() => router.push("/mypage")}
              className="py-4 bg-[var(--black)] text-white text-sm font-bold hover:bg-[var(--gray-900)] transition-colors"
            >
              마이페이지
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
