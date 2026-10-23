import type { ReactNode } from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  hideHeader?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Draggable bottom sheet with slide/fade animation. */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  hideHeader,
  children,
  footer,
  className,
}: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px]" />
        <Drawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92vh] w-full max-w-md flex-col rounded-t-[28px] bg-card outline-none",
            className,
          )}
        >
          <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-border" />
          <div className={cn(hideHeader ? "sr-only" : "px-5 pb-2 pt-4")}>
            <Drawer.Title className="text-lg font-bold text-foreground">{title}</Drawer.Title>
            {description ? (
              <Drawer.Description className="mt-0.5 text-sm text-muted-foreground">
                {description}
              </Drawer.Description>
            ) : (
              <Drawer.Description className="sr-only">{title}</Drawer.Description>
            )}
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
          {footer && (
            <div className="border-t border-border bg-card px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3">
              {footer}
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
