/**
 * Pruebas de firestore.rules contra el emulador de Firebase.
 * Requiere Java instalado. Correr con:  npm run test:reglas
 */
import { after, before, beforeEach, test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, increment, setDoc, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore';

let env: RulesTestEnvironment;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-acafaltalamuni',
    firestore: { rules: fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8') },
  });
});
after(async () => env?.cleanup());
beforeEach(async () => env.clearFirestore());

const db = () => env.unauthenticatedContext().firestore();

function report(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    created_at: '2026-10-08T18:00:00.000Z',
    description: 'Bache enorme en la esquina',
    category: 'calles',
    sector: 'Centro',
    is_rural: false,
    address: 'San Martín 400, Carlos Casares',
    latitude: -35.6232,
    longitude: -61.365,
    previously_reported: false,
    status: 'pendiente',
    support_count: 0,
    is_hidden: false,
    ...extra,
  };
}

const PHOTO = 'data:image/webp;base64,UklGRg==';
function photo(id: string, extra: Record<string, unknown> = {}) {
  return { report_id: id, image_url: PHOTO, created_at: '2026-10-08T18:00:00.000Z', ...extra };
}

/** Crea reclamo + foto en una sola operación, como hace la app. */
function createWithPhoto(id: string, rep = report(id), ph: Record<string, unknown> | null = photo(id)) {
  const b = writeBatch(db());
  b.set(doc(db(), 'reports', id), rep);
  if (ph) b.set(doc(db(), 'photos', id), ph);
  return b.commit();
}

async function seed(id: string) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'reports', id), report(id));
    await setDoc(doc(ctx.firestore(), 'photos', id), photo(id));
  });
}

test('se puede crear un reclamo válido con su foto y leer ambos', async () => {
  await assertSucceeds(createWithPhoto('r1'));
  await assertSucceeds(getDoc(doc(db(), 'reports', 'r1')));
  await assertSucceeds(getDoc(doc(db(), 'photos', 'r1')));
});

test('la foto es obligatoria y tiene que ser una imagen comprimida', async () => {
  await assertFails(createWithPhoto('r1', report('r1'), null));
  await assertFails(createWithPhoto('r2', report('r2'), photo('r2', { image_url: '' })));
  await assertFails(createWithPhoto('r3', report('r3'), photo('r3', { image_url: 'https://evil.example/x.png' })));
  await assertFails(createWithPhoto('r4', report('r4'), photo('r4', { image_url: 'data:image/webp;base64,' + 'A'.repeat(700001) })));
});

test('no se puede cambiar ni agregar la foto de un reclamo existente', async () => {
  await seed('r1');
  await assertFails(setDoc(doc(db(), 'photos', 'r1'), photo('r1')));
  await assertFails(setDoc(doc(db(), 'photos', 'huerfana'), photo('huerfana')));
});

test('no se puede crear un reclamo ya resuelto, oculto o con apoyos inflados', async () => {
  await assertFails(createWithPhoto('r1', report('r1', { status: 'resuelto' })));
  await assertFails(createWithPhoto('r2', report('r2', { is_hidden: true })));
  await assertFails(createWithPhoto('r3', report('r3', { support_count: 50 })));
});

test('rechaza categoría inválida, punto fuera del partido o campos extra', async () => {
  await assertFails(createWithPhoto('r1', report('r1', { category: 'politica' })));
  await assertFails(createWithPhoto('r2', report('r2', { latitude: -34.6, longitude: -58.38 })));
  await assertFails(createWithPhoto('r5', report('r5', { telefono: '123' })));
  await assertFails(createWithPhoto('otro-id', report('r6'), photo('otro-id')));
});

test('desde la web no se puede resolver, ocultar, editar ni borrar', async () => {
  await seed('r1');
  await assertFails(updateDoc(doc(db(), 'reports', 'r1'), { status: 'resuelto' }));
  await assertFails(updateDoc(doc(db(), 'reports', 'r1'), { is_hidden: true }));
  await assertFails(updateDoc(doc(db(), 'reports', 'r1'), { description: 'cambiado' }));
  await assertFails(deleteDoc(doc(db(), 'reports', 'r1')));
});

test('apoyos: solo +1, y un registro por dispositivo', async () => {
  await seed('r1');
  const b = writeBatch(db());
  b.set(doc(db(), 'supports', 'r1_dev1'), { report_id: 'r1', device_id: 'dev1', created_at: '2026-10-08T18:00:00.000Z' });
  b.update(doc(db(), 'reports', 'r1'), { support_count: increment(1) });
  await assertSucceeds(b.commit());

  await assertFails(updateDoc(doc(db(), 'reports', 'r1'), { support_count: 99 }));
  await assertFails(
    setDoc(doc(db(), 'supports', 'r1_dev1'), { report_id: 'r1', device_id: 'dev1', created_at: '2026-10-08T18:00:00.000Z' })
  );
});

test('contactos: se pueden dejar junto al reclamo pero nadie los puede leer', async () => {
  const b = writeBatch(db());
  b.set(doc(db(), 'reports', 'r1'), report('r1'));
  b.set(doc(db(), 'photos', 'r1'), photo('r1'));
  b.set(doc(db(), 'contacts', 'r1'), {
    report_id: 'r1',
    first_name: 'Ana',
    last_name: 'Pérez',
    phone: '2395 123456',
    created_at: '2026-10-08T18:00:00.000Z',
  });
  await assertSucceeds(b.commit());
  await assertFails(getDoc(doc(db(), 'contacts', 'r1')));
});
