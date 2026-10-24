import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

/** Alterna entre tema escuro (padrão) e claro. Pensado para ficar sobre os headers escuros. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/5 text-foreground transition-colors active:scale-95 dark:bg-brand-white/10 dark:text-brand-white",
        className,
      )}
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
