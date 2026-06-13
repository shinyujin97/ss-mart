import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata = { title: "쿠폰함 | 마이페이지" };

export default async function CouponsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const coupons = await prisma.memberCoupon.findMany({
    where: { memberId: session.user.id as string },
    include: { coupon: true },
    orderBy: { createdAt: "desc" },
  });

  const available = coupons.filter((c) => !c.usedAt && new Date(c.expiresAt) > new Date());
  const used = coupons.filter((c) => c.usedAt);
  const expired = coupons.filter((c) => !c.usedAt && new Date(c.expiresAt) <= new Date());

  const DISCOUNT_TYPE_LABELS: Record<string, string> = {
    FIXED_AMOUNT: "원 할인",
    PERCENTAGE: "% 할인",
    FREE_SHIPPING: "무료 배송",
    FREE_EMBROIDERY: "자수 무료",
  };

  const CouponCard = ({ mc, dim }: { mc: typeof coupons[0]; dim?: boolean }) => (
    <div className={`border p-5 ${dim ? "border-[var(--line)] bg-[var(--gray-50)] opacity-60" : "border-[var(--red)]/30 bg-white"}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-[var(--font-mono)] text-[10px] text-[var(--red)] tracking-[1px] mb-1">{mc.coupon.code}</div>
          <div className="text-sm font-black">{mc.coupon.name}</div>
        </div>
        <div className="text-right">
          <div className="font-[var(--font-display)] text-2xl text-[var(--red)]">
            {mc.coupon.discountValue.toLocaleString()}
            <span className="text-sm font-normal">{DISCOUNT_TYPE_LABELS[mc.coupon.discountType] ?? ""}</span>
          </div>
        </div>
      </div>
      <div className="text-xs text-[var(--gray-500)] font-[var(--font-mono)] space-y-1 pt-3 border-t border-dashed border-[var(--line)]">
        <div className="flex justify-between">
          <span>최소 주문금액</span>
          <span>{mc.coupon.minOrderAmount.toLocaleString()}원 이상</span>
        </div>
        {mc.coupon.maxDiscountAmount && (
          <div className="flex justify-between">
            <span>최대 할인</span>
            <span>{mc.coupon.maxDiscountAmount.toLocaleString()}원</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>유효기간</span>
          <span>{new Date(mc.expiresAt).toLocaleDateString("ko-KR")}까지</span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black">쿠폰함</h2>
        <span className="font-[var(--font-mono)] text-xs text-[var(--gray-500)]">
          사용 가능 <strong className="text-[var(--red)]">{available.length}</strong>장
        </span>
      </div>

      {/* 사용 가능 쿠폰 */}
      {available.length > 0 && (
        <div className="mb-5">
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--black)] font-bold tracking-[1px] mb-2">
            사용 가능 ({available.length}장)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {available.map((mc) => <CouponCard key={mc.id} mc={mc} />)}
          </div>
        </div>
      )}

      {/* 사용 완료 */}
      {used.length > 0 && (
        <div className="mb-5">
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--gray-500)] font-bold tracking-[1px] mb-2">
            사용 완료 ({used.length}장)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {used.map((mc) => <CouponCard key={mc.id} mc={mc} dim />)}
          </div>
        </div>
      )}

      {coupons.length === 0 && (
        <div className="border border-[var(--line)] bg-white py-20 text-center">
          <div className="font-[var(--font-display)] text-[60px] text-[var(--gray-100)] leading-none mb-4">COUPON</div>
          <p className="text-sm text-[var(--gray-400)]">보유한 쿠폰이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
