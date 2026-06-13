import type { Metadata } from "next";

export const metadata: Metadata = { title: "이용약관 | 에스에스종합상사" };

export default function TermsPage() {
  return (
    <div className="max-w-[800px] mx-auto px-4 md:px-6 py-12">
      <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[2px] mb-2">LEGAL</div>
      <h1 className="text-2xl font-black mb-8">이용약관</h1>
      <div className="prose prose-sm max-w-none space-y-6 text-sm text-[var(--gray-700)] leading-relaxed">
        <section>
          <h2 className="text-base font-black text-[var(--black)] mb-3">제1조 (목적)</h2>
          <p>이 약관은 ㈜에스에스종합상사(이하 "회사")가 운영하는 SS Mart(이하 "쇼핑몰")에서 제공하는 인터넷 관련 서비스를 이용함에 있어 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
        </section>
        <section>
          <h2 className="text-base font-black text-[var(--black)] mb-3">제2조 (정의)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>"쇼핑몰"이란 회사가 재화 또는 용역을 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 재화 또는 용역을 거래할 수 있도록 설정한 가상의 영업장을 말합니다.</li>
            <li>"이용자"란 쇼핑몰에 접속하여 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-base font-black text-[var(--black)] mb-3">제3조 (약관의 효력 및 변경)</h2>
          <p>이 약관은 쇼핑몰에 공시함으로써 효력이 발생하며, 회사는 합리적인 사유가 있는 경우 관련 법령을 위배하지 않는 범위 내에서 변경할 수 있습니다.</p>
        </section>
        <section>
          <h2 className="text-base font-black text-[var(--black)] mb-3">제17조 (청약 철회)</h2>
          <p>① 이용자는 구매한 재화 등을 수령한 날로부터 7일 이내에 청약 철회를 할 수 있습니다.</p>
          <p>② 다음 각 호의 경우에는 청약 철회를 할 수 없습니다:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>이용자에게 책임이 있는 사유로 재화가 멸실되거나 훼손된 경우</li>
            <li>이용자의 사용 또는 일부 소비로 재화의 가치가 현저히 감소한 경우</li>
            <li><strong className="text-[var(--red)]">자수 · 마킹 등 소비자의 주문에 따라 개별적으로 생산된 재화의 경우 (전자상거래법 제17조 제2항 제5호)</strong></li>
          </ul>
        </section>
      </div>
      <div className="mt-10 pt-6 border-t border-[var(--line)] font-[var(--font-mono)] text-[11px] text-[var(--gray-400)]">
        시행일: 2026년 04월 26일
      </div>
    </div>
  );
}
