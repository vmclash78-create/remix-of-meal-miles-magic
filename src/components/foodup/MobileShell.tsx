import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useCartCount } from "@/stores/cart";
import { BottomNav } from "./BottomNav";

interface MobileShellProps {
  children: ReactNode;
  withNav?: boolean;
  className?: string;
}

/** Phone-width column used by every screen; optionally shows the bottom nav (and the floating basket button). */
export function MobileShell({ children, withNav = false, className }: MobileShellProps) {
  const count = useCartCount();
  return (
    <div className="min-h-screen bg-muted/60">
      <div
        className={cn(
          "relative mx-auto min-h-screen w-full max-w-md bg-background shadow-soft",
          withNav && (count > 0 ? "pb-40" : "pb-24"),
          className,
        )}
      >
        <div className="animate-page-in">{children}</div>
        {withNav && <BottomNav />}
      </div>
    </div>
  );
}
