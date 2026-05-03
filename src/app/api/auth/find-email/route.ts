import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, phone } = await req.json();

    if (!name || !phone) {
      return NextResponse.json({ error: "이름과 전화번호를 입력해주세요." }, { status: 400 });
    }

    const normalized = phone.replace(/[-\s]/g, "");

    const members = await prisma.$queryRaw<{ loginId: string }[]>`
      SELECT "loginId" FROM "members"
      WHERE name = ${name}
        AND REPLACE(phone, '-', '') = ${normalized}
      LIMIT 1
    `;

    if (!members.length) {
      return NextResponse.json({ error: "일치하는 회원 정보가 없습니다." }, { status: 404 });
    }

    const id = members[0].loginId;
    // 아이디 앞 2자 + 나머지 마스킹
    const masked = id.slice(0, 2) + "*".repeat(Math.max(id.length - 2, 2));

    return NextResponse.json({ loginId: masked });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
