import { NextResponse } from "next/server";

// 카탈로그 전용 모드 — 온라인 주문 비활성화 (2026-05-06)
export async function POST() {
  return NextResponse.json(
    { error: "현재 전화 문의 방식으로 운영 중입니다. 031-430-0497" },
    { status: 410 }
  );
}
