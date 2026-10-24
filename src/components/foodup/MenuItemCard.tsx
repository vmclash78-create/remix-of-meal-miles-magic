import { Clock, Flame, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { MenuItem } from "@/lib/types";
import { formatBRL } from "@/lib/pricing";

interface MenuItemCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group flex flex-col rounded-[20px] bg-card p-3 text-left shadow-soft transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-float active:translate-y-0 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none motion-reduce:transition-none"
    >
      <p className="line-clamp-1 text-center text-sm font-bold text-foreground">{item.name}</p>
      <p className="text-center text-xs font-semibold text-primary-deep">{formatBRL(Number(item.price))}</p>
      <div className="my-2 aspect-square overflow-hidden rounded-2xl">
        <img
          src={`${item.image_url.split("?")[0]}?w=360&h=360&fit=crop&q=70`}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
        />
      </div>
      <div className="mt-auto flex items-end justify-between">
        <div className="space-y-0.5 text-[11px] text-muted-foreground">
          <p className="inline-flex items-center gap-1">
            <Flame className="h-3 w-3 text-primary" /> {item.kcal} kcal
          </p>
          <p className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {item.prep_min} min
          </p>
        </div>
        <span
          aria-label={`Adicionar ${item.name}`}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition-transform duration-200 group-hover:scale-110 motion-reduce:transform-none motion-reduce:transition-none"
        >
          <Plus className="h-4 w-4" />
        </span>
      </div>
    </button>
  );
}

export function MenuItemCardSkeleton() {
  return (
    <div className="space-y-2 rounded-[20px] bg-card p-3 shadow-soft">
      <Skeleton className="mx-auto h-4 w-2/3" />
      <Skeleton className="mx-auto h-3 w-1/3" />
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
