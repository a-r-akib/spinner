import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Gift {
  id: string;
  name: string;
  color: string;
  quantity: number; // -1 represents infinite quantity, 0 represents out-of-stock
}

export const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#EC4899", // Pink
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#14B8A6", // Teal
  "#6366F1", // Indigo
  "#F43F5E", // Rose
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#D97706", // Dark Amber / Orange
];

const DEFAULT_GIFTS: Gift[] = [
  { id: "1", name: "Raku File Holder", quantity: 10, color: "#EC4899" },
  { id: "2", name: "Better Luck Next Time 😢", quantity: -1, color: "#6366F1" },
  { id: "3", name: "Aarong Chocolate Milk Juice", quantity: 30, color: "#10B981" },
  { id: "4", name: "Pran Peanut Bar", quantity: 20, color: "#F43F5E" },
  { id: "5", name: "Raku Note Pad", quantity: 50, color: "#84CC16" },
  { id: "6", name: "Sticky Notes", quantity: 10, color: "#F59E0B" },
  { id: "7", name: "Better Luck Next Time 😢", quantity: -1, color: "#06B6D4" },
  { id: "8", name: "Try Again (1 more spin)", quantity: -1, color: "#14B8A6" },
  { id: "9", name: "Raku Bottle", quantity: 20, color: "#3B82F6" },
  { id: "10", name: "Pencil Bag", quantity: 10, color: "#8B5CF6" },
  { id: "11", name: "Pran Peanut Bar", quantity: 20, color: "#D97706" },
];

interface GiftState {
  gifts: Gift[];
  addGift: (name: string, quantity?: number) => void;
  removeGift: (id: string) => void;
  decrementQuantity: (id: string) => void;
  setGifts: (gifts: Gift[]) => void;
  resetToDefault: () => void;
}

export const useGiftStore = create<GiftState>()(
  persist(
    (set) => ({
      gifts: DEFAULT_GIFTS,

      addGift: (name: string, quantity: number = 10) =>
        set((state) => {
          const newGift: Gift = {
            id: crypto.randomUUID(),
            name: name.trim(),
            quantity,
            color: PRESET_COLORS[state.gifts.length % PRESET_COLORS.length],
          };
          return { gifts: [...state.gifts, newGift] };
        }),

      removeGift: (id: string) =>
        set((state) => ({
          gifts: state.gifts.filter((g) => g.id !== id),
        })),

      // Reduces quantity down to 0 without filtering out the gift
      decrementQuantity: (id: string) =>
        set((state) => ({
          gifts: state.gifts.map((gift) => {
            if (gift.id === id) {
              if (gift.quantity === -1) return gift;
              return { ...gift, quantity: Math.max(0, gift.quantity - 1) };
            }
            return gift;
          }),
        })),

      setGifts: (gifts: Gift[]) => set({ gifts }),

      resetToDefault: () => set({ gifts: DEFAULT_GIFTS }),
    }),
    {
      name: "gift-spinner-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
