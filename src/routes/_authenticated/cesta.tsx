import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { ArrowLeft, Banknote, Bike, ChevronRight, CreditCard, MapPin, Plus, QrCode, ShoppingBag, Store, TicketPercent, X } from "lucide-react";
import { toast } from "sonner";
import { AddressSheet } from "@/components/foodie/AddressSheet";
import { BottomSheet } from "@/components/foodie/BottomSheet";
import { couponHeadline } from "@/components/foodie/CouponCard";
import { MobileShell } from "@/components/foodie/MobileShell";
import { PillButton } from "@/components/foodie/PillButton";
import { QuantityStepper } from "@/components/foodie/QuantityStepper";
import { EmptyState } from "@/components/foodie/StateViews";
import { MiniMap } from "@/components/map";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useSelectedAddress } from "@/hooks/use-selected-address";
import { placeOrder } from "@/lib/orders.functions";
import { computeTotals, formatBRL, lineTotal, type CouponRule } from "@/lib/pricing";
import { couponsQuery, restaurantQuery } from "@/lib/queries";
import { PAYMENT_LABELS, type PaymentMethod } from "@/lib/types";
import { lineOptionDeltas, useCart } from "@/stores/cart";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/cesta")({
  head: () => ({
    meta: [
      { title: "Sua cesta | Foodie" },
      { name: "description", content: "Revise seus itens, aplique cupons e finalize o pedido." },
      { property: "og:title", content: "Sua cesta | Foodie" },
      { property: "og:description", content: "Revise seus itens, aplique cupons e finalize o pedido." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckoutPage,
});

const PAYMENT_ICONS: Record<PaymentMethod, typeof QrCode> = { pix: QrCode, card: CreditCard, cash: Banknote };

function CheckoutPage() {
  const user = useAuthUser();
  const router = useRouter();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const cart = useCart();
  const { address, isLoading: addrLoading } = useSelectedAddress(user.id);
  const coupons = useQuery(couponsQuery());
  const restaurantDetail = useQuery({ ...restaurantQuery(cart.restaurant?.slug ?? ""), enabled: !!cart.restaurant });
  const place = useServerFn(placeOrder);
  const [addrOpen, setAddrOpen] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [placing, setPlacing] = useState(false);

  const couponRow = (coupons.data ?? []).find((c) => c.code === cart.couponCode) ?? null;
  const coupon: CouponRule | null = couponRow
    ? {
        ...couponRow,
        discount_type: couponRow.discount_type as CouponRule["discount_type"],
        value: Number(couponRow.value),
        min_subtotal: Number(couponRow.min_subtotal),
        max_discount: couponRow.max_discount == null ? null : Number(couponRow.max_discount),
      }
    : null;

  const fee = restaurantDetail.data?.restaurant ? Number(restaurantDetail.data.restaurant.delivery_fee) : cart.restaurant?.deliveryFee ?? 0;
  const totals = useMemo(
    () =>
      computeTotals({
        lines: cart.lines.map((l) => ({ basePrice: l.basePrice, optionDeltas: lineOptionDeltas(l), quantity: l.quantity })),
        restaurantDeliveryFee: fee,
        mode: cart.mode,
        coupon,
        restaurantId: cart.restaurant?.id ?? null,
      }),
    [cart.lines, fee, cart.mode, coupon, cart.restaurant?.id],
  );

  const availableCoupons = (coupons.data ?? []).filter((c) => !c.restaurant_id || c.restaurant_id === cart.restaurant?.id);
  const back = () => (window.history.length > 1 ? router.history.back() : navigate({ to: "/inicio" }));

  const submit = async () => {
    if (!cart.restaurant) return;
    if (cart.mode === "delivery" && !address) {
      toast.error("Adicione um endereço de entrega.");
      return;
    }
    setPlacing(true);
    try {
      const res = await place({
        data: {
          restaurantId: cart.restaurant.id,
          mode: cart.mode,
          addressId: cart.mode === "delivery" ? address!.id : null,
          couponCode: coupon && !totals.couponError ? coupon.code : null,
          paymentMethod: cart.paymentMethod,
          items: cart.lines.map((l) => ({
            menuItemId: l.menuItemId,
            quantity: l.quantity,
            optionIds: [...(l.size ? [l.size.id] : []), ...l.addons.map((a) => a.id)],
            note: l.note,
          })),
        },
      });
      cart.clear();
      qc.invalidateQueries({ queryKey: ["orders", user.id] });
      toast.success("Pedido confirmado!");
      navigate({ to: "/pedido/$id", params: { id: res.id }, replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível fazer o pedido.");
    } finally {
      setPlacing(false);
    }
  };

  const header = (
    <header className="sticky top-0 z-20 flex items-center gap-3 bg-background/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+14px)] backdrop-blur">
      <button type="button" onClick={back} aria-label="Voltar" className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-soft">
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="flex-1 text-center text-base font-bold">Checkout</h1>
      <span className="w-10" />
    </header>
  );

  if (cart.lines.length === 0 || !cart.restaurant) {
    return (
      <MobileShell withNav>
        {header}
        <EmptyState
          className="pt-20"
          icon={<ShoppingBag className="h-9 w-9" />}
          title="Sua cesta está vazia"
          message="Explore os restaurantes e adicione seus pratos favoritos."
          action={
            <Link to="/inicio">
              <PillButton size="md">Explorar restaurantes</PillButton>
            </Link>
          }
        />
      </MobileShell>
    );
  }

  const PayIcon = PAYMENT_ICONS[cart.paymentMethod];
  const restaurant = restaurantDetail.data?.restaurant;

  return (
    <MobileShell className="pb-32">
      {header}
      <div className="space-y-3 px-4">
        {/* Mode tabs */}
        <div className="grid grid-cols-2 rounded-full bg-card p-1 shadow-soft" role="tablist">
          {(["delivery", "pickup"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={cart.mode === m}
              type="button"
              onClick={() => cart.setMode(m)}
              className={cn(
                "flex h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all",
                cart.mode === m ? "bg-gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground",
              )}
            >
              {m === "delivery" ? <Bike className="h-4 w-4" /> : <Store className="h-4 w-4" />}
              {m === "delivery" ? "Entrega" : "Retirada"}
            </button>
          ))}
        </div>

        {/* Location card */}
        <div className="overflow-hidden rounded-[20px] bg-card shadow-soft">
          {cart.mode === "delivery" ? (
            addrLoading ? (
              <Skeleton className="h-40 w-full rounded-none" />
            ) : address ? (
              <>
                <MiniMap center={[address.lat, address.lng]} className="h-32 w-full" />
                <button type="button" onClick={() => setAddrOpen(true)} className="flex w-full items-center gap-3 p-4 text-left">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] text-muted-foreground">Entregar em · ~{restaurant?.eta_min ?? 25} min</span>
                    <span className="block text-sm font-bold">{address.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{[address.line1, address.line2].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="flex items-center text-xs font-semibold text-primary-deep">Alterar <ChevronRight className="h-4 w-4" /></span>
                </button>
              </>
            ) : (
              <Link to="/confirmar-local" search={{ voltar: "/cesta" }} className="flex items-center gap-3 p-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary-deep"><MapPin className="h-5 w-5" /></span>
                <span className="flex-1 text-sm font-bold">Adicionar endereço de entrega</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            )
          ) : restaurant ? (
            <>
              <MiniMap center={[restaurant.lat, restaurant.lng]} className="h-32 w-full" />
              <div className="p-4">
                <span className="block text-[11px] text-muted-foreground">Retirar em · pronto em ~{Math.max(10, restaurant.eta_min - 5)} min</span>
                <span className="block text-sm font-bold">{restaurant.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{restaurant.address}</span>
              </div>
            </>
          ) : (
            <Skeleton className="h-40 w-full rounded-none" />
          )}
        </div>

        {/* Items */}
        <div className="rounded-[20px] bg-card p-4 shadow-soft">
          <Link to="/restaurante/$slug" params={{ slug: cart.restaurant.slug }} className="flex items-center gap-2 text-sm font-bold">
            <span>{cart.restaurant.emoji}</span> {cart.restaurant.name}
          </Link>
          <ul className="mt-3 divide-y divide-border">
            {cart.lines.map((l) => (
              <li key={l.key} className="flex gap-3 py-3">
                <img src={`${l.imageUrl.split("?")[0]}?w=140&h=140&fit=crop`} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold leading-tight">{l.name}</p>
                    <p className="text-sm font-bold">{formatBRL(lineTotal({ basePrice: l.basePrice, optionDeltas: lineOptionDeltas(l), quantity: l.quantity }))}</p>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                    {[l.size?.name, ...l.addons.map((a) => a.name)].filter(Boolean).join(", ")}
                    {l.note && ` · “${l.note}”`}
                  </p>
                  <QuantityStepper className="mt-2" size="sm" allowRemove value={l.quantity} onChange={(q) => cart.setQuantity(l.key, q)} />
                </div>
              </li>
            ))}
          </ul>
          <Link to="/restaurante/$slug" params={{ slug: cart.restaurant.slug }} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary-deep">
            <Plus className="h-3.5 w-3.5" /> Adicionar mais itens
          </Link>
        </div>

        {/* Coupon */}
        <div className="flex items-center gap-3 rounded-[20px] bg-card p-4 shadow-soft">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary-deep"><TicketPercent className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            {coupon ? (
              <>
                <p className="text-sm font-bold">{coupon.code} · {couponRow && couponHeadline(couponRow)}</p>
                <p className={cn("text-xs", totals.couponError ? "text-destructive" : "text-primary-deep")}>
                  {totals.couponError ?? `Você economiza ${formatBRL(totals.discount)}`}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold">Selecionar cupom</p>
                <p className="text-xs text-muted-foreground">{availableCoupons.length} disponíveis para este pedido</p>
              </>
            )}
          </div>
          {coupon ? (
            <button type="button" aria-label="Remover cupom" onClick={() => cart.setCoupon(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <X className="h-4 w-4" />
            </button>
          ) : (
            <PillButton size="sm" variant="dark" onClick={() => setCouponOpen(true)}>Selecionar</PillButton>
          )}
        </div>

        {/* Payment */}
        <button type="button" onClick={() => setPayOpen(true)} className="flex w-full items-center gap-3 rounded-[20px] bg-card p-4 text-left shadow-soft">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary-deep"><PayIcon className="h-5 w-5" /></span>
          <span className="flex-1">
            <span className="block text-[11px] text-muted-foreground">Forma de pagamento</span>
            <span className="block text-sm font-bold">{PAYMENT_LABELS[cart.paymentMethod].title}</span>
            <span className="block text-xs text-muted-foreground">{PAYMENT_LABELS[cart.paymentMethod].subtitle}</span>
          </span>
          <span className="flex items-center text-xs font-semibold text-primary-deep">Alterar <ChevronRight className="h-4 w-4" /></span>
        </button>

        {/* Summary */}
        <div className="space-y-2 rounded-[20px] bg-card p-4 text-sm shadow-soft">
          <Row label="Subtotal" value={formatBRL(totals.subtotal)} />
          <Row label="Taxa de entrega" value={totals.deliveryFee === 0 ? "Grátis" : formatBRL(totals.deliveryFee)} highlight={totals.deliveryFee === 0} />
          {totals.discount > 0 && <Row label="Desconto" value={`− ${formatBRL(totals.discount)}`} highlight />}
          <div className="border-t border-dashed border-border pt-2">
            <Row label="Total" value={formatBRL(totals.total)} bold />
          </div>
        </div>
      </div>

      {/* Fixed footer */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-md items-center gap-4 rounded-t-[28px] bg-card px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4 shadow-float">
        <div>
          <p className="text-[11px] text-muted-foreground">Total</p>
          <p className="text-xl font-extrabold">{formatBRL(totals.total)}</p>
        </div>
        <PillButton className="flex-1" loading={placing} onClick={submit}>
          Fazer pedido
        </PillButton>
      </div>

      <AddressSheet userId={user.id} open={addrOpen} onOpenChange={setAddrOpen} returnTo="/cesta" />

      <BottomSheet open={couponOpen} onOpenChange={setCouponOpen} title="Cupons" description="Escolha um cupom ou digite o código.">
        <div className="space-y-3 px-5 pb-8 pt-2">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const code = manualCode.trim().toUpperCase();
              const found = (coupons.data ?? []).find((c) => c.code === code);
              if (!found) return toast.error("Cupom não encontrado.");
              cart.setCoupon(code);
              setManualCode("");
              setCouponOpen(false);
            }}
          >
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Código do cupom"
              aria-label="Código do cupom"
              className="h-11 flex-1 rounded-full bg-input px-4 text-sm uppercase outline-none focus:ring-1 focus:ring-primary"
            />
            <PillButton size="md" type="submit">Aplicar</PillButton>
          </form>
          {coupons.isLoading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
            : availableCoupons.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    cart.setCoupon(c.code);
                    setCouponOpen(false);
                  }}
                  className={cn("flex w-full items-center gap-3 rounded-2xl border p-3 text-left", cart.couponCode === c.code ? "border-primary bg-primary-soft" : "border-border")}
                >
                  <TicketPercent className="h-5 w-5 text-primary-deep" />
                  <span className="flex-1">
                    <span className="block text-sm font-bold">{couponHeadline(c)} · {c.code}</span>
                    <span className="block text-xs text-muted-foreground">{c.description}</span>
                  </span>
                </button>
              ))}
        </div>
      </BottomSheet>

      <BottomSheet open={payOpen} onOpenChange={setPayOpen} title="Forma de pagamento">
        <div className="space-y-2 px-5 pb-8 pt-2">
          {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((m) => {
            const Icon = PAYMENT_ICONS[m];
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  cart.setPayment(m);
                  setPayOpen(false);
                }}
                className={cn("flex w-full items-center gap-3 rounded-2xl border p-3 text-left", cart.paymentMethod === m ? "border-primary bg-primary-soft" : "border-border")}
              >
                <Icon className="h-5 w-5 text-primary-deep" />
                <span className="flex-1">
                  <span className="block text-sm font-bold">{PAYMENT_LABELS[m].title}</span>
                  <span className="block text-xs text-muted-foreground">{PAYMENT_LABELS[m].subtitle}</span>
                </span>
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </MobileShell>
  );
}

function Row({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn(bold ? "text-base font-bold" : "text-muted-foreground")}>{label}</span>
      <span className={cn(bold ? "text-base font-extrabold" : "font-semibold", highlight && "text-primary-deep")}>{value}</span>
    </div>
  );
}
