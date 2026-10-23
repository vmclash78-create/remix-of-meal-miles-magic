import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TicketPercent } from "lucide-react";
import { toast } from "sonner";
import { CouponCard } from "@/components/foodup/CouponCard";
import { MobileShell } from "@/components/foodup/MobileShell";
import { EmptyState, ErrorState } from "@/components/foodup/StateViews";
import { Skeleton } from "@/components/ui/skeleton";
import { couponsQuery } from "@/lib/queries";
import { useCart } from "@/stores/cart";

export const Route = createFileRoute("/_authenticated/ofertas")({
  head: () => ({
    meta: [
      { title: "Ofertas | FoodUp" },
      { name: "description", content: "Cupons de desconto e frete grátis no FoodUp." },
      { property: "og:title", content: "Ofertas | FoodUp" },
      { property: "og:description", content: "Cupons de desconto e frete grátis no FoodUp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  const { data, isLoading, error, refetch } = useQuery(couponsQuery());
  const couponCode = useCart((s) => s.couponCode);
  const setCoupon = useCart((s) => s.setCoupon);
  return (
    <MobileShell withNav>
      <header className="rounded-b-[32px] bg-gradient-header px-5 pb-6 pt-[calc(env(safe-area-inset-top)+20px)] text-primary-foreground">
        <h1 className="text-2xl font-bold">Ofertas</h1>
        <p className="text-sm opacity-85">Resgate um cupom e ele vai direto para sua cesta</p>
      </header>
      <div className="space-y-3 px-5 pt-5">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-[20px]" />)
        ) : error ? (
          <ErrorState message="Não foi possível carregar as ofertas." onRetry={() => refetch()} />
        ) : !data?.length ? (
          <EmptyState icon={<TicketPercent className="h-8 w-8" />} title="Nenhuma oferta agora" message="Volte mais tarde para novos cupons." />
        ) : (
          data.map((c, i) => (
            <div key={c.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
              <CouponCard
                coupon={c}
                restaurantName={c.restaurants?.name}
                variant={c.restaurant_id ? "light" : "dark"}
                applied={couponCode === c.code}
                onApply={(code) => {
                  setCoupon(code);
                  toast.success(`Cupom ${code} resgatado!`);
                }}
              />
            </div>
          ))
        )}
      </div>
    </MobileShell>
  );
}
