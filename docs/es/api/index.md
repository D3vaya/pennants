# Referencia de la API

La referencia se genera automáticamente con TypeDoc a partir de los comentarios del código
fuente, por eso está en inglés:

- [`pennants`](/api/): API principal (`loadPennant`, `getPennantName`, `pennantUrl`, `codes`,
  ...).
- [`pennants/react`](/api/react): componentes `<Pennant>` y `<PennantSvg>`.
- [`pennants/element`](/api/element): el Web Component `<pennant-flag>`.

## Resumen

| Export                            | Qué hace                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `codes`, `isoCodes`               | Todos los códigos soportados y el subconjunto ISO 3166-1.                    |
| `isPennantCode(valor)`            | Type guard exacto (minúsculas).                                              |
| `toPennantCode(valor)`            | Normaliza la entrada del usuario; lanza `RangeError` si el código no existe. |
| `loadPennant(código)`             | Devuelve el SVG como `Promise<string>`; cada bandera es un chunk aparte.     |
| `getPennantName(código, locale?)` | Nombre traducido con `Intl.DisplayNames`.                                    |
| `pennantUrl(código, opciones?)`   | URL del archivo estático (`svg` o `png`, `scale` 1 o 2, `base`).             |
| `toDataUri(svg)`                  | Convierte el SVG en una URI `data:`.                                         |
| `toEmoji(código)`                 | Emoji de la bandera, o `''` si no existe.                                    |
| `PENNANT_WIDTH`, `PENNANT_HEIGHT` | `66` y `72`.                                                                 |
| `DEFAULT_CDN_BASE`                | URL de jsDelivr con la versión instalada.                                    |
