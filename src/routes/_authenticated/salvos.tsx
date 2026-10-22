import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { MobileShell } from "@/components/foodie/MobileShell";
import { PillButton } from "@/components/foodie/PillButton";
import { RestaurantCard, RestaurantCardSkeleton } from "@/components/foodie/RestaurantCard";
import { EmptyState, ErrorState } from "@/components/foodie/StateViews";
import { useAuthUser } from "@/hooks/use-auth-user";
import { favoritesQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/salvos")({
  head: () => ({
    meta: [
      { title: "Salvos | Foodie" },
      { name: "description", content: "Seus restaurantes favoritos no Foodie." },
      { property: "og:title", content: "Salvos | Foodie" },
      { property: "og:description", content: "Seus restaurantes favoritos no Foodie." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const user = useAuthUser();
  const { data, isLoading, error, refetch } = useQuery(favoritesQuery(user.id));
  return (
    <MobileShell withNav>
      <header className="rounded-b-[32px] bg-gradient-header px-5 pb-6 pt-[calc(env(safe-area-inset-top)+20px)] text-primary-foreground">
        <h1 className="text-2xl font-bold">Salvos</h1>
        <p className="text-sm opacity-85">Seus restaurantes favoritos</p>
      </header>
      <div className="px-5 pt-5">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <RestaurantCardSkeleton key={i} />)}</div>
        ) : error ? (
          <ErrorState message="Não foi possível carregar seus salvos." onRetry={() => refetch()} />
        ) : !data?.length ? (
          <EmptyState
            icon={<Heart className="h-8 w-8" />}
            title="Nada salvo ainda"
            message="Toque no coração de um restaurante para guardá-lo aqui."
            action={<Link to="/inicio"><PillButton size="md">Explorar</PillButton></Link>}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {data.map((f) => f.restaurants && <RestaurantCard key={f.restaurant_id} restaurant={f.restaurants} />)}
          </div>
        )}
      </div>
    </MobileShell>
  );
}
