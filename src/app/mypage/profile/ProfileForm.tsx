"use client";

import { useState } from "react";

interface Props {
  member: {
    loginId?: string;
    name: string;
    email: string | null;
    phone: string;
    birthDate: Date | null;
    gender: string | null;
    marketingEmail: boolean;
    marketingSms: boolean;
  };
}

export default function ProfileForm({ member }: Props) {
  const [name, setName] = useState(member.name);
  const [phone, setPhone] = useState(member.phone);
  const [marketingEmail, setMarketingEmail] = useState(member.marketingEmail);
  const [marketingSms, setMarketingSms] = useState(member.marketingSms);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const InputRow = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="grid grid-cols-[140px_1fr] gap-3.5 items-center py-2 border-b border-[var(--line)] last:border-b-0">
      <label className="text-xs font-semibold text-[var(--gray-700)]">
        {label} {required && <span className="text-[var(--red)]">*</span>}
      </label>
      {children}
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="border border-[var(--line)] bg-white mb-3">
        <div className="px-5 py-3.5 bg-[var(--gray-50)] border-b border-[var(--line)]">
          <span className="font-[var(--font-mono)] text-[10px] text-[var(--red)] border border-[var(--red)] px-2 py-0.5 font-bold tracking-[1.5px]">
            SECTION / 01
          </span>
          <span className="text-sm font-black ml-3">기본 정보</span>
        </div>
        <div className="px-6 py-4">
          <InputRow label="이름" required>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)] w-full" />
          </InputRow>
          <InputRow label="이메일">
            <span className="text-sm text-[var(--gray-500)] font-[var(--font-mono)]">{member.email} (변경 불가)</span>
          </InputRow>
          <InputRow label="휴대폰" required>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="px-3 py-2.5 border border-[var(--line)] text-sm outline-none focus:border-[var(--black)] w-full" />
          </InputRow>
        </div>
      </div>

      <div className="border border-[var(--line)] bg-white mb-3">
        <div className="px-5 py-3.5 bg-[var(--gray-50)] border-b border-[var(--line)]">
          <span className="font-[var(--font-mono)] text-[10px] text-[var(--red)] border border-[var(--red)] px-2 py-0.5 font-bold tracking-[1.5px]">
            SECTION / 02
          </span>
          <span className="text-sm font-black ml-3">마케팅 수신 동의</span>
        </div>
        <div className="px-6 py-4 space-y-3">
          {[
            { label: "이메일 마케팅 수신", value: marketingEmail, setter: setMarketingEmail },
            { label: "SMS 마케팅 수신", value: marketingSms, setter: setMarketingSms },
          ].map((opt) => (
            <label key={opt.label} className="flex items-center gap-3 cursor-pointer">
              <span
                onClick={() => opt.setter(!opt.value)}
                className={`w-4 h-4 border-2 flex items-center justify-center text-[9px] font-bold ${opt.value ? "border-[var(--red)] bg-[var(--red)] text-white" : "border-[var(--gray-300)]"}`}
              >
                {opt.value && "✓"}
              </span>
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-[var(--black)] text-white py-4 font-bold text-sm tracking-[0.5px] hover:bg-[var(--gray-900)] transition-colors"
      >
        {saved ? "저장 완료 ✓" : "저장하기"}
      </button>
    </form>
  );
}
