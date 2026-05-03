import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function generateTempPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;
  const rand = (set: string) => set[Math.floor(Math.random() * set.length)];
  // 영대문자 1 + 영소문자 1 + 숫자 1 + 나머지 5
  const rest = Array.from({ length: 5 }, () => rand(all)).join("");
  return [rand(upper), rand(lower), rand(digits), ...rest]
    .sort(() => Math.random() - 0.5)
    .join("");
}

export async function POST(req: NextRequest) {
  try {
    const { loginId, name, phone } = await req.json();

    if (!loginId || !name || !phone) {
      return NextResponse.json({ error: "아이디, 이름, 전화번호를 모두 입력해주세요." }, { status: 400 });
    }

    const normalized = phone.replace(/[-\s]/g, "");
    const members = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "members"
      WHERE "loginId" = ${loginId}
        AND name = ${name}
        AND REPLACE(phone, '-', '') = ${normalized}
      LIMIT 1
    `;

    const member = members[0] ?? null;

    if (!member) {
      // 보안상 이메일 존재 여부 노출 금지 — 동일 메시지 반환
      return NextResponse.json({ message: "임시 비밀번호가 발급되었습니다." });
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await prisma.member.update({
      where: { id: member.id },
      data: { passwordHash },
    });

    // TODO: 이메일 발송 서비스 연동 후 tempPassword를 이메일로 전송
    return NextResponse.json({ message: "임시 비밀번호가 발급되었습니다.", tempPassword });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
