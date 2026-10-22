import { cn } from "@/lib/utils";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("font-extrabold tracking-tight", light ? "text-primary-foreground" : "text-primary-deep", className)}>
      Food<span className={light ? "text-primary-soft" : "text-primary"}>ie</span>.
    </span>
  );
}
