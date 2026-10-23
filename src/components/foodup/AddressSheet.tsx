import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Home, MapPin, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomSheet } from "./BottomSheet";
import { ErrorState } from "./StateViews";
import { addressesQuery } from "@/lib/queries";
import { useLocationStore } from "@/stores/cart";
import { cn } from "@/lib/utils";

export const addressIcon = (label: string) =>
  label === "Casa" ? Home : label === "Trabalho" ? Briefcase : MapPin;

interface AddressSheetProps {
  userId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  returnTo: "/inicio" | "/cesta";
}

export function AddressSheet({ userId, open, onOpenChange, returnTo }: AddressSheetProps) {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useQuery(addressesQuery(userId));
  const selectedId = useLocationStore((s) => s.selectedAddressId);
  const select = useLocationStore((s) => s.setSelectedAddressId);

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Onde você está?" description="Escolha o endereço de entrega.">
      <div className="space-y-2 px-5 pb-8 pt-2">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
        ) : error ? (
          <ErrorState message="Não foi possível carregar seus endereços." onRetry={() => refetch()} />
        ) : (
          (data ?? []).map((a) => {
            const Icon = addressIcon(a.label);
            const active = a.id === selectedId;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  select(a.id);
                  onOpenChange(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition",
                  active ? "border-primary bg-primary-soft" : "border-border bg-card",
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-primary-deep">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-foreground">{a.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {[a.line1, a.line2].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </button>
            );
          })
        )}
        <button
          type="button"
          onClick={() => {
            onOpenChange(false);
            navigate({ to: "/confirmar-local", search: { voltar: returnTo } });
          }}
          className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-primary p-3 text-left text-primary-deep"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
            <Plus className="h-4.5 w-4.5" />
          </span>
          <span className="text-sm font-bold">Adicionar novo endereço</span>
        </button>
      </div>
    </BottomSheet>
  );
}
