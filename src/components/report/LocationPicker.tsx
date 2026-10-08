'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MAPA } from '@/config/ciudad';
import { TILE_ATTRIBUTION, TILE_URL } from '@/components/map/tiles';

interface LocationPickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (p: { lat: number; lng: number }) => void;
}

const pinIcon = L.divIcon({
  className: 'afm-marker-wrap',
  html: `<div class="afm-pick"><div class="afm-pick__head"></div></div>`,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
});

/** Mapa chico del formulario: tocá o arrastrá el pin para elegir el punto exacto. */
export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, {
      center: [MAPA.centro.lat, MAPA.centro.lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });
    L.tileLayer(TILE_URL, { maxZoom: MAPA.zoomMaximo, subdomains: 'abcd' }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.attribution({ position: 'bottomleft', prefix: false }).addAttribution(TILE_ATTRIBUTION).addTo(map);
    map.on('click', (e: L.LeafletMouseEvent) => onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng }));
    mapRef.current = map;
    // El modal termina de animarse después de montar el mapa
    setTimeout(() => map.invalidateSize(), 250);
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (!markerRef.current) {
      markerRef.current = L.marker([value.lat, value.lng], { icon: pinIcon, draggable: true }).addTo(map);
      markerRef.current.on('dragend', (e) => {
        const p = (e.target as L.Marker).getLatLng();
        onChangeRef.current({ lat: p.lat, lng: p.lng });
      });
    } else {
      markerRef.current.setLatLng([value.lat, value.lng]);
    }
    if (!map.getBounds().pad(-0.2).contains([value.lat, value.lng])) {
      map.setView([value.lat, value.lng], Math.max(map.getZoom(), 16));
    }
  }, [value]);

  return <div ref={ref} className="h-56 w-full overflow-hidden rounded-xl" />;
}
