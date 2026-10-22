import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Coupon, ItemOption, MenuItem, Restaurant } from "@/lib/types";

const fail = (msg: string, err: { message: string } | null) => {
  if (err) throw new Error(`${msg}: ${err.message}`);
};

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      fail("Falha ao carregar categorias", error);
      return data ?? [];
    },
    staleTime: 1000 * 60 * 30,
  });

export const restaurantsQuery = () =>
  queryOptions({
    queryKey: ["restaurants"],
    queryFn: async (): Promise<Restaurant[]> => {
      const { data, error } = await supabase.from("restaurants").select("*").order("distance_km");
      fail("Falha ao carregar restaurantes", error);
      return data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

export interface RestaurantDetail {
  restaurant: Restaurant;
  items: MenuItem[];
  coupons: Coupon[];
}

export const restaurantQuery = (slug: string) =>
  queryOptions({
    queryKey: ["restaurants", slug],
    queryFn: async (): Promise<RestaurantDetail | null> => {
      const { data: restaurant, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      fail("Falha ao carregar restaurante", error);
      if (!restaurant) return null;
      const [items, coupons] = await Promise.all([
        supabase.from("menu_items").select("*").eq("restaurant_id", restaurant.id).order("sort_order"),
        supabase.from("coupons").select("*").eq("restaurant_id", restaurant.id),
      ]);
      fail("Falha ao carregar cardápio", items.error);
      return { restaurant, items: items.data ?? [], coupons: coupons.data ?? [] };
    },
    staleTime: 1000 * 60 * 5,
  });

export const itemOptionsQuery = (menuItemId: string) =>
  queryOptions({
    queryKey: ["item_options", menuItemId],
    queryFn: async (): Promise<ItemOption[]> => {
      const { data, error } = await supabase
        .from("item_options")
        .select("*")
        .eq("menu_item_id", menuItemId)
        .order("sort_order");
      fail("Falha ao carregar opções", error);
      return data ?? [];
    },
    staleTime: 1000 * 60 * 10,
  });

export const couponsQuery = () =>
  queryOptions({
    queryKey: ["coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*, restaurants(name, slug, logo_emoji)")
        .order("created_at");
      fail("Falha ao carregar cupons", error);
      return data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

export const favoritesQuery = (userId: string) =>
  queryOptions({
    queryKey: ["favorites", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("restaurant_id, restaurants(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      fail("Falha ao carregar salvos", error);
      return data ?? [];
    },
  });

export const addressesQuery = (userId: string) =>
  queryOptions({
    queryKey: ["addresses", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      fail("Falha ao carregar endereços", error);
      return data ?? [];
    },
  });

export const ordersQuery = (userId: string) =>
  queryOptions({
    queryKey: ["orders", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, restaurants(name, slug, logo_emoji, cover_url), order_items(id, name, image_url, quantity, unit_price, menu_item_id)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      fail("Falha ao carregar pedidos", error);
      return data ?? [];
    },
  });

export const orderQuery = (orderId: string) =>
  queryOptions({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, restaurants(*), couriers(*), order_items(*), order_status_events(*)")
        .eq("id", orderId)
        .maybeSingle();
      fail("Falha ao carregar pedido", error);
      return data;
    },
  });

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      fail("Falha ao carregar perfil", error);
      return data;
    },
  });
