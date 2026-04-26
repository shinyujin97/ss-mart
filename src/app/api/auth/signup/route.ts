import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { MemberType } from "@/generated/prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, phone, type, businessInfo } = body;

    // 필수 필드 검증
    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        { error: "필수 항목을 모두 입력해주세요." },
        { status: 400 }
      );
    }

    // 비밀번호 길이
    if (password.length < 8) {
      return NextResponse.json(
        { error: "비밀번호는 8자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existing = await prisma.member.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "이미 사용 중인 이메일입니다." },
        { status: 409 }
      );
    }

    // 전화번호 중복 확인
    const existingPhone = await prisma.member.findUnique({ where: { phone } });
    if (existingPhone) {
      return NextResponse.json(
        { error: "이미 사용 중인 전화번호입니다." },
        { status: 409 }
      );
    }

    // 사업자 회원이면 사업자 정보 필수
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
          email,
          passwordHash,
          name,
          phone,
          type: type ?? MemberType.INDIVIDUAL,
          points: 2000, // 가입 즉시 2,000P
          ...(type === MemberType.BUSINESS && businessInfo
            ? {
                businessInfo: {
                  create: {
                    companyName: businessInfo.companyName,
                    businessNumber: businessInfo.businessNumber,
                    representativeName: businessInfo.representativeName ?? name,
                    taxInvoiceEmail: businessInfo.taxInvoiceEmail ?? email,
                    industry: businessInfo.industry,
                    businessType: businessInfo.businessType,
                  },
                },
              }
            : {}),
        },
        select: { id: true, email: true, name: true, type: true },
      });

      // 가입 적립금 이력 기록
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
