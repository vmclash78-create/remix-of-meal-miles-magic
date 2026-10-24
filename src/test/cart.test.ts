import { beforeEach, describe, expect, it } from "vitest";
import type { CartLine, CartRestaurant } from "@/stores/cart";
import { useCart } from "@/stores/cart";

const restaurantA: CartRestaurant = {
  id: "restaurant-a",
  slug: "restaurant-a",
  name: "Restaurante A",
  deliveryFee: 5,
  emoji: "🍔",
};

const restaurantB: CartRestaurant = {
  id: "restaurant-b",
  slug: "restaurant-b",
  name: "Restaurante B",
  deliveryFee: 6,
  emoji: "🍕",
};

const lineA: Omit<CartLine, "key"> = {
  menuItemId: "item-a",
  name: "Prato A",
  imageUrl: "",
  basePrice: 20,
  size: null,
  addons: [],
  quantity: 1,
  note: "",
};

const lineB: Omit<CartLine, "key"> = {
  ...lineA,
  menuItemId: "item-b",
  name: "Prato B",
};

beforeEach(() => {
  useCart.persist.clearStorage();
  useCart.setState({
    restaurant: null,
    lines: [],
    couponCode: null,
    mode: "delivery",
    paymentMethod: "pix",
  });
});

describe("cart restaurant changes", () => {
  it("replaces existing lines and clears the previous coupon when changing restaurants", () => {
    useCart.getState().addLine(restaurantA, lineA);
    useCart.getState().setCoupon("CUPOM-A");

    useCart.getState().addLine(restaurantB, lineB);

    const cart = useCart.getState();
    expect(cart.restaurant?.id).toBe(restaurantB.id);
    expect(cart.lines.map((line) => line.menuItemId)).toEqual([lineB.menuItemId]);
    expect(cart.couponCode).toBeNull();
  });

  it("keeps the current coupon and items when adding from the same restaurant", () => {
    useCart.getState().addLine(restaurantA, lineA);
    useCart.getState().setCoupon("CUPOM-A");

    useCart.getState().addLine(restaurantA, lineB);

    const cart = useCart.getState();
    expect(cart.lines.map((line) => line.menuItemId)).toEqual([lineA.menuItemId, lineB.menuItemId]);
    expect(cart.couponCode).toBe("CUPOM-A");
  });
});
