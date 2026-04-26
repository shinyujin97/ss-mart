import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata = { title: "배송지 관리 | 마이페이지" };

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const addresses = await prisma.address.findMany({
    where: { memberId: session.user.id as string },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black">배송지 관리</h2>
        <button className="bg-[var(--black)] text-white px-4 py-2 text-xs font-bold hover:bg-[var(--gray-900)] transition-colors">
          + 배송지 추가
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="border border-[var(--line)] bg-white py-16 text-center">
          <div className="text-sm text-[var(--gray-400)] mb-4">등록된 배송지가 없습니다.</div>
          <button className="bg-[var(--black)] text-white px-6 py-3 text-sm font-bold hover:bg-[var(--gray-900)]">
            배송지 추가하기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className={`border bg-white p-5 ${addr.isDefault ? "border-[var(--black)]" : "border-[var(--line)]"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black">{addr.label}</span>
                  {addr.isDefault && (
                    <span className="font-[var(--font-mono)] text-[9px] bg-[var(--black)] text-white px-2 py-0.5 font-bold tracking-[0.5px]">
                      기본
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button className="text-[10px] px-3 py-1.5 border border-[var(--line)] font-[var(--font-mono)] hover:border-[var(--black)] transition-colors">수정</button>
                  <button className="text-[10px] px-3 py-1.5 border border-[var(--line)] font-[var(--font-mono)] hover:border-[var(--red)] hover:text-[var(--red)] transition-colors">삭제</button>
                </div>
              </div>
              <div className="text-sm text-[var(--gray-700)]">
                <div className="font-semibold mb-0.5">{addr.recipientName} · {addr.recipientPhone}</div>
                <div className="text-[var(--gray-500)]">({addr.zipCode}) {addr.address} {addr.addressDetail}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
