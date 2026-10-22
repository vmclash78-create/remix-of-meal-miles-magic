import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { L, addTiles } from "./leaflet-helpers";
import type { LocationPickerProps } from "./types";

export default function LocationPickerImpl({ initialCenter, target, onCenterChange, className }: LocationPickerProps) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const cb = useRef(onCenterChange);
  cb.current = onCenterChange;

  useEffect(() => {
    if (!el.current) return;
    const map = L.map(el.current, { zoomControl: false }).setView(initialCenter, 17);
    mapRef.current = map;
    addTiles(map);
    map.on("moveend", () => {
      const c = map.getCenter();
      cb.current([c.lat, c.lng]);
    });
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (target && mapRef.current) mapRef.current.flyTo(target, 17, { duration: 0.8 });
  }, [target]);

  return (
    <div className={cn("relative", className)}>
      <div ref={el} className="h-full w-full" />
      {/* Fixed center pin */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-[500] -translate-x-1/2 -translate-y-full">
        <svg width="44" height="54" viewBox="0 0 36 44" className="drop-shadow-lg">
          <path
            d="M18 43C18 43 33 27.5 33 17C33 8.7 26.3 2 18 2C9.7 2 3 8.7 3 17C3 27.5 18 43 18 43Z"
            className="fill-destructive"
          />
          <circle cx="18" cy="17" r="6" className="fill-card" />
        </svg>
      </div>
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-[499] h-2 w-5 -translate-x-1/2 rounded-full bg-foreground/25 blur-[2px]" />
    </div>
  );
}
