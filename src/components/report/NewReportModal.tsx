'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, LocateFixed, Search } from 'lucide-react';
import { CATEGORIAS, CATEGORIAS_ORDENADAS, CIUDAD } from '@/config/ciudad';
import { compressImage } from '@/lib/compression';
import { findNearbyDuplicate, isWithinPartido } from '@/lib/geo-utils';
import { reverseGeocode, searchAddress, type GeoResult } from '@/lib/geocoding';
import type { NewContactInput, NewReportInput, Report, ReportCategory } from '@/types/report';

const LocationPicker = dynamic(() => import('./LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-56 w-full animate-pulse rounded-xl bg-white/5" />,
});

interface NewReportModalProps {
  reports: Report[];
  onClose: () => void;
  onSubmit: (input: NewReportInput, contact?: NewContactInput) => Promise<void>;
  onSupportExisting: (r: Report) => void;
}

const label = 'mb-2 block text-[13px] font-medium uppercase tracking-wider text-neutral-300';
const input =
  'w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 focus:border-brand-yellow focus:outline-none';

export function NewReportModal({ reports, onClose, onSubmit, onSupportExisting }: NewReportModalProps) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory | ''>('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoName, setPhotoName] = useState('');
  const [previously, setPreviously] = useState(false);
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [contact, setContact] = useState<NewContactInput>({ first_name: '', last_name: '', phone: '' });
  const [honeypot, setHoneypot] = useState('');
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  // Cerrar con Escape y bloquear el scroll de fondo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // Dirección aproximada del punto elegido
  useEffect(() => {
    if (!point) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      const a = await reverseGeocode(point.lat, point.lng, ctrl.signal);
      if (a) setAddress(a);
    }, 600);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [point]);

  const errors = {
    description: description.trim().length < 5 ? 'Contanos qué pasa (mínimo 5 letras).' : '',
    category: !category ? 'Elegí una categoría' : '',
    photo: !photo ? 'La foto es obligatoria.' : '',
    point: !point
      ? 'Marcá el lugar en el mapa.'
      : !isWithinPartido(point.lat, point.lng)
        ? `El punto tiene que estar dentro del partido de ${CIUDAD.nombre}.`
        : '',
  };
  const hasErrors = Object.values(errors).some(Boolean);
  const duplicate = point && category ? findNearbyDuplicate(point.lat, point.lng, category, reports) : null;

  async function handlePhoto(file: File | undefined) {
    setPhotoError('');
    if (!file) return;
    setPhotoBusy(true);
    try {
      setPhoto(await compressImage(file));
    } catch (e) {
      setPhoto(null);
      setPhotoError((e as Error).message);
    } finally {
      setPhotoBusy(false);
    }
  }

  async function handleSearch() {
    if (query.trim().length < 3) return;
    setSearching(true);
    try {
      setResults(await searchAddress(query.trim()));
    } finally {
      setSearching(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setSubmitError('No pudimos obtener tu ubicación. Marcá el punto en el mapa.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    setSubmitError('');
    if (hasErrors || honeypot) return;
    setSending(true);
    try {
      await onSubmit(
        {
          description,
          category: category as ReportCategory,
          latitude: Number(point!.lat.toFixed(6)),
          longitude: Number(point!.lng.toFixed(6)),
          address,
          image_url: photo!,
          previously_reported: previously,
        },
        contact
      );
    } catch (err) {
      console.error(err);
      setSubmitError('No se pudo enviar el reclamo. Revisá tu conexión y probá de nuevo.');
      setSending(false);
    }
  }

  const show = (msg: string) => (touched && msg ? <p className="mt-2 text-sm text-red-400">{msg}</p> : null);

  return (
    <div className="fixed inset-0 z-[1000] flex items-stretch justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nuevo-reclamo-title"
        className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 id="nuevo-reclamo-title" className="font-display text-lg tracking-wider text-white">
            NUEVO RECLAMO
          </h2>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10">
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {/* Trampa para bots: los humanos no la ven */}
          <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />

          <div>
            <label htmlFor="desc" className={label}>Descripción del reclamo</label>
            <textarea id="desc" rows={3} maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} className={input} placeholder="Ej: bache grande en la esquina, hace meses que está así" />
            {show(errors.description)}
          </div>

          <div>
            <label htmlFor="cat" className={`${label} ${touched && errors.category ? 'text-red-400' : ''}`}>Categoría</label>
            <div className="relative">
              <select
                id="cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as ReportCategory)}
                className={`${input} appearance-none pr-10 ${touched && errors.category ? 'border-red-400/70' : ''}`}
              >
                <option value="">Elegí una categoría</option>
                {CATEGORIAS_ORDENADAS.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-yellow" aria-hidden />
            </div>
            {category && <p className="mt-2 text-xs text-neutral-400">{CATEGORIAS[category].description}</p>}
            {show(errors.category)}
          </div>

          <div>
            <span className={label}>Foto *</span>
            {/* El botón nativo muestra "Choose file" según el idioma del navegador: lo ocultamos y usamos uno propio */}
            <label htmlFor="foto" className={`${input} flex cursor-pointer items-center gap-3 focus-within:border-brand-yellow`}>
              <span className="shrink-0 rounded-md bg-white px-3 py-1 text-sm font-medium text-black">
                {photo ? 'Cambiar foto' : 'Seleccionar foto'}
              </span>
              <span className={`truncate text-sm ${photoName ? 'text-neutral-200' : 'text-neutral-500'}`}>
                {photoName || 'Sin foto'}
              </span>
              <input
                id="foto"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setPhotoName(f?.name ?? '');
                  handlePhoto(f);
                }}
              />
            </label>
            <p className="mt-2 text-xs text-neutral-400">Sacá una foto o elegila de la galería (hasta 25 MB) — Obligatorio</p>
            {photoBusy && <p className="mt-2 text-sm text-neutral-300">Procesando foto…</p>}
            {/* eslint-disable-next-line @next/next/no-img-element -- vista previa de un data URL local */}
            {photo && <img src={photo} alt="Vista previa de la foto" className="mt-3 h-36 w-full rounded-xl object-cover" />}
            {photoError && <p className="mt-2 text-sm text-red-400">{photoError}</p>}
            {!photoError && show(errors.photo)}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
            <input type="checkbox" checked={previously} onChange={(e) => setPreviously(e.target.checked)} className="mt-1 h-5 w-5 accent-brand-yellow" />
            <span>
              <span className="block font-display text-sm tracking-wider text-white">RECLAMOS PREVIOS</span>
              <span className="text-sm text-neutral-400">Marcá si ya lo reportaste antes al municipio.</span>
            </span>
          </label>

          <fieldset className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
            <legend className="px-1 font-display text-base tracking-wider text-white">UBICACIÓN</legend>
            <div>
              <label htmlFor="dir" className={label}>Buscar dirección</label>
              <div className="flex gap-2">
                <input
                  id="dir"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  className={input}
                  placeholder={`Ej: San Martín 400, ${CIUDAD.nombre}`}
                />
                <button type="button" onClick={handleSearch} aria-label="Buscar dirección" className="rounded-xl border border-white/15 px-3 text-white hover:bg-white/10">
                  <Search className="h-5 w-5" aria-hidden />
                </button>
              </div>
              {searching && <p className="mt-2 text-sm text-neutral-400">Buscando…</p>}
              {results.length > 0 && (
                <ul className="mt-2 overflow-hidden rounded-xl border border-white/10">
                  {results.map((r, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => {
                          setPoint({ lat: r.lat, lng: r.lng });
                          setAddress(r.label);
                          setResults([]);
                        }}
                        className="w-full border-b border-white/5 px-4 py-2 text-left text-sm text-neutral-200 last:border-0 hover:bg-white/10"
                      >
                        {r.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 text-sm">
              <span className={point ? 'text-neutral-200' : 'text-neutral-400'}>
                {point ? address || 'Punto marcado' : 'Seleccioná un punto en el mapa'}
              </span>
              <button type="button" onClick={useMyLocation} className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-brand-yellow hover:bg-white/5">
                <LocateFixed className="h-4 w-4" aria-hidden /> Mi ubicación
              </button>
            </div>
            <LocationPicker value={point} onChange={setPoint} />
            {show(errors.point)}

            {duplicate && (
              <div className="rounded-xl border border-brand-yellow/40 bg-brand-yellow/10 p-3 text-sm text-neutral-100">
                Ya hay un reclamo de <strong>{CATEGORIAS[duplicate.report.category].name}</strong> a {duplicate.distance} m.
                <button type="button" onClick={() => onSupportExisting(duplicate.report)} className="ml-1 font-semibold text-brand-yellow underline">
                  Apoyar ese reclamo
                </button>{' '}
                o seguí si es otro problema.
              </div>
            )}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-3 text-sm text-neutral-300">
              Dejanos tu contacto para avisarte sobre las novedades del reclamo <span className="text-neutral-500">(opcional, no se publica)</span>
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="nom" className={label}>Nombre</label>
                <input id="nom" autoComplete="given-name" maxLength={60} value={contact.first_name} onChange={(e) => setContact({ ...contact, first_name: e.target.value })} className={input} />
              </div>
              <div>
                <label htmlFor="ape" className={label}>Apellido</label>
                <input id="ape" autoComplete="family-name" maxLength={60} value={contact.last_name} onChange={(e) => setContact({ ...contact, last_name: e.target.value })} className={input} />
              </div>
            </div>
            <div>
              <label htmlFor="tel" className={label}>Teléfono</label>
              <input id="tel" type="tel" inputMode="tel" autoComplete="tel" maxLength={30} value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className={input} />
            </div>
            <p className="text-xs leading-relaxed text-neutral-500">
              Tus datos de contacto no aparecen en el mapa. Solo los usa el equipo del proyecto para contarte novedades del reclamo
              (Ley 25.326 de Protección de Datos Personales). Podés pedir que los borremos cuando quieras
              {CIUDAD.emailContacto ? <> escribiendo a <a className="underline" href={`mailto:${CIUDAD.emailContacto}`}>{CIUDAD.emailContacto}</a></> : null}.
            </p>
          </fieldset>

          {submitError && <p className="rounded-xl bg-red-500/15 p-3 text-sm text-red-300">{submitError}</p>}

          <div className="flex gap-3 pb-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/15 py-3 font-semibold text-white hover:bg-white/10">
              Cancelar
            </button>
            <button type="submit" disabled={sending || photoBusy} className="flex-1 rounded-xl bg-brand-yellow py-3 font-display tracking-wide text-ink hover:brightness-105 disabled:opacity-60">
              {sending ? 'Enviando…' : 'Enviar reclamo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
