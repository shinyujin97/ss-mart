import { NextRequest, NextResponse } from "next/server";
import { calculateEmbroideryPrice } from "@/lib/embroidery/pricing";
import type { EmbroideryTypeKey, EmbroiderySizeKey, EmbroideryPositionKey } from "@/constants/embroidery";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, size, positions, quantity, isBulkOrder } = body;

  if (!type || !size || !positions || !quantity) {
    return NextResponse.json({ error: "필수 파라미터 누락" }, { status: 400 });
  }

  const price = calculateEmbroideryPrice({
    type: type as EmbroideryTypeKey,
    size: size as EmbroiderySizeKey,
    positions: positions as EmbroideryPositionKey[],
    quantity: Number(quantity),
    isBulkOrder: Boolean(isBulkOrder),
  });

  return NextResponse.json({ price, unitPrice: price / Number(quantity) });
}
