/**
 * Genera los carteles imprimibles (public/carteles/*.png), la imagen para redes (public/og.png)
 * y los íconos de la app (public/icon-192.png, public/icon-512.png).
 *
 * Volvé a correrlo cuando cambies la URL pública en src/config/ciudad.ts (el QR la usa):
 *   npx playwright install chromium   (solo la primera vez)
 *   npm run carteles
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import QRCode from 'qrcode';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { CIUDAD } = await import(pathToFileURL(path.join(root, 'src/config/ciudad.ts')).href);

const font = (pkg, file) =>
  `data:font/woff2;base64,${fs.readFileSync(path.join(root, 'node_modules', pkg, 'files', file)).toString('base64')}`;
const fontsCss = `
@font-face { font-family: 'Anton'; src: url(${font('@fontsource/anton', 'anton-latin-400-normal.woff2')}) format('woff2'); }
@font-face { font-family: 'Archivo Black'; src: url(${font('@fontsource/archivo-black', 'archivo-black-latin-400-normal.woff2')}) format('woff2'); }
@font-face { font-family: 'Inter'; font-weight: 100 900; src: url(${font('@fontsource-variable/inter', 'inter-latin-wght-normal.woff2')}) format('woff2'); }
* { margin: 0; box-sizing: border-box; }
body { font-family: 'Inter', sans-serif; }
`;

function sign(fill) {
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <g transform="rotate(45 100 100)">
      <rect x="34" y="34" width="132" height="132" rx="12" fill="#141414"/>
      <rect x="40" y="40" width="120" height="120" rx="8" fill="${fill}"/>
      <rect x="46" y="46" width="108" height="108" rx="6" fill="none" stroke="#141414" stroke-width="3"/>
    </g>
    <g fill="#141414" font-family="Anton" text-anchor="middle">
      <text x="100" y="72" font-size="25">ACÁ</text>
      <text x="100" y="99" font-size="25">FALTA</text>
      <text x="100" y="126" font-size="25">GESTIÓN</text>
    </g>
    <path d="M100 134 v18 M92 145 l8 9 l8 -9" stroke="#141414" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

const url = CIUDAD.urlPublica;
const shortUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
const qr = await QRCode.toString(url, { type: 'svg', margin: 0, color: { dark: '#141414', light: '#0000' } });

function poster(color) {
  const bg = color ? '#F4CA19' : '#FFFFFF';
  const stripe = color
    ? 'repeating-linear-gradient(-45deg,#F4CA19 0 60px,#141414 60px 120px)'
    : 'repeating-linear-gradient(-45deg,#FFFFFF 0 60px,#141414 60px 120px)';
  return `<html><head><style>${fontsCss}
    body { width: 1240px; height: 1754px; background: ${bg}; color: #141414; display: flex; flex-direction: column; }
    .stripe { height: 110px; background: ${stripe}; border-block: 8px solid #141414; }
    .main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 30px; padding: 40px 90px; text-align: center; }
    .sign { width: 820px; height: 820px; }
    h2 { font-family: 'Archivo Black'; font-size: 62px; line-height: 1.05; }
    .row { display: flex; align-items: center; gap: 46px; margin-top: 10px; }
    .qr { width: 270px; height: 270px; padding: 18px; background: #fff; border: 8px solid #141414; border-radius: 18px; }
    .qr svg { width: 100%; height: 100%; }
    .cta { text-align: left; font-size: 36px; font-weight: 700; line-height: 1.25; }
    .cta b { display: block; font-family: 'Archivo Black'; font-weight: 400; font-size: 34px; margin-top: 12px; white-space: nowrap; }
  </style></head><body>
    <div class="stripe"></div>
    <div class="main">
      <div class="sign">${sign(color ? '#F4CA19' : '#FFFFFF')}</div>
      <h2>EL MAPA DE<br>LO QUE FALTA</h2>
      <div class="row">
        <div class="qr">${qr}</div>
        <div class="cta">Este reclamo está en el mapa de ${CIUDAD.nombre}.<br>Sumá el tuyo:<b>${shortUrl}</b></div>
      </div>
    </div>
    <div class="stripe"></div>
  </body></html>`;
}

function og() {
  return `<html><head><style>${fontsCss}
    body { width: 1200px; height: 630px; background: #b5201b; color: #fff; display: flex; flex-direction: column; overflow: hidden;
      background-image: radial-gradient(rgba(0,0,0,.32) 1.4px, transparent 1.8px); background-size: 7px 7px; }
    .top { flex: 1; display: flex; align-items: center; gap: 50px; padding: 0 80px; }
    .sign { width: 360px; height: 360px; flex: none; filter: drop-shadow(0 12px 18px rgba(0,0,0,.45)); }
    h1 { font-family: 'Archivo Black'; font-size: 74px; line-height: .98; white-space: nowrap; }
    p { font-size: 34px; font-weight: 600; margin-top: 22px; }
    .stripe { height: 70px; background: repeating-linear-gradient(-45deg,#F4CA19 0 44px,#141414 44px 88px); border-top: 6px solid #141414; }
  </style></head><body>
    <div class="top"><div class="sign">${sign('#F4CA19')}</div>
      <div><h1>EL MAPA DE<br>LO QUE FALTA</h1><p>Mapa de reclamos de ${CIUDAD.nombre}</p></div></div>
    <div class="stripe"></div>
  </body></html>`;
}

function icon(size) {
  return `<html><head><style>${fontsCss} body { width:${size}px; height:${size}px; background:#141414; display:flex; align-items:center; justify-content:center; }
    .sign { width: 96%; height: 96%; }</style></head><body><div class="sign">${sign('#F4CA19')}</div></body></html>`;
}

fs.mkdirSync(path.join(root, 'public/carteles'), { recursive: true });
fs.writeFileSync(path.join(root, 'public/icon.svg'), sign('#F4CA19').replace('<svg ', '<svg width="512" height="512" '));

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage();
const jobs = [
  [poster(true), 1240, 1754, 'public/carteles/cartel-acafaltalamuni-color.png'],
  [poster(false), 1240, 1754, 'public/carteles/cartel-acafaltalamuni-bn.png'],
  [og(), 1200, 630, 'public/og.png'],
  [icon(192), 192, 192, 'public/icon-192.png'],
  [icon(512), 512, 512, 'public/icon-512.png'],
];
for (const [html, w, h, out] of jobs) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(root, out) });
  console.log('✓', out);
}
await browser.close();
