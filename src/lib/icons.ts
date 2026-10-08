import {
  Accessibility,
  Car,
  CircleHelp,
  CloudRain,
  Droplets,
  Leaf,
  Lightbulb,
  PawPrint,
  TrafficCone,
  Trash2,
  Trees,
  type IconNode,
} from 'lucide';
import type { ReportCategory } from '@/types/report';

const NODES: Record<ReportCategory, IconNode> = {
  accesibilidad: Accessibility,
  agua: Droplets,
  ambiente: Leaf,
  animales: PawPrint,
  calles: Car,
  espacios: Trees,
  iluminacion: Lightbulb,
  inundaciones: CloudRain,
  limpieza: Trash2,
  transito: TrafficCone,
  otros: CircleHelp,
};

function escapeAttr(value: string | number): string {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** Devuelve el SVG (string) del ícono de una categoría, para usar dentro de marcadores de Leaflet. */
export function categoryIconSvg(category: ReportCategory, size = 18, strokeWidth = 2.4): string {
  const node = NODES[category] ?? NODES.otros;
  const children = node
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .map(([k, v]) => `${k}="${escapeAttr(v as string | number)}"`)
        .join(' ');
      return `<${tag} ${a}/>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${children}</svg>`;
}
