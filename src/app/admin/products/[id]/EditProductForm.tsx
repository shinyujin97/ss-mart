"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Brand { id: string; name: string; nameKr: string; }
interface Category { id: string; name: string; children: { id: string; name: string }[]; }
interface ProductOption { id: string; color: string; colorHex: string | null; size: string; stockQuantity: number; isActive: boolean; }
interface ProductImage { id: string; url: string; altText: string | null; isMain: boolean; }

interface Product {
  id: string;
  name: string;
  slug: string;
  brandId: string;
  shortDescription: string | null;
  basePrice: number;
  salePrice: number;
  status: string;
  isNew: boolean;
  isBest: boolean;
  isFeatured: boolean;
  embroideryAvailable: boolean;
  bulkOrderAvailable: boolean;
  categories: { categoryId: string }[];
  options: ProductOption[];
  images: ProductImage[];
}

interface ParsedOptions { colors: { color: string; colorHex: string }[]; sizes: string[]; }
interface Props { product: Product; brands: Brand[]; categories: Category[]; parsedOptions?: ParsedOptions | null; }

const SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "240mm", "250mm", "260mm", "270mm", "280mm", "290mm"];
const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "판매중" },
  { value: "HIDDEN", label: "숨김" },
  { value: "OUT_OF_STOCK", label: "품절" },
  { value: "DISCONTINUED", label: "단종" },
];

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="font-[var(--font-mono)] text-[11px] text-[#333] font-semibold flex items-center gap-1">
    {children} {required && <span className="text-[#c8161d]">*</span>}
  </label>
);

