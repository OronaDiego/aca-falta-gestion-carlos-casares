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
  type LucideIcon,
} from 'lucide-react';
import type { ReportCategory } from '@/types/report';

const ICONS: Record<ReportCategory, LucideIcon> = {
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

export function CategoryIcon({ category, className }: { category: ReportCategory; className?: string }) {
  const Icon = ICONS[category] ?? CircleHelp;
  return <Icon className={className} strokeWidth={2.4} aria-hidden />;
}
