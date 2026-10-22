import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, LogOut, MapPin, Receipt, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { addressIcon } from "@/components/foodie/AddressSheet";
import { MobileShell } from "@/components/foodie/MobileShell";
import { PillButton } from "@/components/foodie/PillButton";
import { ErrorState } from "@/components/foodie/StateViews";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthUser } from "@/hooks/use-auth-user";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/pricing";
import { addressesQuery, ordersQuery, profileQuery } from "@/lib/queries";
import { statusLabel, type OrderStatus } from "@/lib/simulation";
import { useLocationStore } from "@/stores/cart";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil | Foodie" },
      { name: "description", content: "Seus pedidos, endereços e dados da conta Foodie." },
      { property: "og:title", content: "Perfil | Foodie" },
      { property: "og:description", content: "Seus pedidos, endereços e dados da conta Foodie." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const user = useAuthUser();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profile = useQuery(profileQuery(user.id));
  const orders = useQuery(ordersQuery(user.id));
  const addresses = useQuery(addressesQuery(user.id));
  const selectedId = useLocationStore((s) => s.selectedAddressId);
  const setSelected = useLocationStore((s) => s.setSelectedAddressId);

  const removeAddress = async (id: string) => {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) return toast.error("Não foi possível remover o endereço.");
    if (selectedId === id) setSelected(null);
    qc.invalidateQueries({ queryKey: ["addresses", user.id] });
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
  };

  const name = profile.data?.full_name ?? user.email ?? "";

  return (
    <MobileShell withNav>
      <header className="rounded-b-[32px] bg-gradient-header px-5 pb-8 pt-[calc(env(safe-area-inset-top)+20px)] text-primary-foreground">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-card text-xl font-bold text-primary-deep">
            {profile.data?.avatar_url ? <img src={profile.data.avatar_url} alt="" className="h-full w-full object-cover" /> : name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            {profile.isLoading ? <Skeleton className="h-5 w-32 bg-primary-foreground/30" /> : <p className="truncate text-lg font-bold">{name}</p>}
            <p className="truncate text-sm opacity-85">{user.email}</p>
          </div>
        </div>
      </header>

      <div className="space-y-5 px-5 pt-5">
        <section>
          <h2 className="mb-2 text-sm font-bold">Meus pedidos</h2>
          {orders.isLoading ? (
            <Skeleton className="h-16 w-full rounded-2xl" />
          ) : orders.error ? (
            <ErrorState message="Falha ao carregar pedidos." onRetry={() => orders.refetch()} />
          ) : !orders.data?.length ? (
            <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-soft">Você ainda não fez pedidos.</p>
          ) : (
            <ul className="space-y-2">
              {orders.data.map((o) => (
                <li key={o.id}>
                  <Link to="/pedido/$id" params={{ id: o.id }} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-lg">{o.restaurants?.logo_emoji ?? <Receipt className="h-4 w-4" />}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{o.restaurants?.name} · #{o.short_code}</span>
                      <span className="block text-xs text-muted-foreground">
                        {format(new Date(o.created_at), "dd/MM HH:mm")} · {statusLabel(o.status as OrderStatus, o.mode === "pickup" ? "pickup" : "delivery")}
                      </span>
                    </span>
                    <span className="text-sm font-bold">{formatBRL(Number(o.total))}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">Endereços</h2>
            <Link to="/confirmar-local" search={{ voltar: "/inicio" }} className="text-xs font-semibold text-primary-deep">+ Adicionar</Link>
          </div>
          {addresses.isLoading ? (
            <Skeleton className="h-16 w-full rounded-2xl" />
          ) : !addresses.data?.length ? (
            <p className="flex items-center gap-2 rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-soft"><MapPin className="h-4 w-4" /> Nenhum endereço salvo.</p>
          ) : (
            <ul className="space-y-2">
              {addresses.data.map((a) => {
                const Icon = addressIcon(a.label);
                return (
                  <li key={a.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
                    <Icon className="h-5 w-5 text-primary-deep" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{a.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">{a.line1}</span>
                    </span>
                    <button type="button" aria-label="Remover endereço" onClick={() => removeAddress(a.id)} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <PillButton variant="outline" className="w-full" onClick={signOut}>
          <LogOut className="h-4 w-4" /> Sair da conta
        </PillButton>
      </div>
    </MobileShell>
  );
}
