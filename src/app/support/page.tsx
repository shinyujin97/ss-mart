import Link from "next/link";
import type { Metadata } from "next";
import SupportTabs from "./SupportTabs";

export const metadata: Metadata = {
  title: "고객 지원 | 에스에스종합상사",
  description: "공지사항, FAQ, 1:1 문의. 에스에스종합상사 고객 지원 센터.",
};

export default function SupportPage() {
  return (
    <div className="bg-[var(--gray-50)] min-h-screen">
      {/* 헤더 */}
      <section className="bg-[var(--black)] text-white py-12">
        <div className="max-w-[1340px] mx-auto px-6 flex items-center justify-between">
          <div>
            <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[3px] mb-2">CUSTOMER SUPPORT</div>
            <h1 className="text-[36px] font-black tracking-tight">고객 지원</h1>
          </div>
          {/* CS 연락처 */}
          <div className="flex gap-6">
            {[
              { label: "전화 상담", value: "031-430-0497", sub: "평일 09:00~18:00" },
              { label: "카카오 채널", value: "@ssmart", sub: "30분 내 답변" },
              { label: "이메일", value: "contact@ssmart.kr", sub: "1영업일 내" },
            ].map((c) => (
              <div key={c.label} className="text-center border-l border-[#333] pl-6 first:border-l-0 first:pl-0">
                <div className="font-[var(--font-mono)] text-[10px] text-white/40 tracking-[1px] mb-1">{c.label}</div>
                <div className="font-[var(--font-display)] text-xl text-[var(--yellow)]">{c.value}</div>
                <div className="text-[11px] text-white/50 mt-0.5">{c.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-[1340px] mx-auto px-6 py-6">
        <SupportTabs />
      </div>
    </div>
  );
}
