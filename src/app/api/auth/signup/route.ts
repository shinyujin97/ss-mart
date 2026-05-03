import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { MemberType } from "@/generated/prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { loginId, email, password, name, phone, type, businessInfo } = body;

    if (!loginId || !password || !name || !phone) {
      return NextResponse.json(
        { error: "아이디, 비밀번호, 이름, 전화번호는 필수입니다." },
        { status: 400 }
      );
    }

    // 아이디 형식 검증 (4~20자, 영문/숫자/언더바)
    const idRegex = /^[a-zA-Z0-9_]{4,20}$/;
    if (!idRegex.test(loginId)) {
      return NextResponse.json(
        { error: "아이디는 4~20자의 영문, 숫자, 언더바(_)만 사용 가능합니다." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "비밀번호는 6자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    // 이메일 형식 검증 (입력된 경우에만)
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "올바른 이메일 형식을 입력해주세요." },
          { status: 400 }
        );
      }
    }

    // 아이디 중복 확인
    const existingId = await prisma.member.findUnique({ where: { loginId } });
    if (existingId) {
      return NextResponse.json(
        { error: "이미 사용 중인 아이디입니다." },
        { status: 409 }
      );
    }

    // 전화번호 중복 확인
    const normalizedPhone = phone.replace(/[-\s]/g, "");
    const existingPhone = await prisma.member.findFirst({
      where: { phone: { in: [phone, normalizedPhone] } },
    });
    if (existingPhone) {
      return NextResponse.json(
        { error: "이미 사용 중인 전화번호입니다." },
        { status: 409 }
      );
    }

    // 이메일 중복 확인 (입력된 경우에만)
    if (email) {
      const existingEmail = await prisma.member.findUnique({ where: { email } });
      if (existingEmail) {
        return NextResponse.json(
          { error: "이미 사용 중인 이메일입니다." },
          { status: 409 }
        );
      }
    }

    if (type === MemberType.BUSINESS) {
      if (!businessInfo?.companyName || !businessInfo?.businessNumber) {
        return NextResponse.json(
          { error: "사업자 회원은 회사명과 사업자등록번호가 필요합니다." },
          { status: 400 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const member = await prisma.$transaction(async (tx) => {
      const newMember = await tx.member.create({
        data: {
          loginId,
          email: email || null,
          passwordHash,
          name,
          phone,
          type: type ?? MemberType.INDIVIDUAL,
          points: 2000,
          ...(type === MemberType.BUSINESS && businessInfo
            ? {
                businessInfo: {
                  create: {
                    companyName: businessInfo.companyName,
                    businessNumber: businessInfo.businessNumber,
                    representativeName: businessInfo.representativeName ?? name,
                    taxInvoiceEmail: businessInfo.taxInvoiceEmail ?? email ?? "",
                    industry: businessInfo.industry,
                    businessType: businessInfo.businessType,
                  },
                },
              }
            : {}),
        },
        select: { id: true, loginId: true, name: true, type: true },
      });

      await tx.pointHistory.create({
        data: {
          memberId: newMember.id,
          type: "EARN_SIGNUP",
          amount: 2000,
          balance: 2000,
          reason: "신규 가입 적립금",
        },
      });

      return newMember;
    });

    return NextResponse.json(
      { message: "회원가입이 완료되었습니다.", memberId: member.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("[SIGNUP]", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
