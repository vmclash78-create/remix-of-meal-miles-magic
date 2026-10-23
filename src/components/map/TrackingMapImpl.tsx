import { useEffect, useRef } from "react";
import { Crosshair } from "lucide-react";
import { splitRoute, type LatLng } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { L, addTiles, courierIcon, pinIcon, restaurantIcon } from "./leaflet-helpers";
import type { TrackingMapProps } from "./types";

const ANIMATION_MS = 2400;

export default function TrackingMapImpl({
  route,
  progress,
  restaurant,
  destination,
  showCourier,
  restaurantEmoji = "🍽️",
  className,
}: TrackingMapProps) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const traveledRef = useRef<L.Polyline | null>(null);
  const remainingRef = useRef<L.Polyline | null>(null);
  const courierRef = useRef<L.Marker | null>(null);
  const shownProgress = useRef(progress);
  const frame = useRef<number | null>(null);
  const routeRef = useRef<LatLng[]>(route);
  routeRef.current = route.length ? route : [restaurant, destination];

  const fit = () => {
    const map = mapRef.current;
    if (!map) return;
    const pts = [...routeRef.current, restaurant, destination];
    map.fitBounds(L.latLngBounds(pts.map((p) => L.latLng(p[0], p[1]))), {
      paddingTopLeft: [40, 80],
      paddingBottomRight: [40, 40],
      maxZoom: 16,
    });
  };

  const draw = (p: number) => {
    const { traveled, remaining, point } = splitRoute(routeRef.current, p);
    traveledRef.current?.setLatLngs(traveled);
    remainingRef.current?.setLatLngs(remaining);
    courierRef.current?.setLatLng(point);
  };

  useEffect(() => {
    if (!el.current) return;
    const map = L.map(el.current, { zoomControl: false, attributionControl: true });
    mapRef.current = map;
    addTiles(map);
    remainingRef.current = L.polyline([], { className: "foodup-route", weight: 6, opacity: 0.95, lineCap: "round" }).addTo(map);
    traveledRef.current = L.polyline([], {
      className: "foodup-route-bg",
      weight: 6,
      opacity: 0.35,
      dashArray: "2 10",
      lineCap: "round",
    }).addTo(map);
    L.marker(restaurant, { icon: restaurantIcon(restaurantEmoji) }).addTo(map);
    L.marker(destination, { icon: pinIcon() }).addTo(map);
    if (showCourier) {
      courierRef.current = L.marker(restaurant, { icon: courierIcon("/brand/mascot-courier-sm.webp"), zIndexOffset: 1000 }).addTo(map);
    }
    draw(shownProgress.current);
    fit();
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      map.remove();
      mapRef.current = null;
    };
    // map is created once per mount; later prop changes are animated below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const from = shownProgress.current;
    const to = progress;
    if (Math.abs(to - from) < 0.0001) {
      draw(to);
      return;
    }
    const start = performance.now();
    if (frame.current) cancelAnimationFrame(frame.current);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ANIMATION_MS);
      const p = from + (to - from) * t;
      shownProgress.current = p;
      draw(p);
      if (t < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  return (
    <div className={cn("relative", className)}>
      <div ref={el} className="h-full w-full" />
      <button
        type="button"
        onClick={fit}
        aria-label="Centralizar mapa"
        className="absolute right-4 top-20 z-[500] flex h-10 w-10 items-center justify-center rounded-full bg-card text-primary-deep shadow-soft"
      >
        <Crosshair className="h-5 w-5" />
      </button>
    </div>
  );
}
