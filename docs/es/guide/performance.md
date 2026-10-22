# Rendimiento y peso

Medido sobre la build 0.1.0 con size-limit (minificado, brotli). Las cifras incluyen todas las
dependencias de cada import.

| Import                                     | Peso    |
| ------------------------------------------ | ------- |
| `import { isPennantCode } from 'pennants'` | 449 B   |
| API base de `pennants`, con `loadPennant`  | 1,48 kB |
| `pennants/react`                           | 2,76 kB |
| `pennants/element`                         | 2,98 kB |
| Un módulo de bandera (`pennants/flags/ar`) | 962 B   |
| `pennants/css`                             | 930 B   |

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

`loadPennant` contiene un mapa de 271 `import()` dinámicos, uno por bandera. Los bundlers
convierten cada uno en un chunk separado, así que:

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
- Con Vite, evita que los SVG que usa `pennants/css` se incrusten en tu CSS. Mira
  [Preguntas frecuentes: imports de assets](./faq#imports-de-assets-en-el-bundler).

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
