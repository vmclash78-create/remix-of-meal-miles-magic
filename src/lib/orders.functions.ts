import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeTotals, type CouponRule } from "@/lib/pricing";
import { fallbackRoute, pointAlong, type LatLng } from "@/lib/geo";
import { simulateOrder, STATUS_FLOW, type OrderStatus } from "@/lib/simulation";

const placeOrderSchema = z.object({
  restaurantId: z.string().uuid(),
  mode: z.enum(["delivery", "pickup"]),
  addressId: z.string().uuid().nullable(),
  couponCode: z.string().trim().max(40).nullable(),
  paymentMethod: z.enum(["pix", "card", "cash"]),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        quantity: z.number().int().min(1).max(50),
        optionIds: z.array(z.string().uuid()).max(30),
        note: z.string().max(300).default(""),
      }),
    )
    .min(1)
    .max(50),
});

async function fetchRoute(from: LatLng, to: LatLng): Promise<LatLng[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error("route failed");
    const json = (await res.json()) as {
      routes?: { geometry: { coordinates: [number, number][] } }[];
    };
    const coords = json.routes?.[0]?.geometry.coordinates;
    if (!coords || coords.length < 2) throw new Error("no route");
    return coords.map(([lng, lat]) => [lat, lng] as LatLng);
  } catch {
    return fallbackRoute(from, to);
  }
}

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => placeOrderSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: restaurant, error: rErr } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", data.restaurantId)
      .maybeSingle();
    if (rErr || !restaurant) throw new Error("Restaurante não encontrado.");

    const itemIds = [...new Set(data.items.map((i) => i.menuItemId))];
    const { data: menuItems, error: mErr } = await supabase
      .from("menu_items")
      .select("*")
      .in("id", itemIds)
      .eq("restaurant_id", restaurant.id);
    if (mErr || !menuItems || menuItems.length !== itemIds.length)
      throw new Error("Alguns itens não estão mais disponíveis.");

    const { data: options, error: oErr } = await supabase
      .from("item_options")
      .select("*")
      .in("menu_item_id", itemIds);
    if (oErr) throw new Error("Não foi possível validar os adicionais.");

    const pricedItems = data.items.map((it) => {
      const mi = menuItems.find((m) => m.id === it.menuItemId)!;
      const chosen = it.optionIds.map((oid) => {
        const opt = (options ?? []).find((o) => o.id === oid && o.menu_item_id === mi.id);
        if (!opt) throw new Error("Adicional inválido.");
        return opt;
      });
      if (chosen.filter((o) => o.kind === "size").length > 1)
        throw new Error("Escolha apenas um tamanho.");
      return { it, mi, chosen };
    });

    let coupon: CouponRule | null = null;
    if (data.couponCode) {
      const { data: c } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", data.couponCode.toUpperCase())
        .maybeSingle();
      if (!c) throw new Error("Cupom inválido.");
      coupon = {
        ...c,
        discount_type: c.discount_type as CouponRule["discount_type"],
        value: Number(c.value),
        min_subtotal: Number(c.min_subtotal),
        max_discount: c.max_discount == null ? null : Number(c.max_discount),
      };
    }

    const totals = computeTotals({
      lines: pricedItems.map(({ it, mi, chosen }) => ({
        basePrice: Number(mi.price),
        optionDeltas: chosen.map((o) => Number(o.price_delta)),
        quantity: it.quantity,
      })),
      restaurantDeliveryFee: Number(restaurant.delivery_fee),
      mode: data.mode,
      coupon,
      restaurantId: restaurant.id,
    });
    if (coupon && totals.couponError) throw new Error(totals.couponError);

    const origin: LatLng = [restaurant.lat, restaurant.lng];
    let dest: LatLng = origin;
    let addressLabel: string | null = null;
    let addressText: string | null = restaurant.address;
    if (data.mode === "delivery") {
      if (!data.addressId) throw new Error("Escolha um endereço de entrega.");
      const { data: address } = await supabase
        .from("addresses")
        .select("*")
        .eq("id", data.addressId)
        .maybeSingle();
      if (!address) throw new Error("Endereço não encontrado.");
      dest = [address.lat, address.lng];
      addressLabel = address.label;
      addressText = [address.line1, address.line2].filter(Boolean).join(" · ");
    }

    const route = data.mode === "delivery" ? await fetchRoute(origin, dest) : [origin];

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: couriers } = await supabaseAdmin.from("couriers").select("id");
    const courierId =
      data.mode === "delivery" && couriers?.length
        ? couriers[Math.floor(Math.random() * couriers.length)].id
        : null;

    const { data: order, error: insErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        restaurant_id: restaurant.id,
        courier_id: courierId,
        mode: data.mode,
        status: "confirmed",
        address_label: addressLabel,
        address_text: addressText,
        dest_lat: dest[0],
        dest_lng: dest[1],
        route,
        route_progress: 0,
        courier_lat: origin[0],
        courier_lng: origin[1],
        subtotal: totals.subtotal,
        delivery_fee: totals.deliveryFee,
        discount: totals.discount,
        total: totals.total,
        coupon_code: coupon?.code ?? null,
        payment_method: data.paymentMethod,
      })
      .select("id")
      .single();
    if (insErr || !order) throw new Error("Não foi possível criar o pedido.");

    const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(
      pricedItems.map(({ it, mi, chosen }) => ({
        order_id: order.id,
        menu_item_id: mi.id,
        name: mi.name,
        image_url: mi.image_url,
        unit_price:
          Number(mi.price) + chosen.reduce((s, o) => s + Number(o.price_delta), 0),
        quantity: it.quantity,
        options: chosen.map((o) => ({ id: o.id, name: o.name, kind: o.kind, delta: Number(o.price_delta) })),
        note: it.note || null,
      })),
    );
    if (itemsErr) throw new Error("Não foi possível salvar os itens do pedido.");

    await supabaseAdmin.from("order_status_events").insert({ order_id: order.id, status: "confirmed" });

    return { id: order.id };
  });

