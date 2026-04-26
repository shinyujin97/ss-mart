"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Brand { id: string; name: string; nameKr: string; }
interface Category { id: string; name: string; children: { id: string; name: string }[]; }

interface Props { brands: Brand[]; categories: Category[]; }

const SIZES = ["S", "M", "L", "XL", "2XL", "3XL", "240mm", "250mm", "260mm", "270mm", "280mm", "290mm"];

export default function ProductForm({ brands, categories }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    slug: "", brandId: "", name: "", shortDescription: "",
    basePrice: "", salePrice: "", categoryIds: [] as string[],
    isNew: false, isBest: false, isFeatured: false,
    embroideryAvailable: true, bulkOrderAvailable: true,
  });

  const [options, setOptions] = useState([{ color: "", colorHex: "#000000", sizes: [] as string[] }]);

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

  function addOption() {
    setOptions((o) => [...o, { color: "", colorHex: "#000000", sizes: [] }]);
  }

  function updateOption(i: number, key: string, value: unknown) {
    setOptions((opts) => opts.map((o, idx) => idx === i ? { ...o, [key]: value } : o));
  }

  function toggleSize(optIdx: number, size: string) {
    setOptions((opts) => opts.map((o, i) => i !== optIdx ? o : {
      ...o,
      sizes: o.sizes.includes(size) ? o.sizes.filter((s) => s !== size) : [...o.sizes, size],
    }));
  }

  const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label className="font-[var(--font-mono)] text-[11px] text-[#666] flex items-center gap-1">
      {children} {required && <span className="text-[#c8161d]">*</span>}
    </label>
  );

  const Input = ({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="bg-[#111] border border-[#333] text-white px-3 py-2.5 text-sm outline-none focus:border-[#c8161d] w-full" />
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a]">
      <div className="font-[var(--font-mono)] text-[10px] text-[#555] tracking-[1.5px] px-5 py-3.5 border-b border-[#2a2a2a] bg-[#111]">{title}</div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );

  return (
    <div className="space-y-4 max-w-3xl">
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
              className="bg-[#111] border border-[#333] text-white px-3 py-2.5 text-sm outline-none focus:border-[#c8161d] w-full">
              <option value="">브랜드 선택</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.nameKr})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
            <Label>간단 설명</Label>
            <textarea value={form.shortDescription} onChange={(e) => update("shortDescription", e.target.value)}
              rows={2} placeholder="상품 간단 설명"
              className="bg-[#111] border border-[#333] text-white px-3 py-2.5 text-sm outline-none focus:border-[#c8161d] w-full resize-none leading-relaxed" />
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
      </Section>

      {/* 카테고리 */}
      <Section title="CATEGORIES">
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id}>
              <div className="font-[var(--font-mono)] text-[10px] text-[#555] mb-2">{cat.name}</div>
              <div className="flex flex-wrap gap-2">
                {cat.children.map((child) => (
                  <button key={child.id} type="button" onClick={() => toggleCategory(child.id)}
                    className={`px-3 py-1.5 text-xs border transition-colors ${
                      form.categoryIds.includes(child.id)
                        ? "border-[#c8161d] bg-[#c8161d]/20 text-[#c8161d]"
                        : "border-[#333] text-[#888] hover:border-[#555]"
                    }`}>
                    {child.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 옵션 (색상/사이즈) */}
      <Section title="OPTIONS (색상 / 사이즈)">
        {options.map((opt, i) => (
          <div key={i} className="border border-[#2a2a2a] p-4 space-y-3">
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <div className="space-y-1.5">
                <Label>색상명</Label>
                <Input value={opt.color} onChange={(v) => updateOption(i, "color", v)} placeholder="BLACK" />
              </div>
              <div className="space-y-1.5">
                <Label>색상 코드</Label>
                <input type="color" value={opt.colorHex}
                  onChange={(e) => updateOption(i, "colorHex", e.target.value)}
                  className="w-full h-[42px] bg-[#111] border border-[#333] cursor-pointer" />
              </div>
            </div>
            <div>
              <Label>사이즈 (복수 선택)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {SIZES.map((s) => (
                  <button key={s} type="button" onClick={() => toggleSize(i, s)}
                    className={`px-3 py-1.5 text-xs border font-[var(--font-mono)] transition-colors ${
                      opt.sizes.includes(s)
                        ? "border-[#c8161d] bg-[#c8161d]/20 text-[#c8161d]"
                        : "border-[#333] text-[#888] hover:border-[#555]"
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={addOption}
          className="w-full border border-dashed border-[#333] text-[#555] py-3 text-sm hover:border-[#555] hover:text-[#888] transition-colors font-[var(--font-mono)]">
          + 색상 추가
        </button>
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
            <label key={opt.key} className="flex items-center gap-3 cursor-pointer">
              <span
                onClick={() => update(opt.key, !form[opt.key as keyof typeof form])}
                className={`w-4 h-4 border-2 flex items-center justify-center text-[9px] font-bold ${
                  form[opt.key as keyof typeof form]
                    ? "border-[#c8161d] bg-[#c8161d] text-white"
                    : "border-[#444]"
                }`}
              >
                {form[opt.key as keyof typeof form] && "✓"}
              </span>
              <span className="text-sm text-[#888]">{opt.label}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* 제출 */}
      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()}
          className="px-6 py-3 border border-[#333] text-[#888] text-sm hover:border-white hover:text-white transition-colors">
          취소
        </button>
        <button
          onClick={() => { setSaving(true); setTimeout(() => { setSaving(false); router.push("/admin/products"); }, 1000); }}
          disabled={saving}
          className="flex-1 bg-[#c8161d] text-white py-3 font-bold text-sm hover:bg-[#9c0e15] transition-colors disabled:opacity-60"
        >
          {saving ? "저장 중..." : "상품 등록하기"}
        </button>
      </div>
    </div>
  );
}
