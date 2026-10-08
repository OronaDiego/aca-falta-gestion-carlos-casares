interface SignBadgeProps {
  className?: string;
  /** 'color' = amarillo vial; 'bn' = blanco y negro (para imprimir barato) */
  variant?: 'color' | 'bn';
  title?: string;
}

/**
 * Cartel de obra en rombo "ACÁ FALTA LA MUNI ↓". Dibujado en SVG propio
 * (no es una imagen de terceros), así escala nítido en pantalla y en impresión.
 */
export function SignBadge({ className, variant = 'color', title = 'Acá falta la muni' }: SignBadgeProps) {
  const fill = variant === 'color' ? '#F4CA19' : '#FFFFFF';
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id={`sign-shine-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={variant === 'color' ? 0.28 : 0} />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity={variant === 'color' ? 0.12 : 0} />
        </linearGradient>
      </defs>
      <g transform="rotate(45 100 100)">
        <rect x="34" y="34" width="132" height="132" rx="12" fill="#141414" />
        <rect x="40" y="40" width="120" height="120" rx="8" fill={fill} />
        <rect x="40" y="40" width="120" height="120" rx="8" fill={`url(#sign-shine-${variant})`} />
        <rect x="46" y="46" width="108" height="108" rx="6" fill="none" stroke="#141414" strokeWidth="3" />
      </g>
      <g fill="#141414" fontFamily="var(--font-sign), 'Anton', Impact, sans-serif" textAnchor="middle">
        <text x="100" y="72" fontSize="25" letterSpacing="0.5">ACÁ</text>
        <text x="100" y="99" fontSize="25" letterSpacing="0.5">FALTA</text>
        <text x="100" y="126" fontSize="25" letterSpacing="0.5">LA MUNI</text>
      </g>
      <path d="M100 134 v18 M92 145 l8 9 l8 -9" stroke="#141414" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
