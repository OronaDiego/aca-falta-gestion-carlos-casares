'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CATEGORIAS, CONTORNO_PARTIDO, MAPA } from '@/config/ciudad';
import { categoryIconSvg } from '@/lib/icons';
import { formatAgo } from '@/lib/geo-utils';
import type { Report } from '@/types/report';
import { TILE_ATTRIBUTION, TILE_URL } from './tiles';
import { clusterColor, clusterReports, type Cluster } from './clusters';

interface MapViewProps {
  reports: Report[];
  supportedIds: Set<string>;
  onSupport: (id: string) => void;
  /** Cuando cambia, el mapa vuela a ese reclamo y abre su ficha. */
  focus?: { id: string; nonce: number } | null;
}

function markerIcon(cluster: Cluster, size = 40): L.DivIcon {
  const count = cluster.reports.length;
  const html = `
    <div class="afm-marker" style="--accent:${clusterColor(count)};width:${size}px;height:${size}px">
      <div class="afm-marker__diamond"></div>
      <div class="afm-marker__icon">${categoryIconSvg(cluster.category, 17)}</div>
      ${count > 1 ? `<div class="afm-marker__badge">${count}</div>` : ''}
    </div>`;
  return L.divIcon({ html, className: 'afm-marker-wrap', iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

/** Ficha del popup construida con nodos DOM (nunca innerHTML con texto de usuarios). */
function popupContent(r: Report, supported: boolean, onSupport: (id: string) => void): HTMLElement {
  const root = document.createElement('div');
  root.className = 'afm-popup';

  const img = document.createElement('img');
  img.className = 'afm-popup__img';
  img.alt = 'Foto del reclamo';
  img.loading = 'lazy';
  img.src = r.image_url;
  root.appendChild(img);

  const body = document.createElement('div');
  body.className = 'afm-popup__body';

  const chip = document.createElement('span');
  chip.className = 'afm-popup__chip';
  chip.textContent = CATEGORIAS[r.category]?.name ?? 'Otros';
  body.appendChild(chip);

  const title = document.createElement('p');
  title.className = 'afm-popup__title';
  title.textContent = r.address || r.sector;
  body.appendChild(title);

  const desc = document.createElement('p');
  desc.className = 'afm-popup__desc';
  desc.textContent = r.description;
  body.appendChild(desc);

  const foot = document.createElement('div');
  foot.className = 'afm-popup__foot';
  const ago = document.createElement('span');
  ago.textContent = formatAgo(r.created_at) + (r.previously_reported ? ' · ya reclamado antes' : '');
  foot.appendChild(ago);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'afm-popup__support';
  btn.disabled = supported;
  btn.textContent = supported ? `Apoyado · ${r.support_count}` : `+1 Yo también · ${r.support_count}`;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    btn.disabled = true;
    btn.textContent = `Apoyado · ${r.support_count + 1}`;
    onSupport(r.id);
  });
  foot.appendChild(btn);
  body.appendChild(foot);

  root.appendChild(body);
  return root;
}

export function MapView({ reports, supportedIds, onSupport, focus }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const openIdRef = useRef<string | null>(null);

  // Datos actuales accesibles desde los handlers de Leaflet sin recrear el mapa
  const dataRef = useRef({ reports, supportedIds, onSupport });
  useEffect(() => {
    dataRef.current = { reports, supportedIds, onSupport };
  });

  const renderRef = useRef<() => void>(() => {});

  // Crear el mapa una sola vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [MAPA.centro.lat, MAPA.centro.lng],
      zoom: MAPA.zoomInicial,
      minZoom: MAPA.zoomMinimo,
      maxZoom: MAPA.zoomMaximo,
      zoomControl: false,
      scrollWheelZoom: false, // la página scrollea: el zoom con rueda se activa al hacer clic en el mapa
      attributionControl: false,
    });

    L.tileLayer(TILE_URL, { maxZoom: MAPA.zoomMaximo, subdomains: 'abcd' }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.attribution({ position: 'bottomright', prefix: false }).addAttribution(TILE_ATTRIBUTION).addTo(map);

    L.polygon(
      CONTORNO_PARTIDO.map(([lng, lat]) => [lat, lng] as [number, number]),
      { color: '#141414', weight: 1.5, dashArray: '6 8', fill: false, interactive: false }
    ).addTo(map);

    map.on('click', () => map.scrollWheelZoom.enable());
    map.on('mouseout', () => map.scrollWheelZoom.disable());

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const render = () => {
      const layer = layerRef.current;
      if (!layer) return;
      // Al limpiar las capas Leaflet cierra el popup abierto: lo recordamos para reabrirlo
      const keepOpen = openIdRef.current;
      layer.clearLayers();
      openIdRef.current = keepOpen;
      const { reports: list, supportedIds: sup, onSupport: support } = dataRef.current;
      const clusters = clusterReports(list, (lat, lng) => map.project([lat, lng], map.getZoom()));

      for (const c of clusters) {
        const marker = L.marker([c.lat, c.lng], {
          icon: markerIcon(c),
          keyboard: true,
          title: c.reports.length > 1 ? `${c.reports.length} reclamos` : CATEGORIAS[c.category].name,
        });

        if (c.reports.length === 1) {
          const r = c.reports[0];
          marker.bindPopup(() => popupContent(r, sup.has(r.id), support), {
            className: 'afm-popup-wrap',
            maxWidth: 280,
            minWidth: 240,
            offset: [0, -14],
            autoPanPaddingTopLeft: [16, 200],
          });
          marker.on('popupopen', () => (openIdRef.current = r.id));
          marker.on('popupclose', () => {
            if (openIdRef.current === r.id) openIdRef.current = null;
          });
          if (openIdRef.current === r.id) setTimeout(() => marker.openPopup(), 0);
        } else {
          marker.on('click', () => {
            const bounds = L.latLngBounds(c.reports.map((r) => [r.latitude, r.longitude] as [number, number]));
            const samePoint = bounds.getNorthEast().equals(bounds.getSouthWest(), 1e-6);
            if (samePoint || map.getZoom() >= MAPA.zoomMaximo - 1) {
              map.setView(bounds.getCenter(), MAPA.zoomMaximo);
            } else {
              map.flyToBounds(bounds, { padding: [60, 60], maxZoom: MAPA.zoomMaximo, duration: 0.6 });
            }
          });
        }
        layer.addLayer(marker);
      }
    };
    renderRef.current = render;
    map.on('zoomend', render);

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Redibujar cuando cambian los datos o los filtros
  useEffect(() => {
    renderRef.current();
  }, [reports, supportedIds]);

  // Enfocar un reclamo (por ejemplo, el que se acaba de crear)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    const r = dataRef.current.reports.find((x) => x.id === focus.id);
    if (!r) return;
    openIdRef.current = r.id;
    map.flyTo([r.latitude, r.longitude], 17, { duration: 0.9 });
    map.once('moveend', () => renderRef.current());
  }, [focus]);

  return <div ref={containerRef} className="h-full w-full" aria-label="Mapa de reclamos" role="region" />;
}

export default MapView;
