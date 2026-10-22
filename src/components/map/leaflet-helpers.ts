import L from "leaflet";
import "leaflet/dist/leaflet.css";

export const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function addTiles(map: L.Map) {
  L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);
}

export const pinIcon = () =>
  L.divIcon({
    className: "foodie-marker",
    iconSize: [36, 44],
    iconAnchor: [18, 42],
    html: `<svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,.25))">
      <path d="M18 43C18 43 33 27.5 33 17C33 8.7 26.3 2 18 2C9.7 2 3 8.7 3 17C3 27.5 18 43 18 43Z" style="fill: var(--destructive)"/>
      <circle cx="18" cy="17" r="6" style="fill: var(--card)"/></svg>`,
  });

export const restaurantIcon = (emoji: string) =>
  L.divIcon({
    className: "foodie-marker",
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    html: `<div style="width:42px;height:42px;border-radius:9999px;background:var(--card);border:3px solid var(--primary);display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 10px rgba(0,0,0,.2)">${emoji}</div>`,
  });

export const courierIcon = (imgUrl: string) =>
  L.divIcon({
    className: "foodie-marker",
    iconSize: [56, 56],
    iconAnchor: [28, 40],
    html: `<div style="width:56px;height:56px;border-radius:9999px;background:var(--primary-soft);border:3px solid var(--card);box-shadow:0 6px 16px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;overflow:hidden"><img src="${imgUrl}" alt="" style="width:48px;height:48px;object-fit:contain"/></div>`,
  });

export { L };
