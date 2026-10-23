import { cn } from "@/lib/utils";
import { STATUS_FLOW, type OrderStatus } from "@/lib/simulation";

const DELIVERY_LABELS = ["Confirmado", "Preparando", "Coletado", "A caminho", "Entregue"];
const PICKUP_STEPS: OrderStatus[] = ["confirmed", "preparing", "picked_up", "delivered"];
const PICKUP_LABELS = ["Confirmado", "Preparando", "Pronto", "Retirado"];

interface OrderStepperProps {
  status: OrderStatus;
  mode: "delivery" | "pickup";
  /** 0..1 progress of the courier along the route, fills the "A caminho" segment. */
  progress?: number;
}

export function OrderStepper({ status, mode, progress = 0 }: OrderStepperProps) {
  const steps = mode === "pickup" ? PICKUP_STEPS : STATUS_FLOW;
  const labels = mode === "pickup" ? PICKUP_LABELS : DELIVERY_LABELS;
  const current = Math.max(0, steps.indexOf(status === "on_the_way" && mode === "pickup" ? "picked_up" : status));

  return (
    <div aria-label="Progresso do pedido">
      <div className="flex gap-1.5">
        {steps.map((s, i) => {
          let fill = 0;
          if (i < current) fill = 1;
          else if (i === current) fill = s === "on_the_way" ? Math.max(0.15, progress) : 1;
          return (
            <div key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
                style={{ width: `${fill * 100}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5">
        {labels.map((l, i) => (
          <span
            key={l}
            className={cn(
              "flex-1 text-center text-[10px] font-medium leading-tight",
              i <= current ? "font-bold text-foreground" : "text-muted-foreground",
            )}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
