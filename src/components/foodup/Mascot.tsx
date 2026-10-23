import { cn } from "@/lib/utils";

interface MascotProps {
  className?: string;
  /** Carrega imediatamente (use só na primeira tela visível). */
  priority?: boolean;
  alt?: string;
}

/** Mascote FoodUp: entregador na scooter laranja e preta. WebP com PNG de reserva. */
export function Mascot({ className, priority = false, alt = "Entregador FoodUp em uma scooter laranja e preta" }: MascotProps) {
  return (
    <picture className="contents">
      <source srcSet="/brand/mascot-courier.webp" type="image/webp" />
      <img
        src="/brand/mascot-courier.png"
        alt={alt}
        width={1200}
        height={829}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className={cn("h-auto select-none", className)}
        draggable={false}
      />
    </picture>
  );
}
