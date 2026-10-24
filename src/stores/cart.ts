import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { OrderMode } from "@/lib/pricing";
import type { PaymentMethod } from "@/lib/types";

export interface CartOption {
  id: string;
  name: string;
  delta: number;
}

export interface CartLine {
  key: string;
  menuItemId: string;
  name: string;
  imageUrl: string;
  basePrice: number;
  size: CartOption | null;
  addons: CartOption[];
  quantity: number;
  note: string;
}

export interface CartRestaurant {
  id: string;
  slug: string;
  name: string;
  deliveryFee: number;
  emoji: string;
}

interface CartState {
  restaurant: CartRestaurant | null;
  lines: CartLine[];
  couponCode: string | null;
  mode: OrderMode;
  paymentMethod: PaymentMethod;
  addLine: (restaurant: CartRestaurant, line: Omit<CartLine, "key">) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
  setCoupon: (code: string | null) => void;
  setMode: (mode: OrderMode) => void;
  setPayment: (m: PaymentMethod) => void;
}

const lineKey = (l: Omit<CartLine, "key">) =>
  [l.menuItemId, l.size?.id ?? "", ...l.addons.map((a) => a.id).sort(), l.note.trim()].join("|");

export const lineOptionDeltas = (l: CartLine) => [
  ...(l.size ? [l.size.delta] : []),
  ...l.addons.map((a) => a.delta),
];

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      restaurant: null,
      lines: [],
      couponCode: null,
      mode: "delivery",
      paymentMethod: "pix",
      addLine: (restaurant, line) =>
        set((s) => {
          const sameRestaurant = s.restaurant?.id === restaurant.id;
          const lines = sameRestaurant ? s.lines : [];
          const key = lineKey(line);
          const existing = lines.find((l) => l.key === key);
          return {
            restaurant,
            couponCode: sameRestaurant ? s.couponCode : null,
            lines: existing
              ? lines.map((l) => (l.key === key ? { ...l, quantity: l.quantity + line.quantity } : l))
              : [...lines, { ...line, key }],
          };
        }),
      setQuantity: (key, quantity) =>
        set((s) => {
          const lines =
            quantity <= 0
              ? s.lines.filter((l) => l.key !== key)
              : s.lines.map((l) => (l.key === key ? { ...l, quantity } : l));
          return { lines, restaurant: lines.length ? s.restaurant : null };
        }),
      removeLine: (key) =>
        set((s) => {
          const lines = s.lines.filter((l) => l.key !== key);
          return { lines, restaurant: lines.length ? s.restaurant : null };
        }),
      clear: () => set({ lines: [], restaurant: null, couponCode: null }),
      setCoupon: (couponCode) => set({ couponCode }),
      setMode: (mode) => set({ mode }),
      setPayment: (paymentMethod) => set({ paymentMethod }),
    }),
    {
      name: "foodie-cart",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const useCartCount = () => useCart((s) => s.lines.reduce((n, l) => n + l.quantity, 0));

interface LocationState {
  selectedAddressId: string | null;
  setSelectedAddressId: (id: string | null) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      selectedAddressId: null,
      setSelectedAddressId: (selectedAddressId) => set({ selectedAddressId }),
    }),
    { name: "foodie-location", storage: createJSONStorage(() => localStorage) },
  ),
);
