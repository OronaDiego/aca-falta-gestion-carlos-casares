import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CATEGORIAS, LIMITES_PARTIDO, LUGARES, MAPA } from '../../src/config/ciudad';
import {
  daysElapsed,
  daysUntil,
  distanceMeters,
  findNearbyDuplicate,
  isWithinPartido,
  nearestPlace,
} from '../../src/lib/geo-utils';
import { clusterColor, clusterReports } from '../../src/components/map/clusters';
import { buildDemoReports } from '../../src/lib/demo-data';
import type { Report } from '../../src/types/report';

const rules = fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');

test('las categorías de firestore.rules coinciden con las de la app', () => {
  const m = rules.match(/function validCategory\(c\)\s*\{\s*return c in \[([\s\S]*?)\];/);
  assert.ok(m, 'no se encontró validCategory en firestore.rules');
  const enRules = [...m[1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]).sort();
  assert.deepEqual(enRules, Object.keys(CATEGORIAS).sort());
});

test('los límites de firestore.rules coinciden con LIMITES_PARTIDO', () => {
  const [sw, ne] = LIMITES_PARTIDO;
  assert.ok(rules.includes(`d.latitude >= ${sw[0]} && d.latitude <= ${ne[0]}`), 'latitudes distintas');
  assert.ok(rules.includes(`d.longitude >= ${sw[1]} && d.longitude <= ${ne[1]}`), 'longitudes distintas');
});

test('el centro del mapa y todas las localidades están dentro del partido', () => {
  assert.ok(isWithinPartido(MAPA.centro.lat, MAPA.centro.lng));
  for (const l of LUGARES) assert.ok(isWithinPartido(l.lat, l.lng), `${l.nombre} quedó afuera`);
});

test('puntos lejanos quedan afuera (CABA, Osorno, Resistencia)', () => {
  assert.equal(isWithinPartido(-34.6037, -58.3816), false);
  assert.equal(isWithinPartido(-40.5739, -73.1335), false);
  assert.equal(isWithinPartido(-27.4514, -58.9867), false);
});

test('distancia Carlos Casares – Moctezuma ≈ 20 km', () => {
  const d = distanceMeters(-35.6232, -61.365, -35.4779, -61.4957);
  assert.ok(d > 18000 && d < 22000, `distancia ${d}`);
});

test('el sector se asigna a la localidad más cercana', () => {
  assert.deepEqual(nearestPlace(-35.624, -61.366), { nombre: 'Centro', rural: false });
  assert.deepEqual(nearestPlace(-35.478, -61.496), { nombre: 'Moctezuma', rural: true });
  assert.equal(nearestPlace(-35.917, -61.533).nombre, 'Bellocq');
});

const base: Report = {
  id: 'a',
  created_at: new Date().toISOString(),
  description: 'Bache grande',
  category: 'calles',
  sector: 'Centro',
  is_rural: false,
  address: '',
  latitude: -35.6232,
  longitude: -61.365,
  previously_reported: false,
  status: 'pendiente',
  support_count: 0,
  is_hidden: false,
};

test('detecta duplicados cercanos de la misma categoría', () => {
  const dup = findNearbyDuplicate(-35.62323, -61.36505, 'calles', [base]);
  assert.ok(dup && dup.distance < 35);
  assert.equal(findNearbyDuplicate(-35.62323, -61.36505, 'iluminacion', [base]), null);
  assert.equal(findNearbyDuplicate(-35.6262, -61.365, 'calles', [base]), null); // ~330 m
  assert.equal(findNearbyDuplicate(-35.62323, -61.36505, 'calles', [{ ...base, status: 'resuelto' }]), null);
});

test('cuenta de días', () => {
  assert.equal(daysElapsed('2026-01-01T00:00:00Z', '2026-01-31T00:00:00Z'), 30);
  assert.equal(daysUntil('2027-10-24T08:00:00-03:00', Date.parse('2027-10-23T08:00:00-03:00')), 1);
  assert.equal(daysUntil('2020-01-01T00:00:00Z'), 0);
});

test('agrupamiento de marcadores', () => {
  const near = [base, { ...base, id: 'b', category: 'iluminacion' as const }, { ...base, id: 'c' }];
  const far = { ...base, id: 'd', latitude: -35.5, longitude: -61.5 };
  const project = (lat: number, lng: number) => ({ x: lng * 10000, y: lat * 10000 });
  const clusters = clusterReports([...near, far], project);
  assert.equal(clusters.length, 2);
  const big = clusters.find((c) => c.reports.length === 3)!;
  assert.equal(big.category, 'calles'); // la categoría mayoritaria define el ícono
  assert.equal(clusterColor(1), '#F4CA19');
  assert.equal(clusterColor(3), '#F2862E');
  assert.equal(clusterColor(12), '#E3342F');
});

test('los datos demo son válidos y están dentro del partido', () => {
  const demo = buildDemoReports();
  assert.ok(demo.length > 10);
  for (const r of demo) {
    assert.ok(isWithinPartido(r.latitude, r.longitude));
    assert.ok(r.category in CATEGORIAS);
  }
});
