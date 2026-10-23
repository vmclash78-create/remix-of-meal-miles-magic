import { cn } from "@/lib/utils";

interface MascotProps {
  className?: string;
  /** Carrega imediatamente (use só na primeira tela visível). */
  priority?: boolean;
  alt?: string;
  /** Brilho laranja suave atrás do mascote. */
  glow?: boolean;
}

/**
 * Mascote FoodUp: entregador na scooter laranja e preta. WebP com PNG de reserva.
 * Regra da marca: nunca abaixo de 80px de largura — para tamanhos pequenos use <LogoSymbol />.
 */
export function Mascot({ className, priority = false, alt = "Entregador FoodUp em uma scooter laranja e preta", glow = false }: MascotProps) {
  const img = (
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
        className={cn("h-auto min-w-20 select-none", !glow && className, glow && "relative w-full")}
        draggable={false}
      />
    </picture>
  );
  if (!glow) return img;
  return (
    <span className={cn("relative block", className)}>
      <span aria-hidden className="absolute inset-[12%] rounded-full bg-primary/35 blur-3xl" />
      {img}
    </span>
  );
}
