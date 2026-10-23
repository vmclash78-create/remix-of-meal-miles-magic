import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Star, TicketPercent } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Restaurant } from "@/lib/types";
import { formatBRL } from "@/lib/pricing";

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const fee = Number(restaurant.delivery_fee);
  return (
    <Link
      to="/restaurante/$slug"
      params={{ slug: restaurant.slug }}
      className="group block overflow-hidden rounded-[20px] bg-card shadow-soft transition-transform active:scale-[0.98]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={`${restaurant.cover_url.split("?")[0]}?w=500&q=70`}
          alt={restaurant.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {restaurant.discount_pct > 0 && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
            <TicketPercent className="h-3 w-3" /> {restaurant.discount_pct}% OFF
          </span>
        )}
        <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-card text-base shadow-soft">
          {restaurant.logo_emoji}
        </span>
      </div>
      <div className="space-y-1.5 p-3">
        <p className="line-clamp-2 text-sm font-bold leading-tight text-foreground">
          {restaurant.name}
          {restaurant.branch && <span className="font-medium text-muted-foreground"> · {restaurant.branch}</span>}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5 font-semibold text-foreground">
            <Star className="h-3 w-3 fill-rating text-rating" /> {Number(restaurant.rating).toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Clock className="h-3 w-3" /> {restaurant.eta_min} min
          </span>
          <span className="inline-flex items-center gap-0.5">
            <MapPin className="h-3 w-3" /> {Number(restaurant.distance_km).toFixed(1)} km
          </span>
        </div>
        <p className={fee === 0 ? "text-[11px] font-semibold text-success" : "text-[11px] font-semibold text-muted-foreground"}>
          {fee === 0 ? "Entrega grátis" : `Entrega ${formatBRL(fee)}`}
        </p>
      </div>
    </Link>
  );
}

export function RestaurantCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[20px] bg-card shadow-soft">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}
