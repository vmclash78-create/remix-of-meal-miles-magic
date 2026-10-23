import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, CalendarClock, Clock, Heart, ShoppingBag, Star, Truck, Users, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { BottomSheet } from "@/components/foodup/BottomSheet";
import { CouponCard } from "@/components/foodup/CouponCard";
import { ItemDetailSheet } from "@/components/foodup/ItemDetailSheet";
import { MenuItemCard, MenuItemCardSkeleton } from "@/components/foodup/MenuItemCard";
import { MobileShell } from "@/components/foodup/MobileShell";
import { PillButton } from "@/components/foodup/PillButton";
import { EmptyState, ErrorState } from "@/components/foodup/StateViews";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthUser } from "@/hooks/use-auth-user";
import { supabase } from "@/integrations/supabase/client";
import { favoritesQuery, restaurantQuery } from "@/lib/queries";
import { formatBRL, lineTotal } from "@/lib/pricing";
import type { MenuItem } from "@/lib/types";
import { lineOptionDeltas, useCart } from "@/stores/cart";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/restaurante/$slug")({
  head: () => ({
    meta: [
      { title: "Restaurante | FoodUp" },
      { name: "description", content: "Cardápio, cupons e entrega rápida pelo FoodUp." },
      { property: "og:title", content: "Restaurante | FoodUp" },
      { property: "og:description", content: "Cardápio, cupons e entrega rápida pelo FoodUp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RestaurantPage,
});

const SLOTS = ["Hoje · 12:00", "Hoje · 12:30", "Hoje · 19:00", "Hoje · 19:30", "Hoje · 20:00", "Amanhã · 12:00"];

function RestaurantPage() {
  const { slug } = Route.useParams();
  const router = useRouter();
  const user = useAuthUser();
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery(restaurantQuery(slug));
  const favorites = useQuery(favoritesQuery(user.id));
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [slot, setSlot] = useState<string | null>(null);
  const couponCode = useCart((s) => s.couponCode);
  const setCoupon = useCart((s) => s.setCoupon);
  const cartRestaurant = useCart((s) => s.restaurant);
  const lines = useCart((s) => s.lines);

  const restaurant = data?.restaurant;
  const isFav = !!restaurant && (favorites.data ?? []).some((f) => f.restaurant_id === restaurant.id);

  const toggleFav = useMutation({
    mutationFn: async () => {
      if (!restaurant) return;
      if (isFav) {
        const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("restaurant_id", restaurant.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("favorites").insert({ user_id: user.id, restaurant_id: restaurant.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites", user.id] });
      toast.success(isFav ? "Removido dos salvos" : "Salvo nos favoritos");
    },
    onError: () => toast.error("Não foi possível atualizar seus salvos."),
  });

  const back = () => (window.history.length > 1 ? router.history.back() : router.navigate({ to: "/inicio" }));

  if (isLoading) {
    return (
      <MobileShell>
        <Skeleton className="h-60 w-full rounded-none" />
        <div className="-mt-12 px-5">
          <Skeleton className="h-28 w-full rounded-[24px]" />
        </div>
        <div className="grid grid-cols-2 gap-3 px-5 pt-6">
          {Array.from({ length: 4 }).map((_, i) => <MenuItemCardSkeleton key={i} />)}
        </div>
      </MobileShell>
    );
  }

  if (error) {
    return (
      <MobileShell>
        <ErrorState className="pt-32" message="Não foi possível carregar este restaurante." onRetry={() => refetch()} />
      </MobileShell>
    );
  }

  if (!restaurant) {
    return (
      <MobileShell>
        <EmptyState
          className="pt-32"
          icon={<UtensilsCrossed className="h-8 w-8" />}
          title="Restaurante não encontrado"
          action={<Link to="/inicio" className="font-semibold text-primary-deep">Voltar ao início</Link>}
        />
      </MobileShell>
    );
  }

  const fee = Number(restaurant.delivery_fee);
  const cartHere = cartRestaurant?.id === restaurant.id ? lines : [];
  const cartCount = cartHere.reduce((n, l) => n + l.quantity, 0);
  const cartTotal = cartHere.reduce((s, l) => s + lineTotal({ basePrice: l.basePrice, optionDeltas: lineOptionDeltas(l), quantity: l.quantity }), 0);

  return (
    <MobileShell className={cn(cartCount > 0 && "pb-28")}>
      <div className="relative h-60 overflow-hidden">
        <img src={`${restaurant.cover_url.split("?")[0]}?w=900&q=75`} alt={restaurant.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-transparent to-transparent" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+14px)]">
          <IconBtn label="Voltar" onClick={back}><ArrowLeft className="h-5 w-5" /></IconBtn>
          <div className="flex gap-2">
            <IconBtn label={isFav ? "Remover dos salvos" : "Salvar"} onClick={() => toggleFav.mutate()}>
              <Heart className={cn("h-5 w-5", isFav && "fill-destructive text-destructive")} />
            </IconBtn>
            <Link to="/cesta" aria-label="Cesta" className="flex h-10 w-10 items-center justify-center rounded-full bg-card/95 text-foreground shadow-soft">
              <ShoppingBag className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="relative -mt-14 px-5">
        <div className="flex gap-3 rounded-[24px] bg-card p-4 shadow-soft">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-3xl">
            {restaurant.logo_emoji}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight text-foreground">{restaurant.name}</h1>
            <p className="text-xs text-muted-foreground">{restaurant.branch} · {restaurant.address}</p>
            <p className="mt-1 flex items-center gap-1 text-xs">
              <Star className="h-3.5 w-3.5 fill-rating text-rating" />
              <strong>{Number(restaurant.rating).toFixed(1)}</strong>
              <span className="text-muted-foreground">({(restaurant.rating_count / 1000).toFixed(1)} mil)</span>
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs font-semibold text-primary-deep">
              <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> {fee === 0 ? "Entrega grátis" : `Taxa ${formatBRL(fee)}`}</span>
              <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {restaurant.eta_min} min</span>
            </p>
          </div>
        </div>
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-5">
        <Chip
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
              toast.success("Link do pedido em grupo copiado! Envie para seus amigos.");
            } catch {
              toast.error("Não foi possível copiar o link.");
            }
          }}
        >
          <Users className="h-4 w-4" /> Pedido em grupo
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">15% off</span>
        </Chip>
        <Chip onClick={() => setScheduleOpen(true)}>
          <CalendarClock className="h-4 w-4" /> {slot ? `Agendado: ${slot}` : "Agendar"}
        </Chip>
      </div>

      {data.coupons.length > 0 && (
        <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto px-5">
          {data.coupons.map((c) => (
            <CouponCard
              key={c.id}
              coupon={c}
              restaurantName={restaurant.name}
              variant="light"
              applied={couponCode === c.code}
              onApply={(code) => {
                setCoupon(code);
                toast.success(`Cupom ${code} resgatado!`);
              }}
              className="min-w-[260px]"
            />
          ))}
        </div>
      )}

      <section className="px-5 pb-8 pt-6">
        <h2 className="text-base font-bold text-foreground">Para você</h2>
        {data.items.length === 0 ? (
          <EmptyState icon={<UtensilsCrossed className="h-8 w-8" />} title="Cardápio vazio" message="Este restaurante ainda não cadastrou itens." />
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {data.items.map((item, i) => (
              <div key={item.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                <MenuItemCard item={item} onSelect={setSelected} />
              </div>
            ))}
          </div>
        )}
      </section>

      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] animate-fade-up">
          <Link to="/cesta" className="flex h-14 items-center justify-between rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-soft">
            <span className="flex items-center gap-2 text-sm">
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-card px-1.5 text-xs font-bold text-primary-deep">{cartCount}</span>
              Ver cesta
            </span>
            <span className="text-sm">{formatBRL(cartTotal)}</span>
          </Link>
        </div>
      )}

      <ItemDetailSheet item={selected} restaurant={restaurant} onOpenChange={(o) => !o && setSelected(null)} />

      <BottomSheet open={scheduleOpen} onOpenChange={setScheduleOpen} title="Agendar pedido" description="Escolha quando quer receber.">
        <div className="grid grid-cols-2 gap-2 px-5 pb-8 pt-2">
          {SLOTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSlot(s)}
              className={cn("rounded-2xl border p-3 text-sm font-semibold", slot === s ? "border-primary bg-primary-soft text-primary-deep" : "border-border")}
            >
              {s}
            </button>
          ))}
          <PillButton
            className="col-span-2 mt-2"
            disabled={!slot}
            onClick={() => {
              setScheduleOpen(false);
              toast.success(`Pedido agendado para ${slot}`);
            }}
          >
            Confirmar horário
          </PillButton>
        </div>
      </BottomSheet>
    </MobileShell>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="flex h-10 w-10 items-center justify-center rounded-full bg-card/95 text-foreground shadow-soft active:scale-95">
      {children}
    </button>
  );
}

function Chip({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-semibold text-foreground active:scale-95">
      {children}
    </button>
  );
}
