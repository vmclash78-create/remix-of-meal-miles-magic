import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Logo } from "@/components/foodup/Logo";
import { Mascot } from "@/components/foodup/Mascot";
import { supabase } from "@/integrations/supabase/client";

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

function Splash() {
  const navigate = useNavigate();

  const go = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) navigate({ to: "/inicio", replace: true });
    else navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
  };

  useEffect(() => {
    const t = setTimeout(go, 2200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      type="button"
      onClick={go}
      className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-8 text-center"
      aria-label="Entrar no FoodUp"
    >
      <div className="relative w-full max-w-xs">
        <div className="absolute inset-x-8 bottom-0 h-6 rounded-[50%] bg-primary/20 blur-xl" />
        <Mascot priority className="relative w-full animate-ride-in" />
      </div>
      <Logo className="mt-10 h-14 animate-fade-up [animation-delay:250ms]" />
      <p className="mt-3 animate-fade-up text-base font-medium text-muted-foreground [animation-delay:400ms]">
        Delivery do seu jeito
      </p>
      <div className="mt-10 flex gap-1.5 animate-fade-up [animation-delay:600ms]">
        <span className="h-1.5 w-6 rounded-full bg-primary" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/50" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/30" />
      </div>
    </button>
  );
}
