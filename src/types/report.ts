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
  /** Foto comprimida en WebP/JPEG como data URL. */
  image_url: string;
  /** El vecino marcó que ya lo había reclamado antes al municipio. */
  previously_reported: boolean;
  status: ReportStatus;
  support_count: number;
  resolved_at?: string;
  /** Lo pone en `true` un administrador desde la consola de Firebase para ocultar un reclamo. */
  is_hidden: boolean;
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
  'description' | 'category' | 'latitude' | 'longitude' | 'address' | 'image_url' | 'previously_reported'
>;

export type NewContactInput = Pick<ReportContact, 'first_name' | 'last_name' | 'phone'>;
