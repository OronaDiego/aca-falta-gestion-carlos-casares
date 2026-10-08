import { SignBadge } from './SignBadge';

export function Hero() {
  return (
    <header className="relative">
      {/* Fondo rojo con trama de puntos (semitono) hecho en CSS */}
      <div className="hero-halftone relative px-4 pb-28 pt-10 text-center text-white sm:pb-32 sm:pt-14">
        <h1 className="font-display text-[2.15rem] leading-[0.95] tracking-tight sm:text-6xl">
          LO QUE VEMOS
          <br />
          LO QUE FALTA
        </h1>
        <p className="mx-auto mt-6 max-w-[20rem] text-[13px] font-semibold leading-relaxed sm:max-w-md sm:text-base">
          Cada barrio ve una parte de la ciudad.
          <br />
          Marcá lo que pasa cerca tuyo. Entre todos podemos ver dónde hace falta actuar.
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
