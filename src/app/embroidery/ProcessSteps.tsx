"use client";

import { useEffect, useRef, useState } from "react";

const PROCESS_STEPS = [
  { num: "01", title: "시안 신청",         desc: "원하시는 자수 위치와 크기를 시뮬레이터에서 직접 잡아보세요. 로고 이미지나 텍스트, 색상 요청까지 함께 남겨주시면 됩니다.", note: "오리지널 또는 자체 보유 디자인만 가능" },
  { num: "02", title: "접수 및 작업 시작", desc: "신청 내용을 확인한 뒤 영업일 2시간 이내로 작업을 시작합니다. 추가로 궁금한 점은 카카오 채널로 먼저 연락드립니다.", note: "작업 착수 48시간 이내" },
  { num: "03", title: "1차 시안 전달",     desc: "고객님 디자인을 바탕으로 제작한 1차 시안을 카카오 채널로 보내드립니다. 마음에 드시면 확정, 수정이 필요하면 편하게 말씀해주세요.", note: "횟수 제한 없이 무료 수정" },
  { num: "04", title: "2차 시안 확인",     desc: "수정 반영된 2차 시안을 다시 확인해 주세요. 1차·2차 중 더 마음에 드는 쪽으로 최종 확정하시면 됩니다.", note: "확정 전까지 언제든 변경 가능" },
  { num: "05", title: "자수 제작",         desc: "시안이 확정되면 바로 자수 작업에 들어갑니다. 벌 수에 따라 소요 기간이 달라지니 여유 있게 신청해 주시면 좋습니다.", note: "1~10벌 3~5일 / 10~99벌 5~7일 / 100벌+ 7~14일" },
  { num: "06", title: "검수 후 출고",      desc: "완성된 자수를 꼼꼼히 확인한 뒤 발송합니다. 품질 이상이 있으면 무조건 다시 만들어 드립니다.", note: "배송비 별도" },
];

export default function ProcessSteps() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // 진입 후 순차적으로 active 인덱스 증가 (라인 진행 효과)
  useEffect(() => {
    if (!visible) return;
    let i = 0;
    const interval = setInterval(() => {
      setActive(i);
      i++;
      if (i >= PROCESS_STEPS.length) clearInterval(interval);
    }, 160);
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <div ref={ref} className="relative">

      {/* 상단 진행 라인 */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#f0f0f0] z-10" />
      <div
        className="absolute top-0 left-0 h-[3px] bg-[#c8161d] z-10 transition-all ease-out"
        style={{
          width: visible ? "100%" : "0%",
          transitionDuration: `${PROCESS_STEPS.length * 160 + 200}ms`,
        }}
      />

      {/* 스텝 그리드 */}
      <div className="grid grid-cols-6 border border-[#e5e5e5]">
        {PROCESS_STEPS.map((s, i) => {
          const isActive = i <= active;
          return (
            <div
              key={s.num}
              className={`p-5 relative group cursor-default transition-all duration-500 ease-out
                ${i < 5 ? "border-r border-[#e5e5e5]" : ""}
                hover:bg-[#fafafa]
              `}
              style={{
                opacity: isActive ? 1 : 0,
                transform: isActive ? "translateY(0)" : "translateY(16px)",
              }}
            >
              {/* 호버 시 왼쪽 빨간 라인 */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#c8161d] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />

              {/* 번호 */}
              <div
                className="font-[var(--font-mono)] text-[28px] font-black leading-none mb-4 transition-all duration-300"
                style={{ color: isActive ? "#c8161d" : "#ddd" }}
              >
                {s.num}
              </div>

              {/* 제목 */}
              <div className="text-sm font-black text-[#111] mb-2 group-hover:text-[#c8161d] transition-colors duration-200">
                {s.title}
              </div>

              {/* 설명 */}
              <div className="text-xs text-[#888] leading-relaxed mb-4">{s.desc}</div>

              {/* 노트 */}
              <div className="font-[var(--font-mono)] text-[9px] text-[#999] border-t border-[#e5e5e5] pt-3 group-hover:text-[#c8161d] transition-colors duration-200">
                {s.note}
              </div>

              {/* 하단 연결 도트 */}
              {i < PROCESS_STEPS.length - 1 && (
                <div
                  className="absolute -right-[5px] top-[22px] w-[9px] h-[9px] rounded-full border-2 border-[#e5e5e5] bg-white z-20 transition-all duration-300"
                  style={{
                    borderColor: isActive ? "#c8161d" : "#e5e5e5",
                    backgroundColor: isActive ? "#c8161d" : "white",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
