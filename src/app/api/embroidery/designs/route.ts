import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateCopyright } from "@/lib/embroidery/copyright";
import { calculateUnitPrice } from "@/lib/embroidery/pricing";
import type { EmbroideryTypeKey, EmbroiderySizeKey, EmbroideryPositionKey } from "@/constants/embroidery";

// POST /api/embroidery/designs - 시안 생성
export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json();

  const { type, size, position, positions: positionsArr, textContent, notes, quantity = 1, designImageUrl, designPositions } = body;

  // 저작권 검증
  if (textContent) {
    const check = validateCopyright(textContent);
    if (!check.passed) {
      return NextResponse.json({ error: check.reason }, { status: 400 });
    }
  }
  if (notes) {
    const check = validateCopyright(notes);
    if (!check.passed) {
      return NextResponse.json({ error: check.reason }, { status: 400 });
    }
  }

  // 서버에서 가격 계산 — positions 배열에서 첫 번째를 대표 위치로 사용
  const positions: EmbroideryPositionKey[] = positionsArr?.length ? positionsArr : position ? [position] : [];
  if (!positions.length) {
    return NextResponse.json({ error: "자수 위치를 선택해 주세요." }, { status: 400 });
  }
  const unitPrice = calculateUnitPrice({
    type: type as EmbroideryTypeKey,
    size: size as EmbroiderySizeKey,
    positions,
  });
  const totalPrice = unitPrice * quantity;

  // 시안 번호 생성 — 날짜 + 밀리초 + 랜덤 4자리로 중복 방지
  const now = new Date();
  const today = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = `${now.getTime().toString(36).toUpperCase().slice(-5)}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
  const designNumber = `DESIGN-${today}-${suffix}`;

  const design = await prisma.embroideryDesign.create({
    data: {
      designNumber,
      memberId: session?.user?.id ?? null,
      designType: "SIMULATOR",
      embroideryType: type,
      position: positions[0],
      size,
      textContent: textContent ?? null,
      designImageUrl: designImageUrl ?? null,
      notes: notes ?? null,
      customPositions: designPositions ?? null,
      unitPrice,
      quantity,
      totalPrice,
      status: "DRAFT",
    },
    select: { id: true, designNumber: true, unitPrice: true, totalPrice: true, status: true },
  });

  return NextResponse.json(design, { status: 201 });
}

// GET /api/embroidery/designs - 내 시안 목록
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const designs = await prisma.embroideryDesign.findMany({
    where: { memberId: session.user.id as string },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      designNumber: true,
      status: true,
      embroideryType: true,
      position: true,
      size: true,
      textContent: true,
      unitPrice: true,
      totalPrice: true,
      revisionCount: true,
      createdAt: true,
      confirmedAt: true,
    },
  });

  return NextResponse.json(designs);
}
