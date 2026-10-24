import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Receipt, Search, ShoppingBag, User } from "lucide-react";
import { useCartCount } from "@/stores/cart";

export const NAV_ITEMS = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/busca", label: "Busca", icon: Search },
  { to: "/pedidos", label: "Pedidos", icon: Receipt },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  const count = useCartCount();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <>
      {count > 0 && pathname !== "/cesta" && (
        <Link
          to="/cesta"
          aria-label={`Ver cesta, ${count} ${count === 1 ? "item" : "itens"}`}
          className="animate-fade-up fixed bottom-[calc(env(safe-area-inset-bottom)+76px)] left-1/2 z-40 flex w-[calc(min(100vw,28rem)-40px)] -translate-x-1/2 items-center justify-between rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-soft transition-[transform,box-shadow] duration-200 hover:shadow-float active:scale-[0.98] motion-reduce:transition-none"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" /> Ver cesta
          </span>
          <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs">
            {count > 99 ? "99+" : count} {count === 1 ? "item" : "itens"}
          </span>
        </Link>
      )}
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="grid grid-cols-4">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className="group relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors data-[status=active]:text-primary"
              >
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary opacity-0 transition-opacity group-data-[status=active]:opacity-100" />
                <span className="relative flex h-9 w-12 items-center justify-center rounded-full transition-colors group-data-[status=active]:bg-primary-soft">
                  <Icon
                    className="h-5 w-5 group-data-[status=active]:animate-pop-in motion-reduce:animate-none"
                    strokeWidth={2}
                  />
                </span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
