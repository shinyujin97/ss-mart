import type { Metadata } from "next";

export const metadata: Metadata = { title: "개인정보처리방침 | 에스에스종합상사" };

export default function PrivacyPage() {
  const ITEMS = [
    {
      title: "1. 수집하는 개인정보 항목",
      content: "회원가입: 이메일, 비밀번호, 이름, 휴대폰 번호\n사업자 회원: 상기 항목 + 회사명, 사업자등록번호, 대표자명\n주문/결제: 배송지 정보, 결제 정보 (PG사 위임, 당사 미보유)\n자동 수집: IP 주소, 쿠키, 접속 로그",
    },
    {
      title: "2. 개인정보 수집 및 이용 목적",
      content: "회원 관리, 주문/배송 처리, 자수·마킹 시안 제작, 단체주문 견적 처리, 고객 상담 및 불만 처리, 법령상 의무 이행",
    },
    {
      title: "3. 개인정보 보유 및 이용 기간",
      content: "회원 탈퇴 시 즉시 삭제 (단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관)\n전자상거래법: 계약/청약 철회 기록 5년, 대금 결제 기록 5년\n통신비밀보호법: 로그 기록 3개월",
    },
    {
      title: "4. 개인정보의 제3자 제공",
      content: "원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.\n단, 배송을 위해 물류 업체에 배송에 필요한 최소 정보(이름, 주소, 연락처)를 제공합니다.",
    },
    {
      title: "5. 이용자의 권리",
      content: "이용자는 언제든지 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다.\n마이페이지 > 회원 정보 수정에서 직접 변경하거나, 고객센터(031-430-0497)로 문의해 주세요.",
    },
  ];

  return (
    <div className="max-w-[800px] mx-auto px-6 py-12">
      <div className="font-[var(--font-mono)] text-[11px] text-[var(--red)] tracking-[2px] mb-2">LEGAL</div>
      <h1 className="text-2xl font-black mb-8">개인정보처리방침</h1>
      <div className="space-y-6">
        {ITEMS.map((item) => (
          <section key={item.title} className="border border-[var(--line)] p-6">
            <h2 className="text-sm font-black text-[var(--black)] mb-3">{item.title}</h2>
            <p className="text-sm text-[var(--gray-700)] leading-relaxed whitespace-pre-line">{item.content}</p>
          </section>
        ))}
      </div>
      <div className="mt-8 p-5 bg-[var(--gray-50)] border border-[var(--line)]">
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--gray-500)] space-y-1">
          <div>개인정보보호책임자: ○○○ (contact@ssmart.kr)</div>
          <div>시행일: 2026년 04월 26일</div>
        </div>
      </div>
    </div>
  );
}
