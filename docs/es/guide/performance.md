# Rendimiento y peso

Dos maneras de ver el mismo costo: cuánto pesa el código de la librería por sí solo y cuánto
agrega a una app real después de pasar por el bundler.

## Código de la librería

Medido sobre la build 0.1.0 con size-limit (minificado, brotli), incluyendo todas las
dependencias de cada import.

| Import                                     | Peso    |
| ------------------------------------------ | ------- |
| `import { isPennantCode } from 'pennants'` | 449 B   |
| API base de `pennants`, con `loadPennant`  | 1,48 kB |
| `pennants/react`                           | 2,76 kB |
| `pennants/element`                         | 2,98 kB |
| Un módulo de bandera (`pennants/flags/ar`) | 962 B   |
| `pennants/css`                             | 930 B   |

## En una app real

Lo que se agrega a una build de producción vacía de Vite 8, sin comprimir / gzip. Incluye el
código del bundler para módulos y carga de chunks, por eso es más que las cifras anteriores.

| Qué usas                                   | JS de entrada (sin comprimir / gzip) | Archivos extra                |
| ------------------------------------------ | ------------------------------------ | ----------------------------- |
| Solo `pennantUrl`                          | 2,0 / 0,8 kB                         |                               |
| Solo `getPennantName`                      | 2,6 / 1,1 kB                         |                               |
| Un módulo de bandera (`pennants/flags/ar`) | 3,2 / 1,0 kB                         |                               |
| Tres módulos de bandera                    | 8,1 / 2,2 kB                         |                               |
| `loadPennant`                              | 15,4 / 5,1 kB                        | un chunk por bandera mostrada |
| `pennants/element/register`                | 19,5 / 7,0 kB                        | un chunk por bandera mostrada |
| React `<Pennant>` (sobre `react-dom`)      | 18,5 / 6,9 kB                        | un chunk por bandera mostrada |
| React `<PennantSvg svg={ar}>`              | 21,8 / 8,0 kB                        |                               |
| `pennants/css/pennants.min.css`            | CSS 14,8 / 3,7 kB ¹                  | 271 SVG, se cargan al usarse  |

¹ Con `assetsInlineLimit` como en las [preguntas frecuentes](./faq#imports-de-assets-en-el-bundler).
Con la configuración por defecto de Vite las banderas se incrustan y el CSS pesa 388 kB sin
comprimir / 56 kB con gzip. Next.js 16 y Angular 22 no las incrustan: su CSS ocupa 15–16 kB sin
comprimir.

En un Server Component de Next.js, `<PennantSvg>` no agrega JavaScript al cliente.

## Banderas

- Bandera mediana: alrededor de 1,2 kB sin comprimir y 0,5 kB con brotli. La más pesada, `rs`
  (Serbia), ocupa 60 kB sin comprimir.
- Los 271 SVG: 1,2 MB sin comprimir, unos 370 kB con brotli.
- PNG: en promedio unos 0,9 kB por archivo 1x y 1,6 kB por archivo 2x.
- Los nombres de los países no pesan nada: los nombres ISO salen de `Intl.DisplayNames` del
  propio entorno. Solo se incluyen los 22 nombres que no son ISO (`gb-eng`, `asean`, ...).

El paquete de npm ocupa 1,5 MB (4,1 MB descomprimido) porque trae todos los formatos. Lo que
llega a tus usuarios depende solo de lo que importes.

## Cómo funcionan los chunks diferidos

`loadPennant` contiene un mapa de 271 `import()` dinámicos, uno por bandera; ese mapa es casi
todo su peso de 5 kB. Los bundlers convierten cada entrada en un chunk separado, así que:

- tu build genera 271 archivos pequeños, pero
- cada visitante descarga solo los chunks de las banderas que se muestran, una sola vez, y el
  navegador los guarda en caché.

`<Pennant>` y `<pennant-flag>` usan el mismo cargador y comparten una caché en memoria: una
bandera que aparece muchas veces se descarga y se procesa una sola vez.

## Cómo mantener el bundle mínimo

- Importa solo lo que usas: `import { getPennantName } from 'pennants'` no arrastra ninguna
  bandera.
- Para un conjunto fijo y pequeño de banderas, usa imports estáticos por bandera; si la bandera
  se decide en tiempo de ejecución, usa `loadPennant` o los componentes.
- Evita `import * as flags` o armar un objeto con todos los módulos: eso mete las 271 en el
  bundle.
- No recorras `codes` llamando a `loadPennant` para mostrar una lista larga; para eso están las
  clases CSS o `<img>`.
- Con Vite, SvelteKit o Astro, evita que los SVG que usa el CSS se incrusten (388 kB en lugar
  de 15 kB). Mira [Preguntas frecuentes: imports de assets](./faq#imports-de-assets-en-el-bundler).
- Para unas pocas banderas conocidas, los imports estáticos por bandera (≈0,6–1 kB con gzip cada
  uno) salen más baratos que `loadPennant` (≈5 kB del mapa de carga).

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
