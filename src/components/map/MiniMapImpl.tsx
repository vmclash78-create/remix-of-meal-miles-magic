import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { L, addTiles, pinIcon } from "./leaflet-helpers";
import type { MiniMapProps } from "./types";

export default function MiniMapImpl({ center, className }: MiniMapProps) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!el.current) return;
    const map = L.map(el.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
    }).setView(center, 16);
    addTiles(map);
    markerRef.current = L.marker(center, { icon: pinIcon() }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mapRef.current?.setView(center, 16);
    markerRef.current?.setLatLng(center);
  }, [center]);

  return <div ref={el} className={cn("pointer-events-none", className)} />;
}
