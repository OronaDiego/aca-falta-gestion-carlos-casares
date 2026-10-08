'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { CountdownBar } from '@/components/CountdownBar';
import { Hero } from '@/components/Hero';
import { Footer } from '@/components/Footer';
import { FilterPanel } from '@/components/FilterPanel';
import { NewReportModal } from '@/components/report/NewReportModal';
import { CATEGORIAS } from '@/config/ciudad';
import { isDemoMode } from '@/lib/firebase';
import { createReport, getSupportedIds, subscribeReports, supportReport } from '@/lib/storage';
import type { NewContactInput, NewReportInput, Report, ReportCategory } from '@/types/report';

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-[#e9e9e9]" />,
});

const ALL = Object.keys(CATEGORIAS) as ReportCategory[];

export default function HomePage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loadError, setLoadError] = useState(false);
  // Los apoyos se guardan en el navegador; no se pintan en el HTML inicial, así que no afecta la hidratación
  const [supportedIds, setSupportedIds] = useState<Set<string>>(() =>
    typeof window === 'undefined' ? new Set() : getSupportedIds()
  );
  const [active, setActive] = useState<Set<ReportCategory>>(new Set(ALL));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [focus, setFocus] = useState<{ id: string; nonce: number } | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    return subscribeReports(
      (list) => {
        setReports(list);
        setLoadError(false);
      },
      (err) => {
        console.error(err);
        setLoadError(true);
      }
    );
  }, []);

  // Abrir el formulario directo con ?accion=reportar (atajo del ícono instalado)
  useEffect(() => {
    // Se lee después de hidratar porque el HTML es estático (no conoce la URL)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (new URLSearchParams(window.location.search).get('accion') === 'reportar') setCreating(true);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const visible = useMemo(() => reports.filter((r) => active.has(r.category)), [reports, active]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of reports) c[r.category] = (c[r.category] ?? 0) + 1;
    return c;
  }, [reports]);

  const handleSupport = useCallback(async (id: string) => {
    try {
      await supportReport(id);
    } catch (e) {
      console.error(e);
    }
    setSupportedIds(getSupportedIds());
  }, []);

  async function handleCreate(input: NewReportInput, contact?: NewContactInput) {
    const created = await createReport(input, contact);
    setCreating(false);
    setActive(new Set(ALL));
    setFocus({ id: created.id, nonce: Date.now() });
    setToast('¡Gracias! Tu reclamo ya está en el mapa.');
    document.getElementById('mapa')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <main className="min-h-screen bg-ink">
      <CountdownBar />
      <Hero />

      <section id="mapa" className="relative h-[82svh] min-h-[520px] w-full overflow-hidden bg-[#e9e9e9]" aria-label="Mapa de reclamos">
        <MapView reports={visible} supportedIds={supportedIds} onSupport={handleSupport} focus={focus} />

        {/* Controles flotantes sobre el mapa */}
        <div className="pointer-events-none absolute inset-x-0 top-14 z-[450] flex flex-col items-center gap-4 px-4 sm:top-20">
          <div className="pointer-events-auto rounded-md bg-brand-red px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg">
            Total de reclamos reportados <span className="ml-2 text-sm">{reports.length}</span>
          </div>
          <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-white/10 p-2 shadow-xl ring-1 ring-black/10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 rounded-xl bg-ink px-5 py-3 font-display text-sm tracking-wide text-white hover:bg-black"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              NUEVO RECLAMO
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              aria-label="Filtrar categorías"
              className={`relative rounded-xl p-3 ring-1 ${filtersOpen ? 'bg-brand-yellow text-ink ring-brand-yellow' : 'bg-ink text-white ring-brand-yellow/60 hover:bg-black'}`}
            >
              <SlidersHorizontal className="h-5 w-5" aria-hidden />
              {active.size < ALL.length && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-brand-red ring-2 ring-white" />}
            </button>
          </div>
        </div>

        {filtersOpen && (
          <FilterPanel
            active={active}
            counts={counts}
            onToggle={(c) =>
              setActive((prev) => {
                const next = new Set(prev);
                if (next.has(c)) next.delete(c);
                else next.add(c);
                return next;
              })
            }
            onAll={(on) => setActive(new Set(on ? ALL : []))}
            onClose={() => setFiltersOpen(false)}
          />
        )}

        {loadError && (
          <p className="absolute inset-x-4 bottom-4 z-[460] rounded-xl bg-ink/90 p-3 text-center text-sm text-white">
            No pudimos cargar los reclamos. Revisá tu conexión.
          </p>
        )}
      </section>

      <Footer />

      {creating && (
        <NewReportModal
          reports={reports}
          onClose={() => setCreating(false)}
          onSubmit={handleCreate}
          onSupportExisting={(r) => {
            setCreating(false);
            handleSupport(r.id);
            setFocus({ id: r.id, nonce: Date.now() });
            setToast('Sumaste tu apoyo a ese reclamo.');
          }}
        />
      )}

      {toast && (
        <div role="status" className="fixed inset-x-4 bottom-6 z-[1100] mx-auto max-w-sm rounded-xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white shadow-2xl ring-1 ring-brand-yellow">
          {toast}
        </div>
      )}

      {isDemoMode && (
        <div className="fixed bottom-0 left-0 z-[1200] rounded-tr-lg bg-brand-red px-3 py-1 text-[11px] font-bold text-white">
          MODO DEMO · datos de ejemplo (falta configurar Firebase)
        </div>
      )}
    </main>
  );
}
