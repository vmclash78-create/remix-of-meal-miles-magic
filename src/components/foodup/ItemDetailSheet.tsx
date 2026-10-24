import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Flame, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BottomSheet } from "./BottomSheet";
import { PillButton } from "./PillButton";
import { QuantityStepper } from "./QuantityStepper";
import { ErrorState } from "./StateViews";
import { itemOptionsQuery } from "@/lib/queries";
import { formatBRL, lineTotal } from "@/lib/pricing";
import type { ItemOption, MenuItem, Restaurant } from "@/lib/types";
import { useCart } from "@/stores/cart";
import { cn } from "@/lib/utils";

interface ItemDetailSheetProps {
  item: MenuItem | null;
  restaurant: Restaurant;
  onOpenChange: (open: boolean) => void;
}

export function ItemDetailSheet({ item, restaurant, onOpenChange }: ItemDetailSheetProps) {
  const open = item != null;
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={item?.name ?? "Item"} hideHeader>
      {item && <ItemDetailBody key={item.id} item={item} restaurant={restaurant} onDone={() => onOpenChange(false)} />}
    </BottomSheet>
  );
}

function ItemDetailBody({ item, restaurant, onDone }: { item: MenuItem; restaurant: Restaurant; onDone: () => void }) {
  const { data: options, isLoading, error, refetch } = useQuery(itemOptionsQuery(item.id));
  const cartRestaurant = useCart((s) => s.restaurant);
  const addLine = useCart((s) => s.addLine);
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [confirmReplace, setConfirmReplace] = useState(false);

  const sizes = useMemo(() => (options ?? []).filter((o) => o.kind === "size"), [options]);
  const addonGroups = useMemo(() => {
    const groups = new Map<string, ItemOption[]>();
    (options ?? []).filter((o) => o.kind === "addon").forEach((o) => {
      groups.set(o.group_name, [...(groups.get(o.group_name) ?? []), o]);
    });
    return [...groups.entries()];
  }, [options]);

  useEffect(() => {
    if (sizes.length && !sizeId) setSizeId((sizes.find((s) => s.is_default) ?? sizes[0]).id);
  }, [sizes, sizeId]);

  const size = sizes.find((s) => s.id === sizeId) ?? null;
  const addons = (options ?? []).filter((o) => addonIds.includes(o.id));
  const total = lineTotal({
    basePrice: Number(item.price),
    optionDeltas: [...(size ? [Number(size.price_delta)] : []), ...addons.map((a) => Number(a.price_delta))],
    quantity: qty,
  });

  const otherRestaurant = cartRestaurant && cartRestaurant.id !== restaurant.id;

  const add = () => {
    if (otherRestaurant) {
      setConfirmReplace(true);
      return;
    }
    addSelectedLine();
  };

  const addSelectedLine = () => {
    addLine(
      {
        id: restaurant.id,
        slug: restaurant.slug,
        name: restaurant.name,
        deliveryFee: Number(restaurant.delivery_fee),
        emoji: restaurant.logo_emoji,
      },
      {
        menuItemId: item.id,
        name: item.name,
        imageUrl: item.image_url,
        basePrice: Number(item.price),
        size: size ? { id: size.id, name: size.name, delta: Number(size.price_delta) } : null,
        addons: addons.map((a) => ({ id: a.id, name: a.name, delta: Number(a.price_delta) })),
        quantity: qty,
        note: note.trim(),
      },
    );
    toast.success(`${qty}× ${item.name} na cesta`);
    onDone();
  };

  return (
    <div className="flex flex-col">
      <div className="mx-4 mt-2 overflow-hidden rounded-[24px] bg-muted">
        <img
          src={`${item.image_url.split("?")[0]}?w=800&h=560&fit=crop&q=75`}
          alt={item.name}
          className="aspect-[10/7] w-full object-cover"
        />
      </div>
      <div className="px-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold text-foreground">{item.name}</h2>
          <p className="text-lg font-bold text-primary-deep">{formatBRL(Number(item.price))}</p>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{restaurant.logo_emoji} {restaurant.name}</span>·
          <Star className="h-3 w-3 fill-rating text-rating" /> {Number(restaurant.rating).toFixed(1)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {item.prep_min} min</span>
          <span className="inline-flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-primary" /> {item.kcal} kcal</span>
          {Number(restaurant.delivery_fee) === 0 && (
            <span className="inline-flex items-center gap-1 text-success"><Truck className="h-3.5 w-3.5" /> Entrega grátis</span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 px-5 py-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
        </div>
      ) : error ? (
        <ErrorState message="Não foi possível carregar as opções." onRetry={() => refetch()} />
      ) : (
        <div className="space-y-6 px-5 py-5">
          {sizes.length > 0 && (
            <section>
              <GroupHeader title="Tamanho" badge="Escolha 1" />
              <div role="radiogroup" aria-label="Tamanho" className="mt-2 divide-y divide-border">
                {sizes.map((s) => {
                  const checked = s.id === sizeId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      onClick={() => setSizeId(s.id)}
                      className="flex w-full items-center gap-3 py-3 text-left"
                    >
                      <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2", checked ? "border-primary" : "border-border")}>
                        {checked && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                      </span>
                      <span className="flex-1 text-sm font-medium text-foreground">{s.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatBRL(Number(item.price) + Number(s.price_delta))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
          {addonGroups.map(([group, opts]) => (
            <section key={group}>
              <GroupHeader title={group} badge="Opcional" />
              <div className="mt-2 divide-y divide-border">
                {opts.map((o) => {
                  const checked = addonIds.includes(o.id);
                  return (
                    <label key={o.id} className="flex cursor-pointer items-center gap-3 py-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) =>
                          setAddonIds((ids) => (v === true ? [...ids, o.id] : ids.filter((x) => x !== o.id)))
                        }
                      />
                      <span className="flex-1 text-sm font-medium text-foreground">{o.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {Number(o.price_delta) > 0 ? `+${formatBRL(Number(o.price_delta))}` : "Grátis"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
          <section>
            <GroupHeader title="Observação para o restaurante" badge="Opcional" />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 140))}
              placeholder="Ex.: sem cebola, molho à parte…"
              rows={3}
              className="mt-2 w-full resize-none rounded-2xl bg-input p-3 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-right text-[11px] text-muted-foreground">{note.length}/140</p>
          </section>
        </div>
      )}

      <div className="sticky bottom-0 border-t border-border bg-card px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3">
        <div className="flex items-center gap-3">
          <QuantityStepper value={qty} onChange={setQty} />
          <PillButton className="flex-1" onClick={add} disabled={isLoading || !!error}>
            Adicionar à cesta · {formatBRL(total)}
          </PillButton>
        </div>
      </div>

      <AlertDialog open={confirmReplace} onOpenChange={setConfirmReplace}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Trocar de restaurante?</AlertDialogTitle>
            <AlertDialogDescription>
              Sua cesta atual contém itens de {cartRestaurant?.name}. Para adicionar este prato, os itens atuais serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter cesta</AlertDialogCancel>
            <AlertDialogAction onClick={addSelectedLine}>Substituir e adicionar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function GroupHeader({ title, badge }: { title: string; badge: string }) {
  return (
    <div className="flex items-center gap-2">
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{badge}</span>
    </div>
  );
}