/** Advances the demo simulation for one of the caller's orders. Idempotent. */
export const tickOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: order } = await context.supabase
      .from("orders")
      .select("id, mode, status, created_at, route, route_progress")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order) throw new Error("Pedido não encontrado.");
    if (order.status === "delivered" || order.status === "cancelled") {
      return { status: order.status, progress: order.route_progress };
    }

    const createdAt = new Date(order.created_at).getTime();
    const elapsed = (Date.now() - createdAt) / 1000;
    const mode = order.mode === "pickup" ? "pickup" : "delivery";
    const sim = simulateOrder(mode, elapsed);
    const route = (Array.isArray(order.route) ? order.route : []) as LatLng[];
    const pos = route.length ? pointAlong(route, sim.progress) : null;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const statusChanged = sim.status !== order.status;
    const progressChanged = Math.abs(sim.progress - order.route_progress) > 0.0005;

    if (statusChanged) {
      const rows = sim.reached.map((r) => ({
        order_id: order.id,
        status: r.status,
        created_at: new Date(createdAt + r.atSec * 1000).toISOString(),
      }));
      await supabaseAdmin
        .from("order_status_events")
        .upsert(rows, { onConflict: "order_id,status", ignoreDuplicates: true });
    }

    if (statusChanged || progressChanged) {
      const currentIdx = STATUS_FLOW.indexOf(order.status as OrderStatus);
      const nextIdx = STATUS_FLOW.indexOf(sim.status);
      if (nextIdx >= currentIdx) {
        await supabaseAdmin
          .from("orders")
          .update({
            status: sim.status,
            route_progress: sim.progress,
            ...(pos ? { courier_lat: pos[0], courier_lng: pos[1] } : {}),
          })
          .eq("id", order.id);
      }
    }

    return { status: sim.status, progress: sim.progress };
  });
