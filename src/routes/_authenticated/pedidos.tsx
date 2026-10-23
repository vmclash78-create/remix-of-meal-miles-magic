import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Receipt } from "lucide-react";
import { format } from "date-fns";
import { MobileShell } from "@/components/foodup/MobileShell";
import { PillButton } from "@/components/foodup/PillButton";
import { EmptyState, ErrorState } from "@/components/foodup/StateViews";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthUser } from "@/hooks/use-auth-user";
import { formatBRL } from "@/lib/pricing";
import { ordersQuery } from "@/lib/queries";
import { statusLabel, type OrderStatus } from "@/lib/simulation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos | FoodUp" },
      { name: "description", content: "Acompanhe seus pedidos em andamento e veja o histórico no FoodUp." },
      { property: "og:title", content: "Pedidos | FoodUp" },
      { property: "og:description", content: "Acompanhe seus pedidos em andamento e veja o histórico no FoodUp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrdersPage,
});

const FINISHED = new Set(["delivered", "cancelled"]);

function OrdersPage() {
  const user = useAuthUser();
  const { data, isLoading, error, refetch } = useQuery(ordersQuery(user.id));
  const active = (data ?? []).filter((o) => !FINISHED.has(o.status));
  const past = (data ?? []).filter((o) => FINISHED.has(o.status));

  return (
    <MobileShell withNav>
      <header className="rounded-b-[32px] bg-gradient-header px-5 pb-6 pt-[calc(env(safe-area-inset-top)+20px)] text-brand-white">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-sm opacity-80">Acompanhe e repita seus pedidos</p>
      </header>
      <div className="space-y-6 px-5 pt-5">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
        ) : error ? (
          <ErrorState message="Não foi possível carregar seus pedidos." onRetry={() => refetch()} />
        ) : !data?.length ? (
          <EmptyState
            mascot
            title="Nenhum pedido por aqui"
            message="Nosso entregador está pronto para sair. Escolha um restaurante e faça seu primeiro pedido!"
            action={<Link to="/inicio"><PillButton size="md">Explorar restaurantes</PillButton></Link>}
          />
        ) : (
          <>
            {active.length > 0 && <OrderList title="Em andamento" orders={active} highlight />}
            {past.length > 0 && <OrderList title="Anteriores" orders={past} />}
          </>
        )}
      </div>
    </MobileShell>
  );
}

type OrderRow = NonNullable<ReturnType<typeof ordersQuery>["queryFn"]> extends (...a: never[]) => Promise<infer R>
  ? R extends (infer O)[]
    ? O
    : never
  : never;

function OrderList({ title, orders, highlight = false }: { title: string; orders: OrderRow[]; highlight?: boolean }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold">{title}</h2>
      <ul className="space-y-2">
        {orders.map((o) => (
          <li key={o.id}>
            <Link
              to="/pedido/$id"
              params={{ id: o.id }}
              className={cn("flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft", highlight && "ring-1 ring-primary/60")}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-lg">
                {o.restaurants?.logo_emoji ?? <Receipt className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{o.restaurants?.name} · #{o.short_code}</span>
                <span className={cn("block text-xs", highlight ? "font-semibold text-primary-deep" : "text-muted-foreground")}>
                  {format(new Date(o.created_at), "dd/MM HH:mm")} · {statusLabel(o.status as OrderStatus, o.mode === "pickup" ? "pickup" : "delivery")}
                </span>
              </span>
              <span className="text-sm font-bold">{formatBRL(Number(o.total))}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
