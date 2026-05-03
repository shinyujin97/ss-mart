"use client";

import { useEffect, useRef, useState } from "react";

const FLOW = [
  {
    code: "RECEIPT",
    label: "접수",
    title: "신청 접수",
    desc: "시뮬레이터에서\n시안 신청 완료",
    day: "D+0",
    color: "#c8161d",
  },
  {
    code: "REVIEW",
    label: "검토",
    title: "접수 검토",
    desc: "저작권 확인 후\n작업 착수 안내",
    day: "D+1",
    color: "#c8161d",
  },
  {
    code: "DRAFT1",
    label: "1차 시안",
    title: "1차 시안 제작",
    desc: "디자인 기반\n초안 제작 전달",
    day: "D+1~2",
    color: "#c8161d",
  },
  {
    code: "CONFIRM",
    label: "확인·수정",
    title: "고객 검토",
    desc: "수정 요청 반영\n무제한 무료 수정",
    day: "D+2~3",
    color: "#ffd400",
    highlight: true,
  },
  {
    code: "FINAL",
    label: "시안 확정",
    title: "최종 확정",
    desc: "고객 승인 후\n제작 착수",
    day: "D+3",
    color: "#c8161d",
  },
  {
    code: "PRODUCTION",
    label: "제작",
    title: "자수 제작",
    desc: "수량별 3~14일\n작업 진행",
    day: "D+3~14",
    color: "#c8161d",
  },
  {
    code: "QC",
    label: "검수",
    title: "품질 검수",
    desc: "전수 검사 후\n이상 시 재제작",
    day: "D+14",
    color: "#c8161d",
  },
  {
    code: "SHIP",
    label: "출고",
    title: "포장·출고",
    desc: "전국 무료 배송\n1~2일 도착",
    day: "D+15",
    color: "#ffd400",
    highlight: true,
  },
];

export default function ProcessFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [lineWidth, setLineWidth] = useState(0);
  const [nodeIdx, setNodeIdx] = useState(-1);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    // 라인 먼저 그리고
    const lineTimer = setTimeout(() => setLineWidth(100), 100);
    // 노드 순차 등장
    let i = 0;
    const nodeTimer = setInterval(() => {
      setNodeIdx(i);
      i++;
      if (i >= FLOW.length) clearInterval(nodeTimer);
    }, 130);
    return () => {
      clearTimeout(lineTimer);
      clearInterval(nodeTimer);
    };
  }, [visible]);

  return (
    <section ref={ref} className="bg-[#0d0d0d] py-16 overflow-hidden">
      <div className="max-w-[1340px] mx-auto px-6">

        {/* 헤더 */}
        <div className="text-center mb-14">
          <div className="font-[var(--font-mono)] text-[11px] text-[#c8161d] tracking-[2px] mb-3">
            SECTION / 01-B ─ PRODUCTION FLOW
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white">
            자수 제작 <span className="text-[#ffd400]">진행 과정</span>
          </h2>
          <p className="font-[var(--font-mono)] text-[11px] text-white/30 mt-3">
            신청부터 출고까지 평균 7~15일 소요
          </p>
        </div>

        {/* 타임라인 */}
        <div className="relative">

          {/* 배경 연결선 (회색) */}
          <div className="absolute top-[28px] left-[6%] right-[6%] h-[2px] bg-white/10" />

          {/* 진행 연결선 (빨간색, 애니메이션) */}
          <div
            className="absolute top-[28px] left-[6%] h-[2px] bg-[#c8161d] transition-all ease-out"
            style={{
              width: `${lineWidth * 0.88}%`,
              transitionDuration: `${FLOW.length * 130 + 300}ms`,
            }}
          />

          {/* 노드 */}
          <div className="grid grid-cols-8 gap-2">
            {FLOW.map((step, i) => {
              const isVisible = i <= nodeIdx;
              return (
                <div
                  key={step.code}
                  className="flex flex-col items-center group cursor-default"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.9)",
                    transition: "opacity 0.4s ease, transform 0.4s ease",
                  }}
                >
                  {/* 노드 원 */}
                  <div
                    className="relative w-14 h-14 flex items-center justify-center z-10 mb-4 transition-transform duration-200 group-hover:scale-110"
                    style={{
                      background: step.highlight ? "#ffd400" : "#c8161d",
                      boxShadow: isVisible
                        ? step.highlight
                          ? "0 0 20px rgba(255,212,0,0.4)"
                          : "0 0 20px rgba(200,22,29,0.4)"
                        : "none",
                      transition: "box-shadow 0.5s ease",
                    }}
                  >
                    <span className="font-[var(--font-mono)] text-[10px] font-black text-white text-center leading-tight px-1">
                      {step.label}
                    </span>
                  </div>

                  {/* 제목 */}
                  <div className="font-black text-white text-[12px] text-center mb-1 group-hover:text-[#c8161d] transition-colors">
                    {step.title}
                  </div>

                  {/* 설명 */}
                  <div className="font-[var(--font-mono)] text-[9px] text-white/30 text-center leading-relaxed whitespace-pre-line mb-2">
                    {step.desc}
                  </div>

                  {/* 소요 일수 */}
                  <div
                    className="font-[var(--font-mono)] text-[9px] font-bold px-2 py-0.5"
                    style={{
                      color: step.highlight ? "#ffd400" : "#c8161d",
                      border: `1px solid ${step.highlight ? "rgba(255,212,0,0.3)" : "rgba(200,22,29,0.3)"}`,
                    }}
                  >
                    {step.day}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 하단 안내 */}
        <div className="mt-12 grid grid-cols-3 gap-px border border-white/10">
          {[
            { label: "1~10벌",   period: "3~5일",   note: "소량 신속 제작" },
            { label: "10~99벌",  period: "5~7일",   note: "중량 표준 납기" },
            { label: "100벌 이상", period: "7~14일", note: "단체 자수 무료 포함" },
          ].map((t) => (
            <div key={t.label} className="bg-white/5 px-6 py-5 flex items-center justify-between hover:bg-white/10 transition-colors">
              <div>
                <div className="font-[var(--font-mono)] text-[10px] text-white/40 mb-1">{t.label}</div>
                <div className="text-sm font-black text-white">{t.note}</div>
              </div>
              <div className="font-[var(--font-display)] text-[28px] text-[#ffd400]">{t.period}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
