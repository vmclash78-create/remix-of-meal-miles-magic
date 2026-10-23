import type { ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ErrorState({
  title = "Algo deu errado",
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-14 text-center", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-7 w-7 text-destructive" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        {message && <p className="mt-1 text-sm text-muted-foreground">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" className="rounded-full" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 px-6 py-14 text-center", className)}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft text-primary-deep">
        {icon}
      </div>
      <div>
        <p className="text-base font-bold text-foreground">{title}</p>
        {message && <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">{message}</p>}
      </div>
      {action}
    </div>
  );
}
