import { Check, TicketPercent, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Coupon } from "@/lib/types";
import { formatBRL } from "@/lib/pricing";

interface CouponCardProps {
  coupon: Coupon;
  restaurantName?: string | null;
  applied?: boolean;
  onApply?: (code: string) => void;
  variant?: "dark" | "light";
  className?: string;
}

export function couponHeadline(c: Coupon) {
  if (c.discount_type === "percent") return `${Number(c.value)}% OFF`;
  if (c.discount_type === "fixed") return `${formatBRL(Number(c.value))} OFF`;
  return "FRETE GRÁTIS";
}

export function CouponCard({ coupon, restaurantName, applied, onApply, variant = "dark", className }: CouponCardProps) {
  const Icon = coupon.discount_type === "free_delivery" ? Truck : TicketPercent;
  const dark = variant === "dark";
  return (
    <div
      className={cn(
        "relative flex min-w-[240px] flex-col justify-between overflow-hidden rounded-[20px] p-4",
        dark ? "bg-gradient-header text-primary-foreground" : "bg-card text-foreground shadow-soft",
        className,
      )}
    >
      <Icon className={cn("absolute -right-3 -top-3 h-20 w-20 rotate-12", dark ? "opacity-15" : "text-primary opacity-15")} />
      <div>
        <p className={cn("text-[10px] font-semibold uppercase tracking-wider", dark ? "opacity-80" : "text-muted-foreground")}>
          {restaurantName ?? "Todo o app"}
        </p>
        <p className="mt-0.5 text-2xl font-extrabold leading-tight">{couponHeadline(coupon)}</p>
        <p className={cn("mt-1 text-xs", dark ? "opacity-85" : "text-muted-foreground")}>{coupon.description}</p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className={cn(
            "rounded-lg border border-dashed px-2 py-1 text-xs font-bold tracking-wider",
            dark ? "border-primary-foreground/50" : "border-primary text-primary-deep",
          )}
        >
          {coupon.code}
        </span>
        {onApply && (
          <button
            type="button"
            onClick={() => onApply(coupon.code)}
            disabled={applied}
            className={cn(
              "inline-flex h-8 items-center gap-1 rounded-full px-3.5 text-xs font-bold transition active:scale-95",
              dark ? "bg-card text-primary-deep" : "bg-primary text-primary-foreground",
              applied && "opacity-80",
            )}
          >
            {applied ? (
              <>
                <Check className="h-3.5 w-3.5" /> Resgatado
              </>
            ) : (
              "Resgatar"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
