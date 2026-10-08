import { CIUDAD, LIMITES_PARTIDO } from '@/config/ciudad';

/**
 * Geocodificación con Nominatim (OpenStreetMap). Gratis y sin clave, con límite de
 * 1 pedido por segundo: se usa solo cuando el vecino busca o marca un punto.
 * https://operations.osmfoundation.org/policies/nominatim/
 */
const BASE = 'https://nominatim.openstreetmap.org';

export interface GeoResult {
  label: string;
  lat: number;
  lng: number;
}

const viewbox = () => {
  const [sw, ne] = LIMITES_PARTIDO;
  return `${sw[1]},${ne[0]},${ne[1]},${sw[0]}`; // izq, arriba, der, abajo
};

function shortAddress(a: Record<string, string> | undefined, fallback: string): string {
  if (!a) return fallback;
  const street = a.road || a.pedestrian || a.path || a.neighbourhood || a.suburb;
  const parts = [street && a.house_number ? `${street} ${a.house_number}` : street, a.village || a.town || a.city]
    .filter(Boolean);
  return parts.length ? parts.join(', ') : fallback;
}

export async function searchAddress(text: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const q = text.toLowerCase().includes(CIUDAD.nombre.toLowerCase()) ? text : `${text}, ${CIUDAD.nombre}`;
  const url = `${BASE}/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=ar&bounded=1&viewbox=${viewbox()}&q=${encodeURIComponent(
    q
  )}`;
  const res = await fetch(url, { signal, headers: { 'Accept-Language': 'es' } });
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string; address?: Record<string, string> }>;
  return data.map((d) => ({
    label: shortAddress(d.address, d.display_name.split(',').slice(0, 2).join(',')),
    lat: Number(d.lat),
    lng: Number(d.lon),
  }));
}

export async function reverseGeocode(lat: number, lng: number, signal?: AbortSignal): Promise<string> {
  try {
    const url = `${BASE}/reverse?format=jsonv2&zoom=18&addressdetails=1&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { signal, headers: { 'Accept-Language': 'es' } });
    if (!res.ok) return '';
    const d = (await res.json()) as { display_name?: string; address?: Record<string, string> };
    return shortAddress(d.address, d.display_name?.split(',').slice(0, 2).join(',') || '');
  } catch {
    return '';
  }
}