const Input = ({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
    className="bg-white border border-[#ddd] text-[#111] px-3 py-2.5 text-sm outline-none focus:border-[#c8161d] w-full placeholder:text-[#bbb]" />
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white border border-[#e5e5e5] shadow-sm">
    <div className="font-[var(--font-mono)] text-[11px] text-[#111] font-bold tracking-[1.5px] px-5 py-3.5 border-b border-[#ececec] bg-[#f8f8f8]">{title}</div>
    <div className="p-6 space-y-4">{children}</div>
  </div>
);

// 기존 옵션에서 색상별로 그룹화
function groupOptions(options: ProductOption[]) {
  const map = new Map<string, { color: string; colorHex: string; sizes: string[] }>();
  for (const opt of options) {
    const key = opt.color;
    if (!map.has(key)) map.set(key, { color: opt.color, colorHex: opt.colorHex ?? "#000000", sizes: [] });
    map.get(key)!.sizes.push(opt.size);
  }
  return Array.from(map.values());
}

export default function EditProductForm({ product, brands, categories, parsedOptions }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [detailInput, setDetailInput] = useState("");

  const [form, setForm] = useState({
    name: product.name,
    slug: product.slug,
    brandId: product.brandId,
    shortDescription: product.shortDescription ?? "",
    basePrice: String(product.basePrice),
    salePrice: String(product.salePrice),
    status: product.status,
    isNew: product.isNew,
    isBest: product.isBest,
    isFeatured: product.isFeatured,
    embroideryAvailable: product.embroideryAvailable,
    bulkOrderAvailable: product.bulkOrderAvailable,
    categoryIds: product.categories.map((c) => c.categoryId),
  });

  const [colors, setColors] = useState<{ color: string; colorHex: string }[]>(() => {
    const dbOptions = groupOptions(product.options);
    if (dbOptions.length > 0) return dbOptions.map((o) => ({ color: o.color, colorHex: o.colorHex }));
    if (parsedOptions?.colors.length) return parsedOptions.colors;
    return [{ color: "", colorHex: "#000000" }];
  });

  const [sizes, setSizes] = useState<string[]>(() => {
    const dbOptions = groupOptions(product.options);
    if (dbOptions.length > 0) return [...new Set(dbOptions.flatMap((o) => o.sizes))];
    if (parsedOptions?.sizes.length) return parsedOptions.sizes;
    return [];
  });
  const [mainImage, setMainImage] = useState(product.images.find((img) => img.isMain)?.url ?? "");
  const [detailImages, setDetailImages] = useState(product.images.filter((img) => !img.isMain).map((img) => img.url));

  function update(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleCategory(id: string) {
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(id)
        ? f.categoryIds.filter((c) => c !== id)
        : [...f.categoryIds, id],
    }));
  }

  function addColor() {
    setColors((c) => [...c, { color: "", colorHex: "#000000" }]);
  }

  function removeColor(i: number) {
    setColors((c) => c.filter((_, idx) => idx !== i));
  }

  function updateColor(i: number, key: "color" | "colorHex", value: string) {
    setColors((c) => c.map((item, idx) => idx === i ? { ...item, [key]: value } : item));
  }

  function toggleSize(size: string) {
    setSizes((prev) => prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]);
  }

  function addDetailImage() {
    const url = detailInput.trim();
    if (!url) return;
    setDetailImages((imgs) => [...imgs, url]);
    setDetailInput("");
  }

  function removeDetailImage(i: number) {
    setDetailImages((imgs) => imgs.filter((_, idx) => idx !== i));
  }

  function moveDetailImage(i: number, dir: -1 | 1) {
    setDetailImages((imgs) => {
      const next = [...imgs];
      const j = i + dir;
      if (j < 0 || j >= next.length) return next;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function handleSave() {
    setError("");
    if (!form.name || !form.slug || !form.brandId || !form.basePrice || !form.salePrice) {
      setError("상품명, 슬러그, 브랜드, 가격은 필수입니다.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          options: colors.flatMap((c) => sizes.map((s) => ({ color: c.color, colorHex: c.colorHex, sizes: [s] }))),
          images: [
            ...(mainImage ? [{ url: mainImage, altText: form.name, isMain: true }] : []),
            ...detailImages.map((url) => ({ url, altText: form.name, isMain: false })),
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장 실패");
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`"${product.name}" 상품을 삭제하시겠습니까?\n\n주문 이력이 있으면 단종 처리됩니다.`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "삭제 실패");
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {error && (
        <div className="bg-[#c8161d]/10 border border-[#c8161d]/40 text-[#c8161d] px-4 py-3 text-sm font-[var(--font-mono)]">
          ⚠ {error}
        </div>
      )}

      {/* 기본 정보 */}
      <Section title="BASIC INFO">
        <div className="space-y-3">
          <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
            <Label required>상품명</Label>
            <Input value={form.name} onChange={(v) => update("name", v)} placeholder="상품명" />
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
            <Label required>슬러그</Label>
            <Input value={form.slug} onChange={(v) => update("slug", v)} placeholder="piozen-ws-001" />
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
            <Label required>브랜드</Label>
            <select value={form.brandId} onChange={(e) => update("brandId", e.target.value)}
              className="bg-white border border-[#ddd] text-[#111] px-3 py-2.5 text-sm outline-none focus:border-[#c8161d] w-full">
              <option value="">브랜드 선택</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.nameKr})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-3 items-center">
            <Label>상태</Label>
            <select value={form.status} onChange={(e) => update("status", e.target.value)}
              className="bg-white border border-[#ddd] text-[#111] px-3 py-2.5 text-sm outline-none focus:border-[#c8161d] w-full">
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
            <Label>간단 설명</Label>
            <textarea value={form.shortDescription} onChange={(e) => update("shortDescription", e.target.value)}
              rows={2} placeholder="상품 간단 설명"
              className="bg-white border border-[#ddd] text-[#111] px-3 py-2.5 text-sm outline-none focus:border-[#c8161d] w-full resize-none leading-relaxed placeholder:text-[#ccc]" />
          </div>
        </div>
      </Section>

      {/* 가격 */}
      <Section title="PRICING">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label required>정가</Label>
            <Input value={form.basePrice} onChange={(v) => update("basePrice", v)} placeholder="45000" type="number" />
          </div>
          <div className="space-y-1.5">
            <Label required>판매가</Label>
            <Input value={form.salePrice} onChange={(v) => update("salePrice", v)} placeholder="38000" type="number" />
          </div>
        </div>
        {form.basePrice && form.salePrice && Number(form.basePrice) > Number(form.salePrice) && (
          <div className="font-[var(--font-mono)] text-[11px] text-[#c8161d]">
            할인율 {Math.round((1 - Number(form.salePrice) / Number(form.basePrice)) * 100)}% OFF
          </div>
        )}
      </Section>

      {/* 대표 이미지 */}
      <Section title="대표 이미지 (MAIN IMAGE)">
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="url"
              value={mainImage}
              onChange={(e) => setMainImage(e.target.value)}
              placeholder="https://... 대표 이미지 URL"
              className="bg-white border border-[#ddd] text-[#111] px-3 py-2.5 text-sm outline-none focus:border-[#c8161d] flex-1 placeholder:text-[#bbb]"
            />
            {mainImage && (
              <button type="button" onClick={() => setMainImage("")}
                className="px-4 border border-[#ddd] text-[#888] text-sm hover:border-[#c8161d] hover:text-[#c8161d] transition-colors whitespace-nowrap">
                삭제
              </button>
            )}
          </div>
          {mainImage ? (
            <div className="relative w-40 h-40 border border-[#e5e5e5] bg-[#f4f4f4] overflow-hidden">
              <Image src={mainImage} alt="대표 이미지" fill className="object-cover" unoptimized />
              <div className="absolute top-1 left-1 bg-[#c8161d] text-white text-[9px] font-[var(--font-mono)] px-1.5 py-0.5">대표</div>
            </div>
          ) : (
            <div className="text-[#bbb] text-xs font-[var(--font-mono)]">상품 목록·검색 결과에 표시되는 대표 이미지입니다</div>
          )}
        </div>
      </Section>

      {/* 상세 이미지 */}
      <Section title="상세 이미지 (DETAIL IMAGES)">
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="url"
              value={detailInput}
              onChange={(e) => setDetailInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDetailImage()}
              placeholder="https://... 상세 이미지 URL 입력 후 Enter"
              className="bg-white border border-[#ddd] text-[#111] px-3 py-2.5 text-sm outline-none focus:border-[#c8161d] flex-1 placeholder:text-[#bbb]"
            />
            <button type="button" onClick={addDetailImage}
              className="px-4 bg-[#c8161d] text-white text-sm font-bold hover:bg-[#9c0e15] transition-colors whitespace-nowrap">
              추가
            </button>
          </div>
          {detailImages.length === 0 ? (
            <div className="text-[#bbb] text-xs font-[var(--font-mono)]">상품 상세 페이지에 표시되는 이미지들입니다 (여러 장 가능)</div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
              {detailImages.map((url, i) => (
                <div key={i} className="relative group border border-[#e5e5e5] bg-[#f4f4f4]">
                  <div className="aspect-square relative overflow-hidden">
                    <Image src={url} alt={`상세 ${i + 1}`} fill className="object-cover" unoptimized />
                  </div>
                  <div className="absolute top-1 left-1 bg-black/50 text-white text-[9px] font-[var(--font-mono)] px-1.5 py-0.5">{i + 1}</div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button onClick={() => moveDetailImage(i, -1)} disabled={i === 0}
                      className="w-7 h-7 bg-white/20 hover:bg-white/40 text-white text-xs disabled:opacity-30">←</button>
                    <button onClick={() => removeDetailImage(i)}
                      className="w-7 h-7 bg-[#c8161d]/80 hover:bg-[#c8161d] text-white text-xs">✕</button>
                    <button onClick={() => moveDetailImage(i, 1)} disabled={i === detailImages.length - 1}
                      className="w-7 h-7 bg-white/20 hover:bg-white/40 text-white text-xs disabled:opacity-30">→</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* 카테고리 */}
      <Section title="CATEGORIES">
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id}>
              <div className="font-[var(--font-mono)] text-[10px] text-[#333] font-semibold mb-2">{cat.name}</div>
              <div className="flex flex-wrap gap-2">
                {cat.children.map((child) => (
                  <button key={child.id} type="button" onClick={() => toggleCategory(child.id)}
                    className={`px-3 py-1.5 text-xs border transition-colors ${
                      form.categoryIds.includes(child.id)
                        ? "border-[#c8161d] bg-[#c8161d]/20 text-[#c8161d]"
                        : "border-[#ddd] text-[#aaa] hover:border-[#999]"
                    }`}>
                    {child.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 색상 */}
      <Section title="색상 (COLORS)">
        <div className="space-y-2">
          {colors.map((c, i) => (
            <div key={i} className="flex items-center gap-3 border border-[#e5e5e5] bg-[#fafafa] px-4 py-3">
              <input
                type="color"
                value={c.colorHex}
                onChange={(e) => updateColor(i, "colorHex", e.target.value)}
                className="w-9 h-9 border border-[#ddd] cursor-pointer flex-shrink-0"
              />
              <input
                type="text"
                value={c.color}
                onChange={(e) => updateColor(i, "color", e.target.value)}
                placeholder="색상명 (예: 블랙, NAVY)"
                className="bg-white border border-[#ddd] text-[#111] px-3 py-2 text-sm outline-none focus:border-[#c8161d] flex-1 placeholder:text-[#bbb]"
              />
              <button
                type="button"
                onClick={() => removeColor(i)}
                className="text-[#bbb] hover:text-[#c8161d] text-xs font-[var(--font-mono)] flex-shrink-0 px-2"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addColor}
            className="w-full border border-dashed border-[#ddd] text-[#aaa] py-2.5 text-sm hover:border-[#999] hover:text-[#666] transition-colors font-[var(--font-mono)]"
          >
            + 색상 추가
          </button>
        </div>
      </Section>

      {/* 사이즈 */}
      <Section title="사이즈 (SIZES)">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSize(s)}
                className={`px-3 py-1.5 text-xs border font-[var(--font-mono)] transition-colors ${
                  sizes.includes(s)
                    ? "border-[#c8161d] bg-[#c8161d]/10 text-[#c8161d] font-bold"
                    : "border-[#ddd] text-[#aaa] hover:border-[#999]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {sizes.length > 0 && (
            <div className="font-[var(--font-mono)] text-[11px] text-[#888] pt-1">
              선택됨: {sizes.join(", ")} · 총 {colors.filter(c => c.color).length}색상 × {sizes.length}사이즈 = {colors.filter(c => c.color).length * sizes.length}개 SKU
            </div>
          )}
        </div>
      </Section>

      {/* 설정 */}
      <Section title="SETTINGS">
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: "isNew", label: "NEW 배지" },
            { key: "isBest", label: "BEST 배지" },
            { key: "isFeatured", label: "추천 상품" },
            { key: "embroideryAvailable", label: "자수 가능" },
            { key: "bulkOrderAvailable", label: "단체주문 가능" },
          ].map((opt) => (
            <label key={opt.key} className="flex items-center gap-3 cursor-pointer" onClick={() => update(opt.key, !form[opt.key as keyof typeof form])}>
              <span className={`w-4 h-4 border-2 flex items-center justify-center text-[9px] font-bold ${
                form[opt.key as keyof typeof form]
                  ? "border-[#c8161d] bg-[#c8161d] text-white"
                  : "border-[#444]"
              }`}>
                {form[opt.key as keyof typeof form] && "✓"}
              </span>
              <span className="text-sm text-[#111]">{opt.label}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* 버튼 */}
      <div className="flex gap-3">
        <button type="button" onClick={handleDelete} disabled={deleting}
          className="px-6 py-3 border border-[#c8161d]/40 text-[#c8161d] text-sm hover:bg-[#c8161d]/10 transition-colors disabled:opacity-60">
          {deleting ? "삭제 중..." : "삭제"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-3 border border-[#ddd] text-[#888] text-sm hover:border-[#111] hover:text-[#111] transition-colors">
          취소
        </button>
        <button type="button" onClick={handleSave} disabled={saving}
          className="flex-1 bg-[#c8161d] text-white py-3 font-bold text-sm hover:bg-[#9c0e15] transition-colors disabled:opacity-60">
          {saving ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </div>
  );
}
