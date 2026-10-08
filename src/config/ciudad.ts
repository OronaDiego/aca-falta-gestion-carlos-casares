import type { CategoryInfo, ReportCategory } from '@/types/report';

/**
 * Configuración de la ciudad. Todo lo que es propio de Carlos Casares vive acá:
 * para replicar la app en otro distrito alcanza con cambiar este archivo
 * (y los límites geográficos en firestore.rules).
 */

export const CIUDAD = {
  nombre: 'Carlos Casares',
  partido: 'Partido de Carlos Casares',
  provincia: 'Buenos Aires',
  pais: 'Argentina',
  // URL pública donde se va a publicar el sitio (se usa para compartir y en los carteles)
  urlPublica: 'https://acafaltalamuni-casares.web.app',
  // Perfil de Instagram para el botón de redes (dejar vacío para ocultarlo)
  instagram: '',
  // Mail para consultas y pedidos de baja de datos personales (Ley 25.326). Completar antes de publicar.
  emailContacto: '',
  // Repositorio público del código (la licencia AGPL-3.0 obliga a ofrecerlo). Cambiar por el de ustedes.
  codigoFuente: 'https://github.com/elpabloultron/aca-falta-la-muni-osorno',
} as const;

/**
 * Cuenta regresiva de la cinta superior.
 * Fecha de las elecciones generales 2027: CONFIRMAR antes de publicar
 * (la Provincia de Buenos Aires puede desdoblar el calendario municipal).
 */
export const CUENTA_REGRESIVA = {
  fechaObjetivo: '2027-10-24T08:00:00-03:00',
  texto: 'DÍAS PARA ELEGIR OTRA CIUDAD',
} as const;

export const MAPA = {
  centro: { lat: -35.6232, lng: -61.365 },
  zoomInicial: 14,
  zoomMinimo: 10,
  zoomMaximo: 19,
};

/** Rectángulo que contiene todo el partido (urbano + rural). Debe coincidir con firestore.rules. */
export const LIMITES_PARTIDO: [[number, number], [number, number]] = [
  [-36.08, -61.73], // suroeste
  [-35.37, -61.02], // noreste
];

/**
 * Lugares de referencia para asignar automáticamente el "sector" de cada reclamo
 * (se elige el más cercano al punto marcado). Coordenadas de OpenStreetMap.
 * Para sumar barrios de la ciudad, agregalos acá con su coordenada aproximada.
 */
export const LUGARES: { nombre: string; lat: number; lng: number; rural: boolean }[] = [
  // Ciudad cabecera
  { nombre: 'Centro', lat: -35.6232, lng: -61.365, rural: false },
  { nombre: 'Barrio Santa Teresa', lat: -35.6154, lng: -61.3555, rural: false },
  { nombre: 'Barrio Balbín', lat: -35.6357, lng: -61.3709, rural: false },
  { nombre: 'Las Nazarenas', lat: -35.64, lng: -61.3652, rural: false },
  // Localidades del partido
  { nombre: 'Moctezuma', lat: -35.4779, lng: -61.4957, rural: true },
  { nombre: 'Smith', lat: -35.4953, lng: -61.5926, rural: true },
  { nombre: 'Bellocq', lat: -35.9166, lng: -61.534, rural: true },
  { nombre: 'Cadret', lat: -35.7724, lng: -61.3358, rural: true },
  { nombre: 'Hortensia', lat: -35.9245, lng: -61.2597, rural: true },
  { nombre: 'Ordoqui', lat: -35.8804, lng: -61.1601, rural: true },
  { nombre: 'Mauricio Hirsch', lat: -35.5824, lng: -61.5251, rural: true },
  { nombre: 'Colonia Mauricio', lat: -35.5248, lng: -61.4378, rural: true },
  { nombre: 'Gobernador Arias', lat: -35.5373, lng: -61.3441, rural: true },
  { nombre: 'Santo Tomás', lat: -35.6762, lng: -61.5126, rural: true },
  { nombre: 'La Dorita', lat: -35.5903, lng: -61.2397, rural: true },
  { nombre: 'La Sofía', lat: -35.6985, lng: -61.1686, rural: true },
];

/** Contorno simplificado del partido (OpenStreetMap), en formato [lng, lat]. */
export const CONTORNO_PARTIDO: [number, number][] = [
  [-61.7243, -35.5367],
  [-61.5732, -35.6428],
  [-61.6, -35.6646],
  [-61.5009, -35.7447],
  [-61.6346, -35.8527],
  [-61.5428, -35.9282],
  [-61.5592, -35.942],
  [-61.3935, -36.0715],
  [-61.3334, -36.0211],
  [-61.2698, -36.071],
  [-61.0356, -35.8759],
  [-61.1012, -35.8249],
  [-61.0315, -35.7658],
  [-61.2714, -35.5601],
  [-61.2877, -35.5733],
  [-61.5319, -35.3782],
  [-61.7243, -35.5367],
];

/**
 * Categorías. El `id` es lo que se guarda en la base y debe coincidir con la lista de firestore.rules.
 * `icono` es el nombre de un ícono de lucide (https://lucide.dev/icons).
 */
export const CATEGORIAS: Record<ReportCategory, CategoryInfo> = {
  accesibilidad: {
    id: 'accesibilidad',
    name: 'Accesibilidad',
    description: 'Barreras urbanas y dificultades de movilidad para personas con discapacidad.',
    icon: 'Accessibility',
  },
  agua: {
    id: 'agua',
    name: 'Agua y saneamiento',
    description: 'Cloacas, desagües, pérdidas y rotura de caños.',
    icon: 'Droplets',
  },
  ambiente: {
    id: 'ambiente',
    name: 'Ambiente',
    description: 'Quemas, contaminación, fumigaciones cerca de casas, plagas o roedores.',
    icon: 'Leaf',
  },
  animales: {
    id: 'animales',
    name: 'Bienestar animal',
    description: 'Maltrato, abandono o situaciones de riesgo hacia animales.',
    icon: 'PawPrint',
  },
  calles: {
    id: 'calles',
    name: 'Calles',
    description: 'Baches, calles de tierra intransitables, veredas rotas y cordón cuneta.',
    icon: 'Car',
  },
  espacios: {
    id: 'espacios',
    name: 'Espacios públicos',
    description: 'Estado de plazas, parques, juegos y espacios comunes.',
    icon: 'Trees',
  },
  iluminacion: {
    id: 'iluminacion',
    name: 'Iluminación',
    description: 'Falta o fallas de alumbrado en calles y espacios públicos.',
    icon: 'Lightbulb',
  },
  inundaciones: {
    id: 'inundaciones',
    name: 'Inundaciones',
    description: 'Calles o barrios anegados por lluvias o falta de drenaje.',
    icon: 'CloudRain',
  },
  limpieza: {
    id: 'limpieza',
    name: 'Limpieza',
    description: 'Basura acumulada, microbasurales y fallas en la recolección.',
    icon: 'Trash2',
  },
  transito: {
    id: 'transito',
    name: 'Tránsito y transporte',
    description: 'Señalización, semáforos, lomos de burro y circulación.',
    icon: 'TrafficCone',
  },
  otros: {
    id: 'otros',
    name: 'Otros',
    description: 'Cualquier otro problema que no entre en las categorías anteriores.',
    icon: 'CircleHelp',
  },
};

export const CATEGORIAS_ORDENADAS: CategoryInfo[] = Object.values(CATEGORIAS).sort((a, b) => {
  if (a.id === 'otros') return 1;
  if (b.id === 'otros') return -1;
  return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
});
