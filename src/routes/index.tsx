import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import courierImg from "@/assets/courier-scooter.png";
import { Logo } from "@/components/foodie/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Foodie — Comida deliciosa, entregue rápido" },
      { name: "description", content: "Delivery de comida com os melhores restaurantes da cidade e rastreamento ao vivo do seu pedido." },
      { property: "og:title", content: "Foodie — Comida deliciosa, entregue rápido" },
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
      aria-label="Entrar no Foodie"
    >
      <div className="relative">
        <div className="absolute inset-x-6 bottom-2 top-10 rounded-full bg-primary-soft" />
        <img
          src={courierImg}
          alt="Entregador do Foodie em uma moto verde"
          width={1024}
          height={1024}
          className="relative w-64 animate-ride-in"
        />
      </div>
      <Logo className="mt-8 animate-fade-up text-5xl [animation-delay:250ms]" />
      <p className="mt-2 animate-fade-up text-sm text-muted-foreground [animation-delay:400ms]">
        Comida deliciosa, entregue rápido
      </p>
      <div className="mt-10 flex gap-1.5 animate-fade-up [animation-delay:600ms]">
        <span className="h-1.5 w-6 rounded-full bg-primary" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/50" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/30" />
      </div>
    </button>
  );
}
