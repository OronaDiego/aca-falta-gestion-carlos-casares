# Acá falta gestión — Carlos Casares

Mapa colaborativo de reclamos urbanos del Partido de Carlos Casares (Buenos Aires). Los vecinos marcan en el mapa lo que falta, como baches, luminarias apagadas o basurales, con foto y ubicación. Cada reclamo queda público con los días que lleva sin solución.

Está basado en el proyecto libre [Acá Falta la Muni — Osorno](https://github.com/elpabloultron/aca-falta-la-muni-osorno) de Pablo Benavides Jorquera (AGPL-3.0). La interfaz se rehízo para Carlos Casares.

## Qué hace

- **Portada:** cinta con cuenta regresiva, hero con el cartel "Acá falta gestión", mapa y pie con carteles para imprimir y botones para compartir.
- **Mapa:** marcadores en rombo por categoría. Los reclamos cercanos se agrupan con un contador (amarillo = 1, naranja = 2 a 9, rojo = 10 o más).
- **Nuevo reclamo:** descripción, categoría, foto obligatoria (se comprime en el teléfono), "ya lo reclamé antes", ubicación por dirección, GPS o tocando el mapa, y contacto opcional (no se publica).
- **Duplicados:** si ya hay un reclamo igual a menos de 35 m, ofrece apoyarlo (+1) en lugar de crear otro.
- **Filtros** por categoría.
- **Funciona offline:** la app se instala como PWA y guarda en caché las teselas del mapa y los datos.
- **Modo demo:** sin Firebase configurado, arranca con datos de ejemplo. Sirve para trabajar el diseño.

## Tecnologías

| Parte | Tecnología |
| --- | --- |
| Web | Next.js 16 (exportación estática), React 19, TypeScript |
| Estilos | Tailwind CSS 4, tipografías Archivo Black, Anton e Inter (incluidas en el proyecto) |
| Mapa | Leaflet + teselas de OpenStreetMap en escala de grises |
| Direcciones | Nominatim (OpenStreetMap), sin clave |
| Base de datos | Firebase Cloud Firestore, protegida con `firestore.rules` |
| Hosting | Firebase Hosting (también sirve cualquier hosting estático) |

## Levantarlo en tu PC

Requisitos: Node.js 22.6 o superior.

```bash
npm install
npm run dev
```

Abrí http://localhost:3000. Sin `.env.local` la app arranca en **modo demo**, con un cartel rojo abajo a la izquierda.

Otros comandos:

```bash
npm test           # pruebas de lógica, y que la config coincida con firestore.rules
npm run build      # genera el sitio estático en /out
npm run carteles   # regenera carteles, imagen para redes e íconos (antes: npx playwright install chromium)
npm run test:reglas  # prueba las reglas de seguridad en el emulador (requiere Java)
```

## Conectar Firebase

1. Creá un proyecto en https://console.firebase.google.com. El plan gratuito Spark alcanza.
2. En **Firestore Database**, creá la base en modo producción. Para la ubicación, `southamerica-east1` (São Paulo).
3. En **Configuración del proyecto → Tus apps**, agregá una app web y copiá los valores en `.env.local` siguiendo `.env.example`.
4. Instalá la CLI y publicá las reglas:
   ```bash
   npx firebase login
   npx firebase use --add        # elegí el proyecto
   npx firebase deploy --only firestore:rules
   ```
5. Para publicar el sitio:
   ```bash
   npm run build
   npx firebase deploy --only hosting
   ```

## Configurar la ciudad

Todo lo propio de Carlos Casares está en **`src/config/ciudad.ts`**:

- `CIUDAD.urlPublica`: el dominio final. Después de cambiarlo, corré `npm run carteles` para actualizar el QR de los carteles.
- `CIUDAD.emailContacto`: el mail para consultas y pedidos de baja de datos. **Completar antes de publicar.**
- `CIUDAD.instagram`: el perfil de Instagram. Si queda vacío, el ícono no aparece.
- `CIUDAD.codigoFuente`: la URL del repositorio de ustedes (la licencia AGPL obliga a ofrecer el código).
- `CUENTA_REGRESIVA.fechaObjetivo`: la fecha de la elección. **Confirmar antes de publicar.**
- `LUGARES`: barrios y localidades. Sirven para asignar automáticamente el sector de cada reclamo. Pueden sumar barrios de la ciudad con su coordenada aproximada.
- `CATEGORIAS`: las categorías. Si agregan una, súmenla también a `validCategory` en `firestore.rules` (`npm test` avisa si no coinciden).

Si cambian `LIMITES_PARTIDO`, actualicen el rectángulo `insidePartido` en `firestore.rules`.

## Moderación

Desde la web solo se puede **crear** reclamos y **sumar apoyos de a uno**. Lo demás se hace desde la consola de Firebase, en Firestore → colección `reports`:

- **Ocultar** un reclamo (spam o contenido inapropiado): `is_hidden` = `true`.
- **Marcar resuelto**: `status` = `resuelto` y `resolved_at` con la fecha.
- **Fotos**: están en la colección `photos`, con el mismo id que el reclamo. El mapa las baja recién cuando alguien abre un reclamo.
- **Ver contactos**: colección `contacts`. El id del documento es el id del reclamo. Desde la web no se pueden leer.

## Datos personales

Nombre, apellido y teléfono son opcionales y se guardan en una colección privada. Según la Ley 25.326, tienen que poder borrarlos si alguien lo pide, y conviene publicar un mail de contacto para eso.

## Próximos pasos sugeridos

- **Firebase App Check** (reCAPTCHA Enterprise, invisible) para frenar envíos automatizados.
- **Panel de administración** con login para moderar sin entrar a la consola.
- **Fotos en Firebase Storage** en vez de dentro del documento, si el volumen crece. Requiere el plan Blaze.
- Sumar barrios de la ciudad a `LUGARES`.

## Licencia

GNU AGPL-3.0 o posterior (ver `LICENSE`). Si publican una versión modificada, tienen que ofrecer su código fuente a los usuarios. El pie del sitio ya tiene el enlace.
