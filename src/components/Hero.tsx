import { SignBadge } from './SignBadge';

export function Hero() {
  return (
    <header className="relative z-10">
      {/* Fondo rojo con trama de puntos (semitono) hecho en CSS */}
      <div className="hero-halftone relative px-4 pb-28 pt-10 text-center text-white sm:pb-32 sm:pt-14 md:flex md:min-h-[min(40vw,640px)] md:flex-col md:justify-center">
        <h1 className="font-display text-[2.15rem] leading-[0.95] tracking-tight sm:text-6xl">
          EL MAPA DE 
          <br />
          LO QUE FALTA
        </h1>
        <p className="mx-auto mt-6 max-w-[20rem] sm:text-[20px] font-semibold leading-relaxed sm:max-w-md sm:text-base">
          Cada barrio tiene algo para contar
          <span className="mt-1 block text-[11px] sm:text-[14px]">
            Marcá lo que pasa cerca tuyo. Entre todos podemos ver dónde hace falta gestión.
          </span>
        </p>
      </div>

      {/* Cinta de obra con el cartel encima */}
      <div className="relative">
        <div className="hazard-stripe h-14 sm:h-16" aria-hidden="true" />
        <SignBadge className="sign-wobble absolute left-1/2 top-1/2 z-10 h-36 w-36 drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)] sm:h-44 sm:w-44" />
      </div>
    </header>
  );
}
