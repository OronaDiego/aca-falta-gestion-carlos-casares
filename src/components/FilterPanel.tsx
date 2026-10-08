'use client';

import { CATEGORIAS_ORDENADAS } from '@/config/ciudad';
import { CategoryIcon } from './CategoryIcon';
import type { ReportCategory } from '@/types/report';

interface FilterPanelProps {
  active: Set<ReportCategory>;
  counts: Record<string, number>;
  onToggle: (c: ReportCategory) => void;
  onAll: (on: boolean) => void;
  onClose: () => void;
}

export function FilterPanel({ active, counts, onToggle, onAll, onClose }: FilterPanelProps) {
  const allOn = active.size === CATEGORIAS_ORDENADAS.length;
  return (
    <div
      className="absolute inset-x-3 bottom-3 top-[7.5rem] z-[500] flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink/95 p-4 shadow-2xl backdrop-blur sm:inset-x-auto sm:left-1/2 sm:w-[26rem] sm:-translate-x-1/2"
      role="dialog"
      aria-label="Filtrar por categoría"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onAll(!allOn)}
          className="text-xs font-semibold uppercase tracking-wider text-neutral-300 underline-offset-4 hover:underline"
        >
          {allOn ? 'Ocultar todas' : 'Mostrar todas'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/15 px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/10"
        >
          Listo
        </button>
      </div>
      <ul className="flex flex-col gap-2 overflow-y-auto pr-1">
        {CATEGORIAS_ORDENADAS.map((c) => {
          const on = active.has(c.id);
          return (
            <li key={c.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onToggle(c.id)}
                title={c.description}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left font-display text-[13px] tracking-wide transition-colors ${
                  on ? 'bg-brand-yellow-dark text-ink' : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                }`}
              >
                <CategoryIcon category={c.id} className="h-5 w-5 shrink-0" />
                <span className="flex-1 uppercase">{c.name}</span>
                <span className="font-sans text-xs font-bold opacity-70">{counts[c.id] ?? 0}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
