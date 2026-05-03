// 고객용 자수 시안 진행 단계 표시 (택배 추적 스타일)

const STEPS = [
  { key: "quote",       label: "견적 대기",   statuses: ["REVIEW_PENDING", "QUOTE_SENT"] },
  { key: "received",    label: "접수 완료",   statuses: ["QUOTE_APPROVED", "QUOTE_REJECTED"] },
  { key: "making",      label: "시안 제작 중", statuses: ["REVIEW_IN_PROGRESS", "REVISION_REQUESTED"] },
  { key: "review",      label: "시안 확인",   statuses: ["CUSTOMER_REVIEW"] },
  { key: "confirmed",   label: "시안 확정",   statuses: ["CONFIRMED"] },
  { key: "production",  label: "자수 제작 중", statuses: ["IN_PRODUCTION"] },
  { key: "done",        label: "완료",        statuses: ["COMPLETED"] },
];

function getStepIndex(status: string): number {
  if (["CANCELLED", "REJECTED", "DRAFT"].includes(status)) return -1;
  // COMPLETED는 모든 단계를 완료로 표시하기 위해 마지막 인덱스+1 반환
  if (status === "COMPLETED") return STEPS.length;
  for (let i = 0; i < STEPS.length; i++) {
    if (STEPS[i].statuses.includes(status)) return i;
  }
  return -1;
}

interface Props {
  status: string;
}

export default function DesignProgress({ status }: Props) {
  const currentIdx = getStepIndex(status);
  const isCancelled = ["CANCELLED", "REJECTED", "QUOTE_REJECTED", "DRAFT"].includes(status);

  if (isCancelled) {
    const label =
      status === "CANCELLED"      ? "취소된 시안" :
      status === "REJECTED"       ? "거부된 시안 (저작권 등)" :
      status === "QUOTE_REJECTED" ? "견적 거절 — 담당자가 재견적을 검토 중입니다" :
                                    "임시 저장";
    return (
      <div className="px-4 py-3 border-t border-[var(--line)] bg-[#fafafa]">
        <div className="font-[var(--font-mono)] text-[10px] text-[#bbb] text-center">{label}</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-t border-[var(--line)] bg-[#fafafa]">
      <div className="relative">
        {/* 연결선 */}
        <div className="absolute top-[11px] left-[11px] right-[11px] h-[2px] bg-[#e5e5e5]" />
        <div
          className="absolute top-[11px] left-[11px] h-[2px] bg-[#c8161d] transition-all duration-500"
          style={{ width: currentIdx <= 0 ? 0 : currentIdx >= STEPS.length ? "calc(100% - 22px)" : `calc(${(currentIdx / (STEPS.length - 1)) * 100}% - 22px)` }}
        />

        {/* 단계 점 */}
        <div className="relative flex justify-between">
          {STEPS.map((step, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div key={step.key} className="flex flex-col items-center gap-1.5">
                <div className={`w-[22px] h-[22px] flex items-center justify-center border-2 transition-all ${
                  done
                    ? "bg-[#c8161d] border-[#c8161d]"
                    : active
                    ? "bg-white border-[#c8161d]"
                    : "bg-white border-[#e0e0e0]"
                }`}>
                  {done ? (
                    <span className="text-white text-[9px] font-bold">✓</span>
                  ) : active ? (
                    <span className="w-2 h-2 bg-[#c8161d] block animate-pulse" />
                  ) : null}
                </div>
                <span className={`font-[var(--font-mono)] text-[8px] text-center leading-tight whitespace-nowrap ${
                  done ? "text-[#c8161d]" : active ? "text-[#111] font-bold" : "text-[#ccc]"
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {status === "COMPLETED" && (
        <div className="mt-3 text-center font-[var(--font-mono)] text-[10px] text-[#c8161d] font-bold tracking-[0.5px]">
          ✓ 제작 완료 — 배송은 3~7일 소요됩니다
        </div>
      )}
    </div>
  );
}
