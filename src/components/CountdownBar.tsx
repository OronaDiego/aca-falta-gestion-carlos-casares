'use client';

import { useEffect, useState } from 'react';
import { CUENTA_REGRESIVA } from '@/config/ciudad';
import { daysUntil } from '@/lib/geo-utils';

export function CountdownBar() {
  // Se calcula en el cliente para que el número no quede "congelado" en el HTML estático
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setDays(daysUntil(CUENTA_REGRESIVA.fechaObjetivo));
    update();
    const t = setInterval(update, 60 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-brand-yellow text-ink">
      <p className="mx-auto flex max-w-5xl items-baseline justify-center gap-1.5 whitespace-nowrap px-3 py-6 text-center text-[13px] min-[400px]:text-sm sm:gap-2 sm:text-lg">
        <strong className="font-extrabold tracking-wide">FALTAN {days ?? '—'}</strong>
        <span className="font-light tracking-wide">{CUENTA_REGRESIVA.texto}</span>
      </p>
    </div>
  );
}
