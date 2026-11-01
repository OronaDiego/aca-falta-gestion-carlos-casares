import { CIUDAD } from '@/config/ciudad';

function shareLinks() {
  const url = encodeURIComponent(CIUDAD.urlPublica);
  const text = encodeURIComponent(`Acá falta gestión — marcá en el mapa lo que falta en ${CIUDAD.nombre}`);
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    x: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
  };
}

const icon = 'h-6 w-6 fill-current';

export function Footer() {
  const links = shareLinks();
  return (
    <footer className="bg-brand-yellow px-4 pb-10 pt-8 text-center text-ink">
      <p className="text-[15px] font-bold">Compartí el mapa en tus redes:</p>
      <div className="mt-3 flex justify-center gap-7">
        <a href={links.facebook} target="_blank" rel="noopener noreferrer" aria-label="Compartir en Facebook" className="hover:opacity-70">
          <svg viewBox="0 0 24 24" className={icon} aria-hidden>
            <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07" />
          </svg>
        </a>
        <a href={links.x} target="_blank" rel="noopener noreferrer" aria-label="Compartir en X" className="hover:opacity-70">
          <svg viewBox="0 0 24 24" className={icon} aria-hidden>
            <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.63 7.58H.48l8.6-9.83L0 1.15h7.59l5.24 6.93zm-1.3 19.5h2.04L6.48 3.24H4.3z" />
          </svg>
        </a>
        <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="Compartir por WhatsApp" className="hover:opacity-70">
          <svg viewBox="0 0 24 24" className={icon} aria-hidden>
            <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.27.49 1.7.63.72.23 1.37.2 1.88.12.58-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88a9.82 9.82 0 0 1 6.99 2.9 9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.81 11.81 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9a11.82 11.82 0 0 0-3.48-8.41" />
          </svg>
        </a>
        {CIUDAD.instagram && (
          <a href={CIUDAD.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:opacity-70">
            <svg viewBox="0 0 24 24" className={icon} aria-hidden>
              <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.7 21.31.27 16.95.07 15.67.01 15.26 0 12 0m0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8m6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88" />
            </svg>
          </a>
        )}
      </div>

      <p className="mx-auto mt-8 max-w-md text-[11px] leading-relaxed text-ink/70">
        Aplicación realizada por UNIDOS POR CASARES<br/>Desarrolladores: Diego Orona | Emmanuel Macías<br/>Basado en el software libre «Acá Falta la Muni» de Pablo Benavides
        (AGPL-3.0) ·{' '}
        <a href={CIUDAD.codigoFuente} target="_blank" rel="noopener noreferrer" className="underline">
          código fuente
        </a>
      </p>
    </footer>
  );
}
