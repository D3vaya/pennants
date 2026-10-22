# Comparación

Cómo se compara `pennants` con [flag-icons](https://github.com/lipis/flag-icons) (de donde
salen sus banderas) y con
[country-flag-icons](https://gitlab.com/catamphetamine/country-flag-icons). Los tres tienen
licencia MIT.

## Tamaños medidos

pennants 0.1.0, flag-icons 7.6.0, country-flag-icons 1.6.20. Los tamaños comprimidos son la suma
de cada archivo por separado, porque cada uno se sirve por su cuenta (zlib de Node, brotli
calidad 11, gzip nivel 9). Para reproducirlos:

```sh
npm run build && node scripts/docs-compare.ts
```

|                                              | pennants                    | flag-icons                      | country-flag-icons           |
| -------------------------------------------- | --------------------------- | ------------------------------- | ---------------------------- |
| Banderas                                     | 271                         | 271                             | 265                          |
| Todos los SVG, sin comprimir / gzip / brotli | 1,21 MB / 432 kB / 375 kB   | 1,93 MB / 647 kB / 561 kB (4x3) | 178 kB / 89 kB / 81 kB (3x2) |
| SVG mediano, brotli                          | 525 B                       | 356 B                           | 253 B                        |
| CSS completo, sin comprimir / gzip / brotli  | 12,2 kB / 1,8 kB / 1,0 kB ¹ | 28,0 kB / 2,4 kB / 1,5 kB ¹     | 201 kB / 48 kB / 40 kB ²     |
| Un módulo de bandera (`ar`), brotli          | 1,0 kB                      | —                               | 0,2 kB                       |
| Paquete de npm, comprimido / descomprimido   | 1,64 MB / 4,44 MB           | 1,08 MB / 3,99 MB               | 1,12 MB / 5,79 MB            |

¹ Referencia un archivo SVG por bandera; las imágenes se cargan solo cuando se usa la clase.
² Incluye todas las banderas como data URI.

## Dónde pierde pennants

- **Peso por bandera frente a country-flag-icons.** country-flag-icons simplifica escudos y
  emblemas; su módulo `ar` pesa alrededor de una quinta parte del nuestro, y todos sus SVG
  juntos, menos de una cuarta parte. Si necesitas banderas rectangulares pequeñas y no te
  importan los emblemas detallados, es la opción más liviana.
- **Tamaño mediano de archivo.** Cada banderín lleva el marco (recorte, degradado de la barra,
  borde), así que las banderas simples pesan más que los rectángulos de los otros dos paquetes.
- **Forma.** Hay una sola forma: el banderín. flag-icons trae rectángulos 4:3 y 1:1, y
  country-flag-icons 3:2 y 1:1. Si tu diseño necesita rectángulos, usa uno de ellos.
- **Tamaño del paquete.** pennants incluye más formatos (PNG, sprite, módulos JS), así que la
  descarga de npm es más grande. Eso no cambia lo que descargan tus usuarios.
- **Costo del cargador.** El cargador diferido (`loadPennant`, los componentes) agrega de entrada
  unos 5 kB con gzip por su mapa de 271 entradas. country-flag-icons no tiene cargador diferido:
  las banderas se importan de forma estática.

## Dónde gana pennants

- **Peso total de los SVG frente a flag-icons**, con el mismo dibujo: alrededor de un tercio
  menos con brotli, gracias a la precisión de coordenadas elegida por bandera.
- **CSS**: un tercio más chico que el de flag-icons y 40 veces más chico que la hoja de estilos
  con data URI de country-flag-icons.
- **Formatos y API**, en la tabla siguiente.

## Funcionalidades

|                             | pennants                              | flag-icons                     | country-flag-icons           |
| --------------------------- | ------------------------------------- | ------------------------------ | ---------------------------- |
| Formas                      | Banderín 11:12                        | 4:3, 1:1                       | 3:2, 1:1                     |
| Detalle de emblemas         | Completo (dibujo de flag-icons)       | Completo                       | Simplificado                 |
| Archivos SVG                | Sí                                    | Sí                             | Sí                           |
| Clases CSS                  | Sí, con referencias a archivos        | Sí, con referencias a archivos | Sí, con data URI             |
| PNG                         | 1x, 2x                                | No                             | No                           |
| Sprite SVG                  | Sí                                    | No                             | No                           |
| Módulo de texto por bandera | Sí                                    | No                             | Sí                           |
| Cargador diferido           | `loadPennant`                         | No                             | No                           |
| React                       | `<Pennant>`, `<PennantSvg>`           | No                             | Un componente por bandera    |
| Web Component               | `<pennant-flag>`                      | No                             | No                           |
| Tipos de TypeScript         | Sí, códigos como unión `PennantCode`  | No                             | Sí, códigos como `string`    |
| Nombres traducidos          | `getPennantName` (`Intl`)             | No                             | No                           |
| Personalizable              | Color de la barra (custom properties) | No                             | No                           |
| Emoji                       | `toEmoji`                             | No                             | `country-flag-icons/unicode` |

Las filas de funcionalidades reflejan la API documentada de cada paquete en las versiones
indicadas. Si algo quedó desactualizado,
[abre un issue](https://github.com/d3vaya/pennants/issues).
