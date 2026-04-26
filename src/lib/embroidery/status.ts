type EmbroideryStatus =
  | "DRAFT" | "REVIEW_PENDING" | "REVIEW_IN_PROGRESS"
  | "CUSTOMER_REVIEW" | "REVISION_REQUESTED" | "CONFIRMED"
  | "IN_PRODUCTION" | "COMPLETED" | "CANCELLED" | "REJECTED";

const ALLOWED_TRANSITIONS: Record<EmbroideryStatus, EmbroideryStatus[]> = {
  DRAFT:               ["REVIEW_PENDING", "CANCELLED"],
  REVIEW_PENDING:      ["REVIEW_IN_PROGRESS", "REJECTED", "CANCELLED"],
  REVIEW_IN_PROGRESS:  ["CUSTOMER_REVIEW", "REJECTED"],
  CUSTOMER_REVIEW:     ["REVISION_REQUESTED", "CONFIRMED", "CANCELLED"],
  REVISION_REQUESTED:  ["REVIEW_IN_PROGRESS", "CUSTOMER_REVIEW"],
  CONFIRMED:           ["IN_PRODUCTION"],
  IN_PRODUCTION:       ["COMPLETED", "CANCELLED"],
  COMPLETED:           [],
  CANCELLED:           [],
  REJECTED:            [],
};

export const STATUS_LABELS: Record<EmbroideryStatus, string> = {
  DRAFT:               "임시 저장",
  REVIEW_PENDING:      "디자이너 검토 대기",
  REVIEW_IN_PROGRESS:  "검토 중",
  CUSTOMER_REVIEW:     "시안 확인 대기",
  REVISION_REQUESTED:  "수정 요청",
  CONFIRMED:           "시안 확정",
  IN_PRODUCTION:       "자수 작업 중",
  COMPLETED:           "작업 완료",
  CANCELLED:           "취소",
  REJECTED:            "거부 (저작권 등)",
};

export function canTransition(from: EmbroideryStatus, to: EmbroideryStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: EmbroideryStatus, to: EmbroideryStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`허용되지 않은 상태 변경: ${from} → ${to}`);
  }
}

// 환불 가능 여부 — 자수 시안 확정 전까지만
export function isRefundable(status: EmbroideryStatus): boolean {
  return ["DRAFT", "REVIEW_PENDING", "REVIEW_IN_PROGRESS", "CUSTOMER_REVIEW", "REVISION_REQUESTED"].includes(status);
}
