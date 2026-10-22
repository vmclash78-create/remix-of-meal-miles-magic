// Pure pricing rules shared by the cart (client) and order placement (server).

export type DiscountType = "percent" | "fixed" | "free_delivery";

export interface CouponRule {
  code: string;
  discount_type: DiscountType;
  value: number;
  min_subtotal: number;
  max_discount: number | null;
  restaurant_id: string | null;
  active: boolean;
}

export interface PricedLine {
  basePrice: number;
  optionDeltas: number[];
  quantity: number;
}

export type OrderMode = "delivery" | "pickup";

export interface Totals {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponError: string | null;
}

export const roundMoney = (v: number) => Math.round(v * 100) / 100;

export function unitPrice(basePrice: number, optionDeltas: number[]): number {
  return roundMoney(basePrice + optionDeltas.reduce((s, d) => s + d, 0));
}

export function lineTotal(line: PricedLine): number {
  return roundMoney(unitPrice(line.basePrice, line.optionDeltas) * line.quantity);
}

export function couponProblem(
  coupon: CouponRule,
  subtotal: number,
  restaurantId: string | null,
): string | null {
  if (!coupon.active) return "Cupom indisponível.";
  if (coupon.restaurant_id && coupon.restaurant_id !== restaurantId)
    return "Este cupom não vale para este restaurante.";
  if (subtotal < coupon.min_subtotal)
    return `Pedido mínimo de ${formatBRL(coupon.min_subtotal)} para este cupom.`;
  return null;
}

export function computeTotals(input: {
  lines: PricedLine[];
  restaurantDeliveryFee: number;
  mode: OrderMode;
  coupon: CouponRule | null;
  restaurantId: string | null;
}): Totals {
  const subtotal = roundMoney(input.lines.reduce((s, l) => s + lineTotal(l), 0));
  const deliveryFee = input.mode === "pickup" ? 0 : roundMoney(input.restaurantDeliveryFee);
  let discount = 0;
  let couponError: string | null = null;

  if (input.coupon) {
    couponError = couponProblem(input.coupon, subtotal, input.restaurantId);
    if (!couponError) {
      const c = input.coupon;
      if (c.discount_type === "percent") {
        discount = (subtotal * c.value) / 100;
        if (c.max_discount != null) discount = Math.min(discount, c.max_discount);
      } else if (c.discount_type === "fixed") {
        discount = Math.min(c.value, subtotal);
      } else {
        discount = deliveryFee;
      }
      discount = roundMoney(discount);
    }
  }

  const total = roundMoney(Math.max(0, subtotal + deliveryFee - discount));
  return { subtotal, deliveryFee, discount, total, couponError };
}

export function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
