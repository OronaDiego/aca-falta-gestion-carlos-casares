/**
 * Mapa base: teselas estándar de OpenStreetMap (gratis, sin clave; se exige la atribución).
 * Se muestran en escala de grises con CSS (.leaflet-tile-pane en globals.css) para el look claro.
 * Política de uso: https://operations.osmfoundation.org/policies/tiles/
 */
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
