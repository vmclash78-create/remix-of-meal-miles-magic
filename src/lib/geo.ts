export type LatLng = [number, number];

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function routeLengthKm(route: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < route.length; i++) total += haversineKm(route[i - 1], route[i]);
  return total;
}

/** Point located at `progress` (0..1) of the route's total length. */
export function pointAlong(route: LatLng[], progress: number): LatLng {
  if (route.length === 0) return [0, 0];
  if (route.length === 1 || progress <= 0) return route[0];
  if (progress >= 1) return route[route.length - 1];
  const target = routeLengthKm(route) * progress;
  let acc = 0;
  for (let i = 1; i < route.length; i++) {
    const seg = haversineKm(route[i - 1], route[i]);
    if (acc + seg >= target) {
      const t = seg === 0 ? 0 : (target - acc) / seg;
      return [
        route[i - 1][0] + (route[i][0] - route[i - 1][0]) * t,
        route[i - 1][1] + (route[i][1] - route[i - 1][1]) * t,
      ];
    }
    acc += seg;
  }
  return route[route.length - 1];
}

/** Simple street-like fallback route when no routing service is available. */
export function fallbackRoute(from: LatLng, to: LatLng): LatLng[] {
  const mid1: LatLng = [from[0] + (to[0] - from[0]) * 0.35, from[1]];
  const mid2: LatLng = [mid1[0], from[1] + (to[1] - from[1]) * 0.7];
  const mid3: LatLng = [to[0], mid2[1]];
  return [from, mid1, mid2, mid3, to];
}
