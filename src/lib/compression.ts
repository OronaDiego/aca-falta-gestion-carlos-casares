/**
 * Comprime una foto en el navegador (canvas) y la devuelve como data URL WebP/JPEG.
 * Se achica hasta quedar por debajo de `maxBytes`, porque Firestore admite
 * documentos de hasta 1 MB y la regla de seguridad limita la foto a ~700 KB.
 */
// Las fotos de celulares modernos (48–200 MP) pueden pesar 10–20 MB; igual se achican a < 700 KB antes de subir.
export const MAX_INPUT_BYTES = 25 * 1024 * 1024;
const MAX_OUTPUT_CHARS = 700_000;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen.'));
    };
    img.src = url;
  });
}

export async function compressImage(file: File): Promise<string> {
  // Algunos Android no informan el tipo (file.type vacío): en ese caso intentamos abrirla igual
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('El archivo tiene que ser una foto.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('La foto pesa más de 25 MB. Probá con otra o sacala con menos resolución.');
  }

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    const isHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
    throw new Error(
      isHeic
        ? 'Este navegador no puede abrir fotos HEIC. En la cámara elegí "Más compatible" (JPG) o mandá una captura de pantalla.'
        : 'No se pudo abrir la foto. Probá con otra.'
    );
  }
  const attempts: [number, number][] = [
    [1280, 0.72],
    [1024, 0.68],
    [880, 0.62],
    [720, 0.55],
  ];

  for (const [maxDim, quality] of attempts) {
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) break;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    let data = canvas.toDataURL('image/webp', quality);
    if (!data.startsWith('data:image/webp')) data = canvas.toDataURL('image/jpeg', quality);
    if (data.length <= MAX_OUTPUT_CHARS) return data;
  }
  throw new Error('No pudimos achicar la foto lo suficiente. Probá con otra.');
}
