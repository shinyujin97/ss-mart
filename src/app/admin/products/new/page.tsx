import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import ProductForm from "./ProductForm";

export const metadata = { title: "상품 등록" };

export default async function NewProductPage() {
  await requireAdmin();

  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, nameKr: true } }),
    prisma.category.findMany({ where: { isActive: true, level: 0 }, orderBy: { sortOrder: "asc" }, include: { children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } } }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <div className="font-[var(--font-mono)] text-[10px] text-[#aaa] tracking-[2px] mb-1">ADMIN / PRODUCTS / NEW</div>
        <h1 className="text-xl font-black text-[#111]">상품 등록</h1>
      </div>
      <ProductForm brands={brands} categories={categories} />
    </div>
  );
}
