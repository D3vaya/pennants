# Rendimiento y peso

Todas las cifras de esta página están medidas, no estimadas, y puedes reproducirlas:

- el peso en el bundle con `npm run bundle:budget` (apps de prueba de Vite compiladas contra la
  librería empaquetada). Las tablas se generan a partir de su salida JSON,
  `docs/data/bundle-sizes.json`;
- el tamaño de los archivos y la [comparación](./comparison) con `node scripts/docs-compare.ts`.

## Cuánto agrega a tu app

Cada fila es la diferencia contra una app vacía (las filas de React, contra una app de React
vacía: <Size probe="react" metric="min" /> min / <Size probe="react" /> gzip). Tamaños en
min / gzip / brotli.

<SizeTable :probes="['art-pennant', 'art-rect', 'art-all', 'name', 'url', 'fetch', 'load', 'load-shapes', 'element', 'react-pennant', 'react-pennant-circle', 'react-svg', 'react-svg-circle']" />

¹ Se generan en tu build, pero solo se descargan cuando se muestra esa bandera: un chunk por
bandera y conjunto de dibujos, más los mapas de carga.

### Hojas de estilos

<SizeTable :probes="['css', 'css-cdn', 'css-rect', 'css-rect-cdn', 'css-square', 'css-circle', 'css-mixed', 'css-default']" />

Cada hoja de estilos agrega además 27 bytes de JS de entrada. Mira
[Preguntas frecuentes: imports de assets](./faq#imports-de-assets-en-el-bundler) para
`assetsInlineLimit`; Next.js y Angular no incrustan las banderas.

En la práctica:

- Un import estático de dibujo más `renderFlag` cuesta <Size probe="art-pennant" /> con gzip para
  la primera bandera; otras formas de la misma bandera reutilizan su dibujo.
- `loadFlag` y los componentes incluyen de entrada los mapas de carga (<Size probe="load" /> con
  gzip para `loadFlag`) antes de mostrar ninguna bandera. Para unas pocas banderas conocidas, los
  imports estáticos salen más baratos; el modo fetch (<Size probe="fetch" /> con gzip) no incluye
  ningún mapa.
- En un Server Component de Next.js, `<PennantSvg>` no agrega JavaScript al cliente: se
  renderiza a HTML.

## Archivos de banderas

Medido sobre la build 0.1.0 con `node scripts/docs-compare.ts` (brotli es la suma de cada
archivo comprimido por separado).

| Conjunto                           | Sin comprimir         | Brotli             |
| ---------------------------------- | --------------------- | ------------------ |
| Los 271 SVG de banderín            | 1,16 MB               | 362 kB             |
| Los 271 SVG rect / square / circle | 1,10 / 1,11 / 1,09 MB | 335 / 336 / 332 kB |
| SVG mediano (banderín / rect)      | —                     | 525 B / 430 B      |
| SVG más pesado (`rs`, Serbia)      | 62 kB                 | 15 kB              |
| Sprite (`sprite/pennant.svg`)      | 1,15 MB               | 248 kB             |

Los PNG pesan en promedio 0,9 kB (banderín 1x), 1,6 kB (banderín 2x) y 0,6–1,0 kB (otras formas,
solo 1x). Los nombres de los países no pesan nada: los nombres ISO salen de `Intl.DisplayNames`
del propio entorno; solo se incluyen los 22 nombres que no son ISO (`gb-eng`, `asean`, ...).

El paquete de npm ocupa 2,80 MB (9,29 MB descomprimido) porque trae cuatro formas en todos los
formatos. Lo que llega a tus usuarios depende solo de lo que importes.

## Cómo funcionan los chunks diferidos

`loadFlag` contiene un mapa de `import()` dinámicos, uno por bandera y conjunto de dibujos. Los bundlers
convierten cada entrada en un chunk separado, así que:

- tu build genera un archivo pequeño por bandera y conjunto de dibujos, más los mapas, pero
- cada visitante descarga solo los chunks de las banderas que se muestran, una sola vez, y el
  navegador los guarda en caché.

`<Pennant>` y `<pennant-flag>` usan el mismo cargador y comparten una caché en memoria: una
bandera que aparece muchas veces se descarga y se procesa una sola vez.

## Cómo mantener el bundle mínimo

- Importa solo lo que usas: `import { getPennantName } from 'pennants'` no arrastra ninguna
  bandera.
- Para un conjunto fijo y pequeño de banderas, usa imports estáticos por bandera. Usa
  `loadFlag` o los componentes cuando la bandera se decide en tiempo de ejecución y el
  conjunto es grande.
- Evita `import * as flags` o armar un objeto con todos los módulos: eso mete las 271 en el
  bundle.
- No recorras `codes` llamando a `loadFlag` para mostrar una lista larga; para eso están las
  clases CSS o `<img>`.
- Con Vite, SvelteKit o Astro, usa una hoja de estilos `/cdn` o configura `assetsInlineLimit`
  para que el CSS no incruste todas las banderas.

## ¿CDN o archivos propios?

|                | jsDelivr (por defecto en `pennantUrl`)    | Archivos propios (opción `base`)     |
| -------------- | ----------------------------------------- | ------------------------------------ |
| Configuración  | Ninguna                                   | Copiar `svg/` y `png/` a tu servidor |
| Disponibilidad | Depende de un tercero                     | La misma que tu sitio                |
| Privacidad     | Las peticiones van a jsDelivr             | Sin terceros                         |
| CSP            | Permitir `cdn.jsdelivr.net` en `img-src`  | `img-src 'self'`                     |
| Caché          | URLs con versión, caché de larga duración | Según tus cabeceras de caché         |

`pennantUrl` usa por defecto una base con la versión fijada (`DEFAULT_CDN_BASE`), así que las
URLs coinciden siempre con la versión instalada. Para servir los archivos tú mismo:
`pennantUrl(código, { base: '/assets/pennants' })`.
