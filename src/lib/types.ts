import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
export type Restaurant = Tables["restaurants"]["Row"];
export type Category = Tables["categories"]["Row"];
export type MenuItem = Tables["menu_items"]["Row"];
export type ItemOption = Tables["item_options"]["Row"];
export type Coupon = Tables["coupons"]["Row"];
export type Address = Tables["addresses"]["Row"];
export type Order = Tables["orders"]["Row"];
export type OrderItem = Tables["order_items"]["Row"];
export type OrderStatusEvent = Tables["order_status_events"]["Row"];
export type Courier = Tables["couriers"]["Row"];
export type Profile = Tables["profiles"]["Row"];

export type PaymentMethod = "pix" | "card" | "cash";

export const PAYMENT_LABELS: Record<PaymentMethod, { title: string; subtitle: string }> = {
  pix: { title: "Pix", subtitle: "Aprovação imediata" },
  card: { title: "Cartão de crédito", subtitle: "Visa •••• 4242" },
  cash: { title: "Dinheiro", subtitle: "Pague na entrega" },
};
