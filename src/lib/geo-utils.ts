import { LIMITES_PARTIDO, LUGARES } from '@/config/ciudad';
import type { Report, ReportCategory } from '@/types/report';

/** Distancia en metros entre dos coordenadas (fórmula de Haversine). */
export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/** ¿El punto está dentro del rectángulo del partido? (misma regla que firestore.rules) */
export function isWithinPartido(lat: number, lng: number): boolean {
  const [sw, ne] = LIMITES_PARTIDO;
  return lat >= sw[0] && lat <= ne[0] && lng >= sw[1] && lng <= ne[1];
}

/** Barrio o localidad de referencia más cercana al punto. */
export function nearestPlace(lat: number, lng: number): { nombre: string; rural: boolean } {
  let best = LUGARES[0];
  let bestDist = Infinity;
  for (const lugar of LUGARES) {
    const d = distanceMeters(lat, lng, lugar.lat, lugar.lng);
    if (d < bestDist) {
      bestDist = d;
      best = lugar;
    }
  }
  return { nombre: best.nombre, rural: best.rural };
}

/** Busca un reclamo abierto de la misma categoría a menos de `thresholdMeters`. */
export function findNearbyDuplicate(
  lat: number,
  lng: number,
  category: ReportCategory,
  reports: Report[],
  thresholdMeters = 35
): { report: Report; distance: number } | null {
  for (const r of reports) {
    if (r.category !== category || r.status === 'resuelto') continue;
    const d = distanceMeters(lat, lng, r.latitude, r.longitude);
    if (d <= thresholdMeters) return { report: r, distance: d };
  }
  return null;
}

/** Días corridos completos entre dos fechas ISO (o hasta hoy). */
export function daysElapsed(fromIso: string, toIso?: string): number {
  const from = new Date(fromIso).getTime();
  const to = toIso ? new Date(toIso).getTime() : Date.now();
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.max(0, Math.floor((to - from) / 86_400_000));
}

export function formatAgo(fromIso: string): string {
  const d = daysElapsed(fromIso);
  if (d === 0) return 'Hoy';
  if (d === 1) return 'Hace 1 día';
  return `Hace ${d} días`;
}

/** Días que faltan hasta una fecha (redondeo hacia arriba, mínimo 0). */
export function daysUntil(targetIso: string, now: number = Date.now()): number {
  const t = new Date(targetIso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.ceil((t - now) / 86_400_000));
}
