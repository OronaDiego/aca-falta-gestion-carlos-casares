import {
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
} from 'firebase/firestore';
import { getDb, isDemoMode } from './firebase';
import { nearestPlace } from './geo-utils';
import { buildDemoReports, demoPhoto } from './demo-data';
import type { NewContactInput, NewReportInput, Report } from '@/types/report';

const SUPPORTS_KEY = 'afm_casares_supports_v1';
const DEVICE_KEY = 'afm_casares_device_v1';
const DEMO_KEY = 'afm_casares_demo_reports_v2';
const DEMO_PHOTOS_KEY = 'afm_casares_demo_photos_v2';

/* ------------------------------------------------------------------ */
/* Utilidades del navegador                                            */
/* ------------------------------------------------------------------ */

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* sin almacenamiento (modo privado o cuota llena): seguimos sin cachear */
  }
}

function randomId(prefix: string): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : Math.random().toString(36).slice(2, 18);
  return `${prefix}_${Date.now().toString(36)}_${rnd}`;
}

export function getDeviceId(): string {
  let id = safeGet(DEVICE_KEY);
  if (!id) {
    id = randomId('dev');
    safeSet(DEVICE_KEY, id);
  }
  return id;
}

export function getSupportedIds(): Set<string> {
  try {
    return new Set(JSON.parse(safeGet(SUPPORTS_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function addSupportedId(id: string): void {
  const s = getSupportedIds();
  s.add(id);
  safeSet(SUPPORTS_KEY, JSON.stringify([...s]));
}

/* ------------------------------------------------------------------ */
/* Modo demo (sin Firebase)                                            */
/* ------------------------------------------------------------------ */

type Listener = (reports: Report[]) => void;
const demoListeners = new Set<Listener>();

function readDemo(): Report[] {
  const raw = safeGet(DEMO_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Report[];
    } catch {
      /* se regenera abajo */
    }
  }
  const seed = buildDemoReports();
  safeSet(DEMO_KEY, JSON.stringify(seed));
  return seed;
}

function writeDemo(reports: Report[]): void {
  safeSet(DEMO_KEY, JSON.stringify(reports));
  demoListeners.forEach((l) => l(reports));
}

/* ------------------------------------------------------------------ */
/* API pública                                                         */
/* ------------------------------------------------------------------ */

/** Escucha en tiempo real los reclamos visibles. Devuelve la función para desuscribirse. */
export function subscribeReports(onUpdate: Listener, onError?: (err: Error) => void): () => void {
  if (isDemoMode) {
    demoListeners.add(onUpdate);
    onUpdate(readDemo());
    return () => demoListeners.delete(onUpdate);
  }

  const q = query(collection(getDb(), 'reports'), orderBy('created_at', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const list: Report[] = [];
      snap.forEach((d) => {
        const r = d.data() as Report;
        if (!r.is_hidden) list.push(r);
      });
      onUpdate(list);
    },
    (err) => onError?.(err)
  );
}

/** Crea el reclamo público y, si el vecino lo dejó, su contacto privado (en la misma operación). */
export async function createReport(input: NewReportInput, contact?: NewContactInput): Promise<Report> {
  const place = nearestPlace(input.latitude, input.longitude);
  const now = new Date().toISOString();
  const report: Report = {
    id: randomId('rec'),
    created_at: now,
    description: input.description.trim(),
    category: input.category,
    sector: place.nombre,
    is_rural: place.rural,
    address: input.address.trim().slice(0, 160),
    latitude: input.latitude,
    longitude: input.longitude,
    previously_reported: input.previously_reported,
    status: 'pendiente',
    support_count: 0,
    is_hidden: false,
  };

  const hasContact = !!contact && (contact.first_name.trim() || contact.last_name.trim() || contact.phone.trim());

  photoCache.set(report.id, input.image_url);

  if (isDemoMode) {
    try {
      const photos = JSON.parse(safeGet(DEMO_PHOTOS_KEY) || '{}');
      photos[report.id] = input.image_url;
      safeSet(DEMO_PHOTOS_KEY, JSON.stringify(photos));
    } catch {
      /* sin almacenamiento: la foto queda solo en memoria */
    }
    writeDemo([report, ...readDemo()]);
    return report;
  }

  const db = getDb();
  const batch = writeBatch(db);
  batch.set(doc(db, 'reports', report.id), report);
  batch.set(doc(db, 'photos', report.id), { report_id: report.id, image_url: input.image_url, created_at: now });
  if (hasContact) {
    batch.set(doc(db, 'contacts', report.id), {
      report_id: report.id,
      first_name: contact!.first_name.trim().slice(0, 60),
      last_name: contact!.last_name.trim().slice(0, 60),
      phone: contact!.phone.trim().slice(0, 30),
      created_at: now,
    });
  }
  await batch.commit();
  return report;
}

/** Suma un apoyo (+1). Cada dispositivo puede apoyar una sola vez cada reclamo. */
export async function supportReport(reportId: string): Promise<void> {
  if (getSupportedIds().has(reportId)) return;
  addSupportedId(reportId);

  if (isDemoMode) {
    writeDemo(readDemo().map((r) => (r.id === reportId ? { ...r, support_count: r.support_count + 1 } : r)));
    return;
  }

  const db = getDb();
  const deviceId = getDeviceId();
  const batch = writeBatch(db);
  batch.set(doc(db, 'supports', `${reportId}_${deviceId}`), {
    report_id: reportId,
    device_id: deviceId,
    created_at: new Date().toISOString(),
  });
  batch.update(doc(db, 'reports', reportId), { support_count: increment(1) });
  await batch.commit();
}

/* ------------------------------------------------------------------ */
/* Fotos (se bajan una por una, solo cuando se abre un reclamo)        */
/* ------------------------------------------------------------------ */

const photoCache = new Map<string, string>();
const photoRequests = new Map<string, Promise<string | null>>();

/** Devuelve la foto del reclamo (data URL) o null si no tiene. Cachea en memoria. */
export function getReportPhoto(reportId: string): Promise<string | null> {
  const cached = photoCache.get(reportId);
  if (cached) return Promise.resolve(cached);
  const pending = photoRequests.get(reportId);
  if (pending) return pending;

  const request = (async () => {
    let url: string | null = null;
    if (isDemoMode) {
      try {
        url = JSON.parse(safeGet(DEMO_PHOTOS_KEY) || '{}')[reportId] ?? null;
      } catch {
        url = null;
      }
      if (!url) {
        const r = readDemo().find((x) => x.id === reportId);
        url = r ? demoPhoto(r.category) : null;
      }
    } else {
      const snap = await getDoc(doc(getDb(), 'photos', reportId));
      url = snap.exists() ? (snap.data().image_url as string) : null;
    }
    if (url) photoCache.set(reportId, url);
    photoRequests.delete(reportId);
    return url;
  })().catch((err) => {
    photoRequests.delete(reportId);
    console.error('No se pudo cargar la foto:', err);
    return null;
  });

  photoRequests.set(reportId, request);
  return request;
}
