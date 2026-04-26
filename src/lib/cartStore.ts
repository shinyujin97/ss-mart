import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string; // optionId
  productId: string;
  productSlug: string;
  productName: string;
  brandName: string;
  imageUrl: string;
  color: string;
  colorHex: string | null;
  size: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  embroideryDesignId?: string;
  embroideryFee?: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, never>) => void;
  removeItem: (optionId: string) => void;
  updateQuantity: (optionId: string, quantity: number) => void;
  clearCart: () => void;
  totalCount: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (optionId) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== optionId),
        })),

      updateQuantity: (optionId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === optionId ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        })),

      clearCart: () => set({ items: [] }),

      totalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce(
          (sum, i) => sum + i.unitPrice * i.quantity + (i.embroideryFee ?? 0),
          0
        ),
    }),
    { name: "ss-mart-cart" }
  )
);
