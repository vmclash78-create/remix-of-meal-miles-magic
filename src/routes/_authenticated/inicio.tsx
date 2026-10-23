import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronDown, MapPin, RotateCcw, Search, Store, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import courierImg from "@/assets/courier-scooter.png";
import { AddressSheet } from "@/components/foodup/AddressSheet";
import { CouponCard } from "@/components/foodup/CouponCard";
import { MobileShell } from "@/components/foodup/MobileShell";
import { RestaurantCard, RestaurantCardSkeleton } from "@/components/foodup/RestaurantCard";
import { EmptyState, ErrorState } from "@/components/foodup/StateViews";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useSelectedAddress } from "@/hooks/use-selected-address";
import { categoriesQuery, couponsQuery, ordersQuery, profileQuery, restaurantsQuery } from "@/lib/queries";
import { formatBRL } from "@/lib/pricing";
import { useCart } from "@/stores/cart";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Início | FoodUp" },
      { name: "description", content: "Restaurantes perto de você, ofertas e seus pedidos favoritos." },
      { property: "og:title", content: "Início | FoodUp" },
      { property: "og:description", content: "Restaurantes perto de você, ofertas e seus pedidos favoritos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const user = useAuthUser();
  const [category, setCategory] = useState("todos");
  const [search, setSearch] = useState("");
  const [addrOpen, setAddrOpen] = useState(false);
  const { address, isLoading: addrLoading } = useSelectedAddress(user.id);
  const profile = useQuery(profileQuery(user.id));
  const categories = useQuery(categoriesQuery());
  const restaurants = useQuery(restaurantsQuery());
  const coupons = useQuery(couponsQuery());
  const orders = useQuery(ordersQuery(user.id));
  const couponCode = useCart((s) => s.couponCode);
  const setCoupon = useCart((s) => s.setCoupon);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (restaurants.data ?? []).filter(
      (r) =>
        (category === "todos" || r.category_slug === category) &&
        (!q || `${r.name} ${r.branch ?? ""} ${r.category_slug}`.toLowerCase().includes(q)),
    );
  }, [restaurants.data, category, search]);

  const orderAgain = useMemo(() => {
    const seen = new Set<string>();
    const out: { key: string; name: string; image: string | null; price: number; when: string; slug: string }[] = [];
    for (const o of orders.data ?? []) {
      for (const it of o.order_items ?? []) {
        const k = it.menu_item_id ?? it.name;
        if (seen.has(k) || !o.restaurants) continue;
        seen.add(k);
        out.push({
          key: k,
          name: it.name,
          image: it.image_url,
          price: Number(it.unit_price),
          when: formatDistanceToNow(new Date(o.created_at), { locale: ptBR, addSuffix: true }),
          slug: o.restaurants.slug,
        });
      }
    }
    return out.slice(0, 8);
  }, [orders.data]);

  const name = profile.data?.full_name ?? user.email ?? "";
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const globalCoupons = (coupons.data ?? []).filter((c) => !c.restaurant_id);
  const storeCoupons = (coupons.data ?? []).filter((c) => c.restaurant_id);

  const applyCoupon = (code: string) => {
    setCoupon(code);
    toast.success(`Cupom ${code} resgatado! Ele será aplicado na sua cesta.`);
  };

  return (
    <MobileShell withNav>
      {/* Green header */}
      <header className="rounded-b-[32px] bg-gradient-header px-5 pb-6 pt-[calc(env(safe-area-inset-top)+16px)]">
        <div className="flex items-center gap-3">
          <Link to="/perfil" aria-label="Perfil" className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card text-sm font-bold text-primary-deep ring-2 ring-primary-foreground/40">
            {profile.data?.avatar_url ? <img src={profile.data.avatar_url} alt="" className="h-full w-full object-cover" /> : initials || "?"}
          </Link>
          <button type="button" onClick={() => setAddrOpen(true)} className="min-w-0 flex-1 text-left">
            <span className="flex items-center gap-1 text-[11px] font-medium text-primary-foreground/80">
              <MapPin className="h-3 w-3" /> Entregar em
            </span>
            {addrLoading ? (
              <Skeleton className="mt-1 h-4 w-40 bg-primary-foreground/30" />
            ) : (
              <span className="flex items-center gap-1 text-sm font-bold text-primary-foreground">
                <span className="truncate">
                  {address ? `${address.label} · ${address.line1}` : "Defina seu endereço"}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0" />
              </span>
            )}
          </button>
        </div>
        <label className="mt-4 flex h-12 items-center gap-3 rounded-full bg-card px-4 shadow-soft">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar restaurantes ou pratos"
            aria-label="Buscar"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Limpar busca">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </label>
      </header>

      <div className="space-y-7 pt-5">
        {/* Banner */}
        {!search && (
          <section className="px-5">
            <div className="relative overflow-hidden rounded-[24px] bg-primary p-5 text-primary-foreground shadow-soft">
              <div className="relative z-10 max-w-[58%]">
                <p className="text-[11px] font-semibold uppercase tracking-wider opacity-85">Só hoje</p>
                <h2 className="mt-1 text-2xl font-extrabold leading-tight">Entrega rápida e grátis!</h2>
                <p className="mt-1 text-xs opacity-90">Use o cupom FRETEGRATIS em qualquer pedido.</p>
                <button
                  type="button"
                  onClick={() => applyCoupon("FRETEGRATIS")}
                  className="mt-3 rounded-full bg-card px-4 py-2 text-xs font-bold text-primary-deep active:scale-95"
                >
                  {couponCode === "FRETEGRATIS" ? "Cupom ativo ✓" : "Pedir agora"}
                </button>
              </div>
              <img src={courierImg} alt="" width={1024} height={1024} className="absolute -bottom-6 -right-6 w-48 animate-float" />
            </div>
          </section>
        )}

        {/* Categories */}
        <section>
          <SectionTitle title="Categorias" />
          <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-5 pb-1">
            {categories.isLoading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-16 shrink-0 rounded-2xl" />)
              : [{ slug: "todos", name: "Todos", emoji: "🍽️" }, ...(categories.data ?? [])].map((c) => {
                  const active = category === c.slug;
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => setCategory(c.slug)}
                      aria-pressed={active}
                      className={cn(
                        "flex w-16 shrink-0 flex-col items-center gap-1 rounded-2xl py-2.5 text-[11px] font-semibold transition-all",
                        active ? "bg-primary text-primary-foreground shadow-soft" : "bg-card text-foreground",
                      )}
                    >
                      <span className="text-2xl">{c.emoji}</span>
                      {c.name}
                    </button>
                  );
                })}
          </div>
          {categories.error && <ErrorState message="Falha ao carregar categorias." onRetry={() => categories.refetch()} />}
        </section>

        {/* Order again */}
        {!search && (
          <section>
            <SectionTitle title="Peça de novo" />
            <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-5 pb-1">
              {orders.isLoading ? (
                Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-56 shrink-0 rounded-2xl" />)
              ) : orders.error ? (
                <p className="text-sm text-muted-foreground">Não foi possível carregar seus pedidos.</p>
              ) : orderAgain.length === 0 ? (
                <div className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-sm text-muted-foreground shadow-soft">
                  <RotateCcw className="h-5 w-5 text-primary" /> Seus pedidos aparecerão aqui para repetir com um toque.
                </div>
              ) : (
                orderAgain.map((it) => (
                  <Link
                    key={it.key}
                    to="/restaurante/$slug"
                    params={{ slug: it.slug }}
                    className="flex w-60 shrink-0 items-center gap-3 rounded-2xl bg-card p-2.5 shadow-soft"
                  >
                    {it.image && <img src={`${it.image.split("?")[0]}?w=120&h=120&fit=crop`} alt="" className="h-12 w-12 rounded-xl object-cover" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{it.name}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{it.when} · {formatBRL(it.price)}</span>
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-primary-deep">
                      <RotateCcw className="h-4 w-4" />
                    </span>
                  </Link>
                ))
              )}
            </div>
          </section>
        )}

        {/* Deals */}
        {!search && (
          <section>
            <SectionTitle title="Ofertas para você" link={{ to: "/ofertas", label: "Ver todas" }} />
            <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-5 pb-1">
              {coupons.isLoading
                ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-36 w-60 shrink-0 rounded-[20px]" />)
                : [...globalCoupons, ...storeCoupons.slice(0, 2)].map((c, i) => (
                    <CouponCard
                      key={c.id}
                      coupon={c}
                      restaurantName={c.restaurants?.name}
                      applied={couponCode === c.code}
                      onApply={applyCoupon}
                      variant={i % 2 === 0 ? "dark" : "light"}
                    />
                  ))}
            </div>
            {coupons.error && <ErrorState message="Falha ao carregar ofertas." onRetry={() => coupons.refetch()} />}
          </section>
        )}

        {/* Restaurants */}
        <section className="px-5 pb-4">
          <h2 className="text-base font-bold text-foreground">
            {search ? `Resultados para “${search}”` : "Restaurantes perto de você"}
          </h2>
          {restaurants.isLoading ? (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <RestaurantCardSkeleton key={i} />)}
            </div>
          ) : restaurants.error ? (
            <ErrorState message="Não foi possível carregar os restaurantes." onRetry={() => restaurants.refetch()} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Store className="h-8 w-8" />}
              title="Nenhum restaurante encontrado"
              message="Tente outra categoria ou termo de busca."
            />
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {filtered.map((r, i) => (
                <div key={r.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <RestaurantCard restaurant={r} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <AddressSheet userId={user.id} open={addrOpen} onOpenChange={setAddrOpen} returnTo="/inicio" />
    </MobileShell>
  );
}

function SectionTitle({ title, link }: { title: string; link?: { to: "/ofertas"; label: string } }) {
  return (
    <div className="flex items-center justify-between px-5">
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      {link && (
        <Link to={link.to} className="text-xs font-semibold text-primary-deep">
          {link.label}
        </Link>
      )}
    </div>
  );
}
