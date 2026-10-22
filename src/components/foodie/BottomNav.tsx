import { Link } from "@tanstack/react-router";
import { Heart, Home, ShoppingBag, TicketPercent, User } from "lucide-react";
import { useCartCount } from "@/stores/cart";

const items = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/salvos", label: "Salvos", icon: Heart },
  { to: "/cesta", label: "Cesta", icon: ShoppingBag },
  { to: "/ofertas", label: "Ofertas", icon: TicketPercent },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  const count = useCartCount();
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="group relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors data-[status=active]:text-primary-deep"
            >
              <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary opacity-0 transition-opacity group-data-[status=active]:opacity-100" />
              <span className="relative flex h-9 w-12 items-center justify-center rounded-full transition-colors group-data-[status=active]:bg-primary-soft">
                <Icon className="h-5 w-5" strokeWidth={2} />
                {to === "/cesta" && count > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary-deep px-1 text-[10px] font-bold text-primary-foreground">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
