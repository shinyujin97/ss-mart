import { prisma } from "@/lib/prisma";

export async function generateQuoteNumber(): Promise<string> {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const last = await prisma.quoteRequest.findFirst({
    where: { requestNumber: { startsWith: `SS-Q-${ym}` } },
    orderBy: { createdAt: "desc" },
    select: { requestNumber: true },
  });

  const seq = last
    ? parseInt(last.requestNumber.split("-").pop()!) + 1
    : 1;

  return `SS-Q-${ym}-${String(seq).padStart(3, "0")}`;
}
