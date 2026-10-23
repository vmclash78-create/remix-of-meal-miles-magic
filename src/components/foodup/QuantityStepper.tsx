import { Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  allowRemove?: boolean;
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 50,
  size = "md",
  allowRemove = false,
  className,
}: QuantityStepperProps) {
  const btn = size === "sm" ? "h-7 w-7" : "h-10 w-10";
  const showTrash = allowRemove && value <= 1;
  return (
    <div className={cn("inline-flex items-center rounded-full bg-muted p-0.5", className)}>
      <button
        type="button"
        aria-label={showTrash ? "Remover item" : "Diminuir quantidade"}
        onClick={() => onChange(value - 1)}
        disabled={!allowRemove && value <= min}
        className={cn(btn, "flex items-center justify-center rounded-full text-foreground transition hover:bg-card disabled:opacity-40")}
      >
        {showTrash ? <Trash2 className="h-3.5 w-3.5 text-destructive" /> : <Minus className="h-4 w-4" />}
      </button>
      <span className={cn("min-w-7 text-center font-semibold tabular-nums", size === "sm" ? "text-sm" : "text-base")}>
        {value}
      </span>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        className={cn(btn, "flex items-center justify-center rounded-full text-foreground transition hover:bg-card disabled:opacity-40")}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
