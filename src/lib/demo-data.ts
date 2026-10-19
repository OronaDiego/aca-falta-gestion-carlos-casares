import { CATEGORIAS, MAPA } from '@/config/ciudad';
import { nearestPlace } from './geo-utils';
import type { Report, ReportCategory } from '@/types/report';

/**
 * Datos de EJEMPLO para el modo demo (cuando no hay Firebase configurado).
 * Son inventados: nunca se suben a la base real.
 */

export function placeholderPhoto(label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300"><rect width="480" height="300" fill="#2a2a2a"/><path d="M0 230 L120 150 L210 210 L320 120 L480 230 V300 H0Z" fill="#3a3a3a"/><circle cx="380" cy="80" r="34" fill="#4a4a4a"/><text x="240" y="282" fill="#9a9a9a" font-family="sans-serif" font-size="18" text-anchor="middle">Foto de ejemplo · ${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// Generador pseudoaleatorio determinístico (mismas posiciones en cada carga)
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/** Foto de ejemplo para un reclamo demo (se genera, no se guarda). */
export function demoPhoto(category: ReportCategory): string {
  return placeholderPhoto(CATEGORIAS[category]?.name ?? 'Reclamo');
}

const CALLES = ['San Martín', 'Mitre', 'Rivadavia', 'Belgrano', 'Moreno', 'Sarmiento', 'Alsina', 'Av. Almirante Brown', 'Maya', 'Ruta 5'];

export function buildDemoReports(): Report[] {
  const rand = rng(42);
  const cats = Object.keys(CATEGORIAS) as ReportCategory[];
  const now = Date.now();
  const list: Report[] = [];

  for (let i = 0; i < 36; i++) {
    // Más densidad en el casco urbano, algunos dispersos
    const spread = i < 28 ? 0.012 : 0.03;
    const lat = MAPA.centro.lat + (rand() - 0.5) * spread * 2;
    const lng = MAPA.centro.lng + (rand() - 0.5) * spread * 2.4;
    const category = i < 10 ? 'calles' : cats[Math.floor(rand() * cats.length)];
    const place = nearestPlace(lat, lng);
    const daysAgo = Math.floor(rand() * 120);
    list.push({
      id: `demo_${i}`,
      created_at: new Date(now - daysAgo * 86_400_000).toISOString(),
      description: `Reclamo de ejemplo: ${CATEGORIAS[category].description.toLowerCase()}`,
      category,
      sector: place.nombre,
      is_rural: place.rural,
      address: `${CALLES[Math.floor(rand() * CALLES.length)]} ${100 + Math.floor(rand() * 900)}`,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      previously_reported: rand() > 0.5,
      status: 'pendiente',
      support_count: Math.floor(rand() * 12),
      is_hidden: false,
    });
  }
  return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
}
