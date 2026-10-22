// Demo simulation of an order's lifecycle, driven by seconds since creation.
import type { OrderMode } from "./pricing";

export type OrderStatus =
  | "confirmed"
  | "preparing"
  | "picked_up"
  | "on_the_way"
  | "delivered"
  | "cancelled";

export const STATUS_FLOW: OrderStatus[] = [
  "confirmed",
  "preparing",
  "picked_up",
  "on_the_way",
  "delivered",
];

/** Second (since order creation) at which each status is reached. */
export const DELIVERY_TIMELINE: Record<Exclude<OrderStatus, "cancelled">, number> = {
  confirmed: 0,
  preparing: 6,
  picked_up: 16,
  on_the_way: 22,
  delivered: 82,
};

export const PICKUP_TIMELINE: Record<Exclude<OrderStatus, "cancelled">, number> = {
  confirmed: 0,
  preparing: 6,
  picked_up: 24,
  on_the_way: 24,
  delivered: 45,
};

export interface SimState {
  status: OrderStatus;
  progress: number;
  reached: { status: OrderStatus; atSec: number }[];
}

export function simulateOrder(mode: OrderMode, elapsedSec: number): SimState {
  const tl = mode === "pickup" ? PICKUP_TIMELINE : DELIVERY_TIMELINE;
  const flow = mode === "pickup" ? STATUS_FLOW.filter((s) => s !== "on_the_way") : STATUS_FLOW;
  const reached = flow
    .filter((s) => elapsedSec >= tl[s as keyof typeof tl])
    .map((s) => ({ status: s, atSec: tl[s as keyof typeof tl] }));
  const status = reached.length ? reached[reached.length - 1].status : "confirmed";
  let progress = 0;
  if (mode === "delivery") {
    const span = tl.delivered - tl.on_the_way;
    progress = Math.min(1, Math.max(0, (elapsedSec - tl.on_the_way) / span));
  }
  return { status, progress, reached };
}

export function statusLabel(status: OrderStatus, mode: OrderMode): string {
  if (mode === "pickup") {
    return (
      {
        confirmed: "Pedido confirmado",
        preparing: "Preparando seu pedido",
        picked_up: "Pronto para retirada",
        on_the_way: "Pronto para retirada",
        delivered: "Pedido retirado",
        cancelled: "Pedido cancelado",
      } as const
    )[status];
  }
  return (
    {
      confirmed: "Pedido confirmado",
      preparing: "Preparando sua comida",
      picked_up: "Pedido coletado",
      on_the_way: "A caminho de você",
      delivered: "Pedido entregue",
      cancelled: "Pedido cancelado",
    } as const
  )[status];
}
