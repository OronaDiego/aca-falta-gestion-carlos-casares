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
    image_url: 'data:image/webp;base64,UklGRg==',
    previously_reported: false,
    status: 'pendiente',
    support_count: 0,
    is_hidden: false,
    ...extra,
  };
}

async function seed(id: string) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'reports', id), report(id));
  });
}

test('se puede crear un reclamo válido y leerlo', async () => {
  await assertSucceeds(setDoc(doc(db(), 'reports', 'r1'), report('r1')));
  await assertSucceeds(getDoc(doc(db(), 'reports', 'r1')));
});

test('no se puede crear un reclamo ya resuelto, oculto o con apoyos inflados', async () => {
  await assertFails(setDoc(doc(db(), 'reports', 'r1'), report('r1', { status: 'resuelto' })));
  await assertFails(setDoc(doc(db(), 'reports', 'r2'), report('r2', { is_hidden: true })));
  await assertFails(setDoc(doc(db(), 'reports', 'r3'), report('r3', { support_count: 50 })));
});

test('rechaza categoría inválida, punto fuera del partido, sin foto o campos extra', async () => {
  await assertFails(setDoc(doc(db(), 'reports', 'r1'), report('r1', { category: 'politica' })));
  await assertFails(setDoc(doc(db(), 'reports', 'r2'), report('r2', { latitude: -34.6, longitude: -58.38 })));
  await assertFails(setDoc(doc(db(), 'reports', 'r3'), report('r3', { image_url: '' })));
  await assertFails(setDoc(doc(db(), 'reports', 'r4'), report('r4', { image_url: 'https://evil.example/x.png' })));
  await assertFails(setDoc(doc(db(), 'reports', 'r5'), report('r5', { telefono: '123' })));
  await assertFails(setDoc(doc(db(), 'reports', 'otro-id'), report('r6')));
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
