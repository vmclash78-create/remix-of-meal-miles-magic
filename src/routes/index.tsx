import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LogoWordmark } from "@/components/foodup/Logo";
import { Mascot } from "@/components/foodup/Mascot";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FoodUp — Delivery do seu jeito" },
      { name: "description", content: "Delivery de comida com os melhores restaurantes da cidade e rastreamento ao vivo do seu pedido." },
      { property: "og:title", content: "FoodUp — Delivery do seu jeito" },
      { property: "og:description", content: "Delivery de comida com os melhores restaurantes da cidade e rastreamento ao vivo do seu pedido." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Splash,
});

const SPEED_LINES = [
  { top: "30%", width: "w-16", color: "bg-highlight", delay: "0ms" },
  { top: "46%", width: "w-24", color: "bg-primary", delay: "180ms" },
  { top: "62%", width: "w-12", color: "bg-primary", delay: "360ms" },
];

/** Splash sempre escura (#0F0F0F), independentemente do tema escolhido. */
function Splash() {
  const navigate = useNavigate();

  const go = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) navigate({ to: "/inicio", replace: true });
    else navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
  };

  useEffect(() => {
    const t = setTimeout(go, 2400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      type="button"
      onClick={go}
      className="flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-brand-black px-8 text-center"
      aria-label="Entrar no FoodUp"
    >
      <div className="relative w-full max-w-xs">
        <div className="absolute inset-x-8 bottom-0 h-6 rounded-[50%] bg-primary/25 blur-xl" />
        <div className="relative animate-ride-in">
          {SPEED_LINES.map((l) => (
            <span
              key={l.top}
              aria-hidden
              style={{ top: l.top, animationDelay: l.delay }}
              className={cn("absolute -left-10 h-2 origin-right rounded-full animate-speed-line", l.width, l.color)}
            />
          ))}
          <Mascot priority className="relative w-full" />
        </div>
      </div>
      <LogoWordmark theme="dark" className="mt-10 h-12 animate-fade-up [animation-delay:350ms]" />
      <p className="mt-3 animate-fade-up text-base font-medium text-brand-white/70 [animation-delay:500ms]">
        Delivery do seu jeito
      </p>
      <div className="mt-10 flex gap-1.5 animate-fade-up [animation-delay:700ms]">
        <span className="h-1.5 w-6 rounded-full bg-primary" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/50" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/30" />
      </div>
    </button>
  );
}
