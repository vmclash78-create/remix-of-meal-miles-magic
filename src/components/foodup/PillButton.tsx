import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "soft" | "outline" | "dark";
  size?: "md" | "lg" | "sm";
}

/** Botão da marca: laranja sólido, texto branco, cantos 12px. */
export const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ className, loading, variant = "primary", size = "lg", disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60",
        size === "lg" && "h-13 px-6 text-[15px]",
        size === "md" && "h-11 px-5 text-sm",
        size === "sm" && "h-8 px-3.5 text-xs",
        variant === "primary" && "bg-primary text-primary-foreground shadow-soft",
        variant === "soft" && "bg-primary-soft text-primary-deep",
        variant === "outline" && "border border-border bg-card text-foreground",
        variant === "dark" && "bg-primary-deep text-primary-foreground",
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  ),
);
PillButton.displayName = "PillButton";
