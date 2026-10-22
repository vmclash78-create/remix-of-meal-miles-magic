import type { LatLng } from "@/lib/geo";

export interface TrackingMapProps {
  route: LatLng[];
  progress: number;
  restaurant: LatLng;
  destination: LatLng;
  showCourier: boolean;
  restaurantEmoji?: string;
  className?: string;
}

export interface LocationPickerProps {
  initialCenter: LatLng;
  /** When this changes, the map flies to it. */
  target: LatLng | null;
  onCenterChange: (center: LatLng) => void;
  className?: string;
}

export interface MiniMapProps {
  center: LatLng;
  className?: string;
}
