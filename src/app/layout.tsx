import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import '@fontsource/archivo-black';
import '@fontsource/anton';
import './globals.css';
import { CIUDAD } from '@/config/ciudad';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';
const title = `Acá falta la muni — Mapa de reclamos urbanos en ${CIUDAD.nombre}`;
const description = `Mapa interactivo de reclamos urbanos en ${CIUDAD.nombre}. Reportá lo que falta en tu barrio y ayudá a construir una mejor ciudad.`;

export const metadata: Metadata = {
  metadataBase: new URL(CIUDAD.urlPublica),
  title,
  description,
  openGraph: {
    title,
    description,
    url: CIUDAD.urlPublica,
    siteName: 'Acá falta la muni',
    locale: 'es_AR',
    type: 'website',
    images: [{ url: `${BASE}/og.png`, width: 1200, height: 630, alt: `Mapa de reclamos urbanos de ${CIUDAD.nombre}` }],
  },
  twitter: { card: 'summary_large_image', title, description, images: [`${BASE}/og.png`] },
  manifest: `${BASE}/manifest.json`,
  icons: { icon: `${BASE}/icon.svg`, apple: `${BASE}/icon-192.png` },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#141414',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('${BASE}/sw.js').catch(function(){});});}`,
          }}
        />
      </body>
    </html>
  );
}
