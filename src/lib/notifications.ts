import { prisma } from "@/lib/prisma";

export async function createNotification({
  memberId,
  type,
  title,
  body,
  link,
}: {
  memberId?: string | null;
  type: string;
  title: string;
  body: string;
  link?: string;
}) {
  return prisma.notification.create({
    data: { memberId: memberId ?? null, type, title, body, link },
  });
}

// 자수 시안 상태 변경 → 유저 알림 메시지 매핑
export const EMBROIDERY_STATUS_NOTIFICATIONS: Record<
  string,
  { title: string; body: (designNumber: string) => string }
> = {
  CUSTOMER_REVIEW: {
    title: "자수 시안이 준비되었습니다",
    body: (n) => `시안 ${n} 1차 시안을 확인하고 승인 또는 수정 요청해 주세요.`,
  },
  REVISION_REQUESTED: {
    title: "자수 시안 수정 사항이 있습니다",
    body: (n) => `시안 ${n}에 수정 요청이 도착했습니다. 확인해 주세요.`,
  },
  CONFIRMED: {
    title: "자수 시안이 확정되었습니다",
    body: (n) => `시안 ${n}이 확정되어 제작 준비를 시작합니다.`,
  },
  IN_PRODUCTION: {
    title: "자수 제작이 시작되었습니다",
    body: (n) => `시안 ${n} 제작이 시작되었습니다. 완료 후 알려드립니다.`,
  },
  COMPLETED: {
    title: "자수 제작이 완료되었습니다 🎉",
    body: (n) => `시안 ${n} 제작이 완료되었습니다. 입력하신 주소로 배송이 시작되며, 배송은 3~7일 소요됩니다.`,
  },
  REJECTED: {
    title: "자수 시안이 반려되었습니다",
    body: (n) => `시안 ${n}이 반려되었습니다. 새로 시안을 만들어 주세요.`,
  },
  CANCELLED: {
    title: "자수 시안이 취소되었습니다",
    body: (n) => `시안 ${n}이 취소 처리되었습니다.`,
  },
};
