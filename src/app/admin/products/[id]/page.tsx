import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditProductForm from "./EditProductForm";
import { parseNameOptions } from "@/lib/product-options";

export const metadata = { title: "상품 수정" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [product, brands, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        categories: { select: { categoryId: true } },
        options: { orderBy: [{ color: "asc" }, { size: "asc" }] },
        images: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, nameKr: true } }),
    prisma.category.findMany({ where: { isActive: true, level: 0 }, orderBy: { sortOrder: "asc" }, include: { children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } } }),
  ]);

  if (!product) notFound();

  // DB 옵션 없으면 상품명에서 파싱해서 초기값으로 제공
  const parsedOptions = product.options.length === 0
    ? parseNameOptions(product.name)
    : null;

  return (
    <div className="space-y-5">
      <div>
        <div className="font-[var(--font-mono)] text-[10px] text-[#aaa] tracking-[2px] mb-1">ADMIN / PRODUCTS / EDIT</div>
        <h1 className="text-xl font-black text-[#111]">{product.name}</h1>
        <div className="font-[var(--font-mono)] text-[11px] text-[#888] mt-1">{product.slug}</div>
      </div>
      <EditProductForm product={product} brands={brands} categories={categories} parsedOptions={parsedOptions} />
    </div>
  );
}
