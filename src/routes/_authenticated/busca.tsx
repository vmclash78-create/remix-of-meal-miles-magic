import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Search, Store, X } from "lucide-react";
import { MobileShell } from "@/components/foodup/MobileShell";
import { RestaurantCard, RestaurantCardSkeleton } from "@/components/foodup/RestaurantCard";
import { EmptyState, ErrorState } from "@/components/foodup/StateViews";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBRL } from "@/lib/pricing";
import { categoriesQuery, dishSearchQuery, restaurantsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/busca")({
  head: () => ({
    meta: [
      { title: "Busca | FoodUp" },
      { name: "description", content: "Encontre restaurantes e pratos perto de você no FoodUp." },
      { property: "og:title", content: "Busca | FoodUp" },
      { property: "og:description", content: "Encontre restaurantes e pratos perto de você no FoodUp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SearchPage,
});

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function SearchPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("todos");
  const term = useDebounced(search.trim(), 300);
  const categories = useQuery(categoriesQuery());
  const restaurants = useQuery(restaurantsQuery());
  const dishes = useQuery({ ...dishSearchQuery(term), enabled: term.length >= 2 });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (restaurants.data ?? []).filter(
      (r) =>
        (category === "todos" || r.category_slug === category) &&
        (!q || `${r.name} ${r.branch ?? ""} ${r.category_slug}`.toLowerCase().includes(q)),
    );
  }, [restaurants.data, category, search]);

  return (
    <MobileShell withNav>
      <header className="rounded-b-[32px] bg-gradient-header px-5 pb-6 pt-[calc(env(safe-area-inset-top)+20px)] text-brand-white">
        <h1 className="text-2xl font-bold">Busca</h1>
        <p className="text-sm opacity-80">Restaurantes, pratos e categorias</p>
        <label className="mt-4 flex h-12 items-center gap-3 rounded-full bg-card px-4 shadow-soft">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar restaurantes ou pratos"
            aria-label="Buscar"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Limpar busca">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </label>
      </header>

      <div className="space-y-6 pt-5">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1">
          {categories.isLoading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />)
            : [{ slug: "todos", name: "Todos", emoji: "🍽️" }, ...(categories.data ?? [])].map((c) => {
                const active = category === c.slug;
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setCategory(c.slug)}
                    aria-pressed={active}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors",
                      active ? "bg-primary text-primary-foreground" : "bg-card text-foreground",
                    )}
                  >
                    <span>{c.emoji}</span> {c.name}
                  </button>
                );
              })}
        </div>

        {term.length >= 2 && (
          <section className="px-5">
            <h2 className="text-base font-bold">Pratos</h2>
            {dishes.isLoading ? (
              <div className="mt-3 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
              </div>
            ) : dishes.error ? (
              <ErrorState message="Não foi possível buscar pratos." onRetry={() => dishes.refetch()} />
            ) : !dishes.data?.length ? (
              <p className="mt-2 text-sm text-muted-foreground">Nenhum prato com “{term}”.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {dishes.data.map((d) =>
                  d.restaurants ? (
                    <li key={d.id}>
                      <Link
                        to="/restaurante/$slug"
                        params={{ slug: d.restaurants.slug }}
                        className="flex items-center gap-3 rounded-2xl bg-card p-2.5 shadow-soft"
                      >
                        {d.image_url && (
                          <img src={`${d.image_url.split("?")[0]}?w=120&h=120&fit=crop`} alt="" loading="lazy" className="h-12 w-12 rounded-xl object-cover" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold">{d.name}</span>
                          <span className="block truncate text-[11px] text-muted-foreground">{d.restaurants.name}</span>
                        </span>
                        <span className="text-sm font-bold text-primary-deep">{formatBRL(Number(d.price))}</span>
                      </Link>
                    </li>
                  ) : null,
                )}
              </ul>
            )}
          </section>
        )}

        <section className="px-5 pb-4">
          <h2 className="text-base font-bold">{search.trim() ? "Restaurantes" : "Todos os restaurantes"}</h2>
          {restaurants.isLoading ? (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <RestaurantCardSkeleton key={i} />)}
            </div>
          ) : restaurants.error ? (
            <ErrorState message="Não foi possível carregar os restaurantes." onRetry={() => restaurants.refetch()} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Store className="h-8 w-8" />} title="Nenhum restaurante encontrado" message="Tente outra categoria ou termo de busca." />
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {filtered.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
          )}
        </section>
      </div>
    </MobileShell>
  );
}
