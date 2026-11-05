# Referencia de la API

La referencia se genera automáticamente con TypeDoc a partir de los comentarios del código
fuente, por eso está en inglés:

- [`pennants`](/api/): API principal (`loadFlag`, `renderFlag`, `getPennantName`, `pennantUrl`,
  `codes`, ...).
- [`pennants/fetch`](/api/fetch): `fetchPennant`, para cargar las banderas por HTTP en lugar de
  incluir el mapa de carga.
- [`pennants/react`](/api/react): componentes `<Pennant>` y `<PennantSvg>`.
- [`pennants/react/static`](/api/react/static): entrada de React segura para el servidor.
- [`pennants/element`](/api/element): el Web Component `<pennant-flag>`.

## Resumen

| Export                            | Qué hace                                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `codes`, `isoCodes`               | Todos los códigos soportados y el subconjunto ISO 3166-1.                                                          |
| `isPennantCode(valor)`            | Type guard exacto (minúsculas).                                                                                    |
| `toPennantCode(valor)`            | Normaliza la entrada del usuario; lanza `RangeError` si el código no existe.                                       |
| `loadFlag(código, opciones?)`     | Devuelve el SVG como `Promise<string>`; cada bandera es un chunk aparte. `loadPennant` es un alias.                |
| `renderFlag(arte, opciones?)`     | SVG síncrono a partir de un módulo `pennants/art/<set>/<código>`.                                                  |
| `loadArt(código, set?)`           | Carga solo el dibujo (`{ code, viewBox, content }`) de una bandera.                                                |
| `fetchPennant(código, opciones?)` | Descarga el SVG por HTTP y lo sanea (en `pennants/fetch`).                                                         |
| `getPennantName(código, locale?)` | Nombre traducido con `Intl.DisplayNames`.                                                                          |
| `pennantUrl(código, opciones?)`   | URL del archivo estático (`shape`, `format` `svg` o `png`, `scale` 1 o 2, `base`). PNG solo existe para `pennant`. |
| `SHAPES`, `isShape`, `toShape`    | Las formas (`pennant`, `rect`, `square`, `circle`) y su validación.                                                |
| `SHAPE_SIZE`, `SHAPE_ART`         | Tamaño intrínseco de cada forma y qué set de dibujo usa (`1x1` o `4x3`).                                           |
| `toDataUri(svg)`                  | Convierte el SVG en una URI `data:`.                                                                               |
| `toEmoji(código)`                 | Emoji de la bandera, o `''` si no existe.                                                                          |
| `PENNANT_WIDTH`, `PENNANT_HEIGHT` | `66` y `72`.                                                                                                       |
| `DEFAULT_CDN_BASE`                | URL de jsDelivr con la versión instalada.                                                                          |
