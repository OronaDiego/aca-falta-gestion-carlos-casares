export type ReportStatus = 'pendiente' | 'en_revision' | 'resuelto';

export type ReportCategory =
  | 'accesibilidad'
  | 'agua'
  | 'ambiente'
  | 'animales'
  | 'calles'
  | 'espacios'
  | 'iluminacion'
  | 'inundaciones'
  | 'limpieza'
  | 'transito'
  | 'otros';

/** Documento público de la colección `reports`. No contiene datos personales. */
export interface Report {
  id: string;
  created_at: string;
  description: string;
  category: ReportCategory;
  /** Barrio o localidad más cercana (se calcula sola). */
  sector: string;
  is_rural: boolean;
  /** Dirección aproximada obtenida de OpenStreetMap. */
  address: string;
  latitude: number;
  longitude: number;
  /** El vecino marcó que ya lo había reclamado antes al municipio. */
  previously_reported: boolean;
  status: ReportStatus;
  support_count: number;
  resolved_at?: string;
  /** Lo pone en `true` un administrador desde la consola de Firebase para ocultar un reclamo. */
  is_hidden: boolean;
}

/**
 * Documento de la colección `photos` (mismo id que el reclamo).
 * La foto va aparte para que el mapa cargue solo datos livianos y la imagen
 * se descargue recién cuando alguien abre el reclamo.
 */
export interface ReportPhoto {
  report_id: string;
  /** Foto comprimida en WebP/JPEG como data URL. */
  image_url: string;
  created_at: string;
}

/** Documento privado de la colección `contacts` (nadie puede leerlo desde la web). */
export interface ReportContact {
  report_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  created_at: string;
}

export interface CategoryInfo {
  id: ReportCategory;
  name: string;
  description: string;
  /** Nombre de ícono de lucide. */
  icon: string;
}

export type NewReportInput = Pick<
  Report,
  'description' | 'category' | 'latitude' | 'longitude' | 'address' | 'previously_reported'
> & { image_url: string };

export type NewContactInput = Pick<ReportContact, 'first_name' | 'last_name' | 'phone'>;
