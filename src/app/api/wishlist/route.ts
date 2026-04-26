import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "상품 ID 필요" }, { status: 400 });

  await prisma.wishlist.upsert({
    where: { memberId_productId: { memberId: session.user.id as string, productId } },
    update: {},
    create: { memberId: session.user.id as string, productId },
  });

  return NextResponse.json({ wishlisted: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { productId } = await req.json();

  await prisma.wishlist.deleteMany({
    where: { memberId: session.user.id as string, productId },
  });

  return NextResponse.json({ wishlisted: false });
}
