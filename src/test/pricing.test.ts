import { describe, expect, it } from "vitest";
import { computeTotals, type CouponRule } from "@/lib/pricing";
import { simulateOrder } from "@/lib/simulation";

const percent30: CouponRule = {
  code: "FOODUP30",
  discount_type: "percent",
  value: 30,
  min_subtotal: 40,
  max_discount: 25,
  restaurant_id: null,
  active: true,
};

const lines = [{ basePrice: 25.9, optionDeltas: [5, 3.5], quantity: 2 }];

describe("cart totals", () => {
  it("subtotal sums base + size + add-ons times quantity, plus delivery fee", () => {
    const t = computeTotals({ lines, restaurantDeliveryFee: 5.99, mode: "delivery", coupon: null, restaurantId: "r1" });
    expect(t.subtotal).toBe(68.8);
    expect(t.deliveryFee).toBe(5.99);
    expect(t.total).toBe(74.79);
  });

  it("percent coupon discounts the subtotal", () => {
    const t = computeTotals({ lines, restaurantDeliveryFee: 5.99, mode: "delivery", coupon: percent30, restaurantId: "r1" });
    expect(t.discount).toBe(20.64);
    expect(t.total).toBe(54.15);
  });

  it("percent coupon is capped by max discount", () => {
    const t = computeTotals({
      lines: [{ basePrice: 100, optionDeltas: [], quantity: 1 }],
      restaurantDeliveryFee: 0,
      mode: "delivery",
      coupon: percent30,
      restaurantId: "r1",
    });
    expect(t.discount).toBe(25);
  });

  it("coupon below minimum subtotal gives no discount", () => {
    const t = computeTotals({
      lines: [{ basePrice: 30, optionDeltas: [], quantity: 1 }],
      restaurantDeliveryFee: 5,
      mode: "delivery",
      coupon: percent30,
      restaurantId: "r1",
    });
    expect(t.discount).toBe(0);
    expect(t.couponError).not.toBeNull();
  });

  it("free delivery coupon removes the delivery fee", () => {
    const t = computeTotals({
      lines,
      restaurantDeliveryFee: 5.99,
      mode: "delivery",
      coupon: { ...percent30, discount_type: "free_delivery", value: 0, min_subtotal: 0 },
      restaurantId: "r1",
    });
    expect(t.discount).toBe(5.99);
    expect(t.total).toBe(68.8);
  });

  it("restaurant-specific coupon does not apply to another restaurant", () => {
    const t = computeTotals({
      lines,
      restaurantDeliveryFee: 5.99,
      mode: "delivery",
      coupon: { ...percent30, restaurant_id: "other" },
      restaurantId: "r1",
    });
    expect(t.discount).toBe(0);
  });

  it("pickup has no delivery fee", () => {
    const t = computeTotals({ lines, restaurantDeliveryFee: 5.99, mode: "pickup", coupon: null, restaurantId: "r1" });
    expect(t.deliveryFee).toBe(0);
    expect(t.total).toBe(68.8);
  });
});

describe("order simulation", () => {
  it("advances through statuses over time", () => {
    expect(simulateOrder("delivery", 0).status).toBe("confirmed");
    expect(simulateOrder("delivery", 10).status).toBe("preparing");
    expect(simulateOrder("delivery", 30).status).toBe("on_the_way");
    expect(simulateOrder("delivery", 52).progress).toBeCloseTo(0.5);
    expect(simulateOrder("delivery", 90).status).toBe("delivered");
  });
});
