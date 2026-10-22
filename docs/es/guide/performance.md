# Rendimiento y peso

Todas las cifras de esta página están medidas, no estimadas, y puedes reproducirlas:

- el peso en el bundle con `npm run bundle:budget` (apps de prueba de Vite compiladas contra la
  librería empaquetada),
- el tamaño de los archivos y la [comparación](./comparison) con `node scripts/docs-compare.ts`.

## Cuánto agrega a tu app

Build de producción con Vite 8.3.5. Cada fila es la diferencia contra una app vacía (las filas
de React, contra una app de React vacía: 219,5 kB min / 67,7 kB gzip). Tamaños en
min / gzip / brotli.

| Qué usas                                   | JS de entrada                | CSS                             | Archivos JS diferidos ¹ |
| ------------------------------------------ | ---------------------------- | ------------------------------- | ----------------------- |
| `pennantUrl`                               | +2,0 kB / +801 B / +586 B    |                                 | 0                       |
| `getPennantName`                           | +2,6 kB / +1,1 kB / +840 B   |                                 | 0                       |
| Un módulo de bandera (`pennants/flags/ar`) | +3,2 kB / +1,0 kB / +933 B   |                                 | 0                       |
| `loadPennant`                              | +15,4 kB / +5,1 kB / +3,8 kB |                                 | 271                     |
| `pennants/element/register`                | +19,6 kB / +7,0 kB / +5,3 kB |                                 | 271                     |
| React `<Pennant>`                          | +18,5 kB / +6,9 kB / +5,0 kB |                                 | 271                     |
| React `<PennantSvg>` con una bandera       | +21,8 kB / +8,0 kB / +5,9 kB |                                 | 270                     |
| CSS, con `assetsInlineLimit` ²             | +27 B                        | +14,8 kB / +3,7 kB / +2,7 kB    | 0                       |
| CSS, `pennants/css/cdn`                    | +27 B                        | +23,2 kB / +1,9 kB / +1,1 kB    | 0                       |
| CSS, configuración por defecto de Vite     | +27 B                        | +372,4 kB / +52,0 kB / +42,9 kB | 0                       |

¹ Se generan en tu build, pero solo se descargan cuando se muestra esa bandera.
² Mira [Preguntas frecuentes: imports de assets](./faq#imports-de-assets-en-el-bundler).
Next.js 16 y Angular 22 no incrustan las banderas; su CSS ocupa 15–16 kB min.

En la práctica:

- Un import estático cuesta alrededor de 1 kB con gzip por bandera, sin costo fijo de runtime.
- `loadPennant` y los componentes incluyen un mapa de carga de 271 entradas con nombres de chunk
  con hash, unos 5 kB con gzip, antes de mostrar ninguna bandera. Para unas pocas banderas
  conocidas, los imports estáticos salen más baratos.
- En un Server Component de Next.js, `<PennantSvg>` no agrega JavaScript al cliente: se
  renderiza a HTML.

## Archivos de banderas

| Conjunto                       | Sin comprimir | Brotli (suma de archivos) |
| ------------------------------ | ------------- | ------------------------- |
| Los 271 SVG (`svg/`)           | 1,2 MB        | ≈370 kB                   |
| SVG mediano                    | 1,2 kB        | ≈530 B                    |
| SVG más pesado (`rs`, Serbia)  | 60 kB         | ≈14 kB                    |
| Sprite (`sprite/pennants.svg`) | 1,2 MB        | ≈260 kB                   |

Los PNG pesan en promedio unos 0,9 kB (1x) y 1,6 kB (2x). Los nombres de los países no pesan
nada: los nombres ISO salen de `Intl.DisplayNames` del propio entorno; solo se incluyen los 22
nombres que no son ISO (`gb-eng`, `asean`, ...).

El paquete de npm ocupa alrededor de 1,6 MB porque trae todos los formatos. Lo que llega a tus
usuarios depende solo de lo que importes.

## Cómo funcionan los chunks diferidos

`loadPennant` contiene un mapa de 271 `import()` dinámicos, uno por bandera. Los bundlers
convierten cada entrada en un chunk separado, así que:

- tu build genera 271 archivos pequeños, pero
- cada visitante descarga solo los chunks de las banderas que se muestran, una sola vez, y el
  navegador los guarda en caché.

`<Pennant>` y `<pennant-flag>` usan el mismo cargador y comparten una caché en memoria: una
bandera que aparece muchas veces se descarga y se procesa una sola vez.

## Cómo mantener el bundle mínimo

- Importa solo lo que usas: `import { getPennantName } from 'pennants'` no arrastra ninguna
  bandera.
- Para un conjunto fijo y pequeño de banderas, usa imports estáticos por bandera. Usa
  `loadPennant` o los componentes cuando la bandera se decide en tiempo de ejecución y el
  conjunto es grande.
- Evita `import * as flags` o armar un objeto con todos los módulos: eso mete las 271 en el
  bundle.
- No recorras `codes` llamando a `loadPennant` para mostrar una lista larga; para eso están las
  clases CSS o `<img>`.
- Con Vite, SvelteKit o Astro, configura `assetsInlineLimit` para que el CSS no incruste todas
  las banderas.

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
