import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LocationPickerProps, MiniMapProps, TrackingMapProps } from "./types";

// Leaflet touches `window` at import time, so the map modules load only in the browser.
const TrackingMapImpl = lazy(() => import("./TrackingMapImpl"));
const LocationPickerImpl = lazy(() => import("./LocationPickerImpl"));
const MiniMapImpl = lazy(() => import("./MiniMapImpl"));

const Fallback = ({ className }: { className?: string }) => (
  <Skeleton className={cn("h-full w-full rounded-none", className)} />
);

export function TrackingMap(props: TrackingMapProps) {
  return (
    <ClientOnly fallback={<Fallback className={props.className} />}>
      <Suspense fallback={<Fallback className={props.className} />}>
        <TrackingMapImpl {...props} />
      </Suspense>
    </ClientOnly>
  );
}

export function LocationPicker(props: LocationPickerProps) {
  return (
    <ClientOnly fallback={<Fallback className={props.className} />}>
      <Suspense fallback={<Fallback className={props.className} />}>
        <LocationPickerImpl {...props} />
      </Suspense>
    </ClientOnly>
  );
}

export function MiniMap(props: MiniMapProps) {
  return (
    <ClientOnly fallback={<Fallback className={props.className} />}>
      <Suspense fallback={<Fallback className={props.className} />}>
        <MiniMapImpl {...props} />
      </Suspense>
    </ClientOnly>
  );
}
