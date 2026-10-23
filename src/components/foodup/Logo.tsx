import { cn } from "@/lib/utils";

type LogoVariant = "horizontal" | "symbol" | "wordmark";
type LogoTheme = "dark" | "light";

interface LogoProps {
  variant?: LogoVariant;
  /** "dark" = sobre fundo escuro ("Food" em branco); "light" = sobre fundo claro. Sem valor, segue o tema do app. */
  theme?: LogoTheme;
  className?: string;
}

/** Cloche laranja com linhas de velocidade. */
export function LogoSymbol({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-full w-auto shrink-0", className)} aria-hidden="true">
      <rect x="2" y="26" width="12" height="4.5" rx="2.25" className="fill-highlight" />
      <rect x="0" y="34" width="14" height="4.5" rx="2.25" className="fill-primary" />
      <rect x="5" y="42" width="7" height="4.5" rx="2.25" className="fill-primary" />
      <circle cx="37" cy="18.5" r="4" className="fill-primary" />
      <path d="M18 40a19 19 0 0 1 38 0z" className="fill-primary" />
      <path d="M25 33.5a12.5 12.5 0 0 1 7.5-8" className="stroke-highlight" strokeWidth="3" strokeLinecap="round" fill="none" />
      <rect x="14" y="42" width="46" height="5.5" rx="2.75" className="fill-primary" />
    </svg>
  );
}

/** "Food" + "Up" com seta para cima saindo do "U". Letras desenhadas em traço, sem depender de fonte. */
export function LogoWordmark({ theme, className }: { theme?: LogoTheme; className?: string }) {
  const ink = theme === "dark" ? "stroke-brand-white" : theme === "light" ? "stroke-brand-black" : "stroke-foreground";
  return (
    <svg
      viewBox="0 0 240 76"
      className={cn("h-full w-auto shrink-0", className)}
      fill="none"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <g className={ink}>
        <path d="M8 54V22h22M8 38h18" />
        <circle cx="56" cy="42" r="12" />
        <circle cx="94" cy="42" r="12" />
        <circle cx="132" cy="42" r="12" />
        <path d="M144 22v32" />
      </g>
      <g className="stroke-primary">
        <path d="M164 22v20a12 12 0 0 0 24 0V6" />
        <path d="M178 16l10-10 10 10" />
        <path d="M208 30v40" />
        <circle cx="220" cy="42" r="12" />
      </g>
    </svg>
  );
}

export function Logo({ variant = "horizontal", theme, className }: LogoProps) {
  return (
    <span role="img" aria-label="FoodUp" className={cn("inline-flex h-8 items-center gap-2", className)}>
      {variant !== "wordmark" && <LogoSymbol />}
      {variant !== "symbol" && <LogoWordmark theme={theme} className={variant === "horizontal" ? "h-[78%]" : undefined} />}
    </span>
  );
}
