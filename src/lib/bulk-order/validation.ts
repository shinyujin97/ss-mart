import { z } from "zod";

const SIZES = ["S", "M", "L", "XL", "2XL", "3XL"] as const;

export const QuoteRequestSchema = z
  .object({
    companyName:      z.string().min(1, "회사명을 입력하세요"),
    businessNumber:   z.string().regex(/^\d{3}-\d{2}-\d{5}$/, "형식: 000-00-00000").optional().or(z.literal("")),
    managerName:      z.string().min(1, "담당자명을 입력하세요"),
    managerPosition:  z.string().optional(),
    managerPhone:     z.string().regex(/^01[0-9]-\d{3,4}-\d{4}$/, "전화번호 형식이 올바르지 않습니다"),
    managerEmail:     z.string().email("올바른 이메일을 입력하세요"),
    categories:       z.array(z.string()).min(1, "카테고리를 1개 이상 선택하세요"),
    sizeQuantities:   z.record(z.string(), z.number().min(0)),
    embroideryRequested: z.boolean(),
    embroideryType:   z.string().optional(),
    embroideryPosition: z.string().optional(),
    embroideryContent:  z.string().optional(),
    logoFileUrl:      z.string().optional(),
    desiredDeliveryDate: z.string().optional(),
    budgetRange:      z.string().optional(),
    paymentMethod:    z.enum(["ONE_TIME", "SPLIT_50_50", "SPLIT_30_70", "CREDIT", "TAX_INVOICE"]),
    additionalNotes:  z.string().max(2000).optional(),
    privacyAgreed:    z.boolean().refine((v) => v === true, "개인정보 수집 동의가 필요합니다"),
  })
  .refine(
    (data) => {
      const total = Object.values(data.sizeQuantities).reduce((a, b) => a + b, 0);
      if (data.embroideryRequested && total >= 50) return true;
      return total >= 100;
    },
    { message: "단체주문은 100벌 이상 (자수 추가 시 50벌 이상)이어야 합니다", path: ["sizeQuantities"] }
  );

export type QuoteRequestInput = z.infer<typeof QuoteRequestSchema>;

export const CATEGORY_OPTIONS = [
  { value: "WORKWEAR_TOP",    label: "작업복 상의" },
  { value: "WORKWEAR_BOTTOM", label: "작업복 하의" },
  { value: "WORKWEAR_SET",    label: "작업복 세트" },
  { value: "SAFETY_SHOES",    label: "안전화" },
  { value: "SAFETY_HELMET",   label: "안전모" },
  { value: "MASK",            label: "마스크 / 보호구" },
  { value: "SAFETY_VEST",     label: "안전조끼" },
  { value: "GLOVES",          label: "장갑" },
  { value: "FNB_UNIFORM",     label: "F&B 유니폼" },
  { value: "MEDICAL_UNIFORM", label: "의료 / 위생복" },
  { value: "WINTER_WEAR",     label: "방한복" },
] as const;

export const PAYMENT_OPTIONS = [
  { value: "ONE_TIME",    label: "일시 결제 (계약 시 100%)" },
  { value: "SPLIT_50_50", label: "분할 결제 (계약 50% + 납품 50%)" },
  { value: "SPLIT_30_70", label: "분할 결제 (계약 30% + 납품 70%)" },
  { value: "CREDIT",      label: "신용 거래 (기존 거래처 협의)" },
  { value: "TAX_INVOICE", label: "세금계산서 (사업자 회원)" },
] as const;

export { SIZES };
