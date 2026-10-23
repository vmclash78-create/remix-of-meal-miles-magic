import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Bike, MessageCircle, PackageCheck, Phone, Star } from "lucide-react";
import { format } from "date-fns";
import { OrderStepper } from "@/components/foodup/OrderStepper";
import { PillButton } from "@/components/foodup/PillButton";
import { EmptyState, ErrorState } from "@/components/foodup/StateViews";
import { TrackingMap } from "@/components/map";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { routeLengthKm, type LatLng } from "@/lib/geo";
import { tickOrder } from "@/lib/orders.functions";
import { formatBRL } from "@/lib/pricing";
import { orderQuery } from "@/lib/queries";
import { statusLabel, type OrderStatus } from "@/lib/simulation";
import type { Order, OrderStatusEvent } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/pedido/$id")({
  head: () => ({
    meta: [
      { title: "Acompanhar pedido | FoodUp" },
      { name: "description", content: "Acompanhe seu pedido e o entregador em tempo real." },
      { property: "og:title", content: "Acompanhar pedido | FoodUp" },
      { property: "og:description", content: "Acompanhe seu pedido e o entregador em tempo real." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrackingPage,
});

function TrackingPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: order, isLoading, error, refetch } = useQuery(orderQuery(id));
  const tick = useServerFn(tickOrder);
  const [now, setNow] = useState(() => Date.now());

  // Realtime: order row + status events.
  useEffect(() => {
    const channel = supabase
      .channel(`order-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, (payload) => {
        qc.setQueryData(orderQuery(id).queryKey, (old) => (old ? { ...old, ...(payload.new as Order) } : old));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "order_status_events", filter: `order_id=eq.${id}` }, (payload) => {
        const ev = payload.new as OrderStatusEvent;
        qc.setQueryData(orderQuery(id).queryKey, (old) =>
          old && !old.order_status_events.some((e) => e.id === ev.id)
            ? { ...old, order_status_events: [...old.order_status_events, ev] }
            : old,
        );
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, qc]);

  // Demo simulation driver.
  const status = order?.status;
  useEffect(() => {
    if (!status || status === "delivered" || status === "cancelled") return;
    const run = () => tick({ data: { orderId: id } }).catch(() => undefined);
    run();
    const t = setInterval(run, 2500);
    return () => clearInterval(t);
  }, [id, status, tick]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md">
        <Skeleton className="h-[55vh] w-full rounded-none" />
        <div className="space-y-3 p-5">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    );
  }
  if (error) return <ErrorState className="pt-32" message="Não foi possível carregar o pedido." onRetry={() => refetch()} />;
  if (!order || !order.restaurants) {
    return (
      <EmptyState
        className="pt-32"
        icon={<PackageCheck className="h-8 w-8" />}
        title="Pedido não encontrado"
        action={<Link to="/inicio" className="font-semibold text-primary-deep">Voltar ao início</Link>}
      />
    );
  }

  const mode = order.mode === "pickup" ? "pickup" : "delivery";
  const st = order.status as OrderStatus;
  const route = (Array.isArray(order.route) ? order.route : []) as LatLng[];
  const restaurantPos: LatLng = [order.restaurants.lat, order.restaurants.lng];
  const dest: LatLng = [order.dest_lat, order.dest_lng];
  const remainingKm = routeLengthKm(route) * (1 - order.route_progress);
  const etaMin =
    st === "delivered" ? 0 : st === "on_the_way" ? Math.max(1, Math.ceil((1 - order.route_progress) * 10)) : st === "picked_up" ? 11 : st === "preparing" ? 13 : 15;
  const arrival = new Date(now + etaMin * 60000);
  const elapsed = Math.max(0, Math.floor((now - new Date(order.created_at).getTime()) / 1000));
  const courier = order.couriers;
  const events = [...order.order_status_events].sort((a, b) => a.created_at.localeCompare(b.created_at));

  return (
    <div className="min-h-screen bg-muted/60">
      <div className="relative mx-auto min-h-screen w-full max-w-md bg-background">
        <TrackingMap
          route={route}
          progress={order.route_progress}
          restaurant={restaurantPos}
          destination={dest}
          showCourier={mode === "delivery"}
          restaurantEmoji={order.restaurants.logo_emoji}
          className="h-[55vh] w-full"
        />
        <div className="absolute inset-x-0 top-0 z-[600] flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+14px)]">
          <Link to="/inicio" aria-label="Voltar" className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-soft">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="rounded-full bg-card px-4 py-2 text-sm font-bold shadow-soft">Pedido #{order.short_code}</span>
          <span className="w-10" />
        </div>

        <div className="relative z-[600] -mt-8 space-y-4 rounded-t-[28px] bg-card px-5 pb-10 pt-3 shadow-float">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-border" />
          <div className="flex items-start justify-between gap-3">
            <div>
              {st !== "delivered" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-bold text-primary-deep">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> Ao vivo · {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
                </span>
              )}
              <h1 className="mt-1 text-xl font-bold">{statusLabel(st, mode)}</h1>
              <p className="text-xs text-muted-foreground">
                {mode === "pickup"
                  ? order.restaurants.address
                  : st === "on_the_way" && courier
                    ? `${courier.name.split(" ")[0]} está a ${remainingKm.toFixed(1).replace(".", ",")} km`
                    : order.address_text}
              </p>
            </div>
            {st !== "delivered" && (
              <div className="rounded-2xl border border-border px-3 py-2 text-right">
                <p className="text-xl font-extrabold leading-none">{etaMin}<span className="text-xs font-semibold"> min</span></p>
                <p className="mt-1 text-[10px] text-muted-foreground">Chega {format(arrival, "HH:mm")}</p>
              </div>
            )}
          </div>

          <OrderStepper status={st} mode={mode} progress={order.route_progress} />

          {st === "delivered" && (
            <div className="rounded-2xl bg-success-soft p-4 text-center animate-fade-up">
              <p className="font-bold text-success">{mode === "pickup" ? "Pedido retirado!" : "Pedido entregue!"} Bom apetite 🎉</p>
              <Link to="/inicio"><PillButton size="md" className="mt-3">Voltar ao início</PillButton></Link>
            </div>
          )}

          {mode === "delivery" && courier && (
            <div className="rounded-2xl border border-border p-3">
              <div className="flex items-center gap-3">
                <img src={courier.photo_url} alt={courier.name} className="h-12 w-12 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-bold">{courier.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-rating text-rating" /> {Number(courier.rating).toFixed(1)} · {courier.trips} entregas
                  </p>
                </div>
                <a href={`sms:${courier.phone}`} aria-label="Mensagem" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary-deep">
                  <MessageCircle className="h-4.5 w-4.5" />
                </a>
                <a href={`tel:${courier.phone}`} aria-label="Ligar" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Phone className="h-4.5 w-4.5" />
                </a>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground"><Bike className="h-4 w-4" /> {courier.vehicle}</span>
                <span className="rounded-md bg-primary-deep px-2 py-0.5 font-bold text-primary-foreground">{courier.plate}</span>
              </div>
            </div>
          )}

          <section>
            <h2 className="text-sm font-bold">Status do pedido</h2>
            <ol className="mt-2 space-y-0">
              {events.map((e, i) => (
                <li key={e.id} className="relative flex gap-3 pb-3 animate-fade-up">
                  <span className="relative flex flex-col items-center">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                    {i < events.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                  </span>
                  <span className="flex flex-1 justify-between text-sm">
                    <span>{statusLabel(e.status as OrderStatus, mode)}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(e.created_at), "HH:mm")}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl bg-muted p-4 text-sm">
            <p className="font-bold">{order.restaurants.logo_emoji} {order.restaurants.name}</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {order.order_items.map((it) => (
                <li key={it.id} className="flex justify-between">
                  <span>{it.quantity}× {it.name}</span>
                  <span>{formatBRL(Number(it.unit_price) * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-between border-t border-border pt-2 font-bold">
              <span>Total</span>
              <span>{formatBRL(Number(order.total))}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
