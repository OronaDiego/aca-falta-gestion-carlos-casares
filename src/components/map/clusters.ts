import type { Report, ReportCategory } from '@/types/report';

export interface Cluster {
  reports: Report[];
  lat: number;
  lng: number;
  /** Categoría con más reclamos dentro del grupo (define el ícono). */
  category: ReportCategory;
}

/**
 * Agrupa reclamos cercanos en pantalla con una grilla de `cellPx` píxeles.
 * `project` convierte lat/lng a píxeles del mapa en el zoom actual.
 * Es simple y alcanza de sobra para miles de puntos.
 */
export function clusterReports(
  reports: Report[],
  project: (lat: number, lng: number) => { x: number; y: number },
  cellPx = 56
): Cluster[] {
  const cells = new Map<string, Report[]>();
  for (const r of reports) {
    const p = project(r.latitude, r.longitude);
    const key = `${Math.floor(p.x / cellPx)}:${Math.floor(p.y / cellPx)}`;
    const list = cells.get(key);
    if (list) list.push(r);
    else cells.set(key, [r]);
  }

  const clusters: Cluster[] = [];
  for (const list of cells.values()) {
    let lat = 0;
    let lng = 0;
    const counts = new Map<ReportCategory, number>();
    for (const r of list) {
      lat += r.latitude;
      lng += r.longitude;
      counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
    }
    let category: ReportCategory = list[0].category;
    let max = 0;
    for (const [c, n] of counts) {
      if (n > max) {
        max = n;
        category = c;
      }
    }
    clusters.push({ reports: list, lat: lat / list.length, lng: lng / list.length, category });
  }
  return clusters;
}

/** Color del rombo según cuántos reclamos agrupa. */
export function clusterColor(count: number): string {
  if (count >= 10) return '#E3342F';
  if (count >= 2) return '#F2862E';
  return '#F4CA19';
}
