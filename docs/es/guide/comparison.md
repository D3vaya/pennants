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

|                                                               | pennants                                                                   | flag-icons                      | country-flag-icons           |
| ------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------- | ---------------------------- |
| Banderas                                                      | 271                                                                        | 271                             | 265                          |
| Todos los SVG, sin comprimir / gzip / brotli                  | banderín: 1,16 MB / 416 kB / 362 kB<br>rect: 1,10 MB / 383 kB / 335 kB     | 1,93 MB / 647 kB / 561 kB (4x3) | 178 kB / 89 kB / 81 kB (3x2) |
| SVG mediano, brotli                                           | banderín: 525 B, rect: 430 B                                               | 356 B (4x3)                     | 253 B (3x2)                  |
| CSS completo, sin comprimir / gzip / brotli                   | banderín: 14,4 kB / 1,8 kB / 1,0 kB ¹<br>rect: 13,5 kB / 1,8 kB / 0,9 kB ¹ | 28,0 kB / 2,4 kB / 1,5 kB ¹     | 201 kB / 48 kB / 40 kB ²     |
| Un módulo JS de bandera (`ar`), sin comprimir / gzip / brotli | 2,6 kB / 0,8 kB / 0,7 kB (dibujo, cualquier forma)                         | —                               | 0,3 kB / 0,2 kB / 0,2 kB     |
| Paquete de npm, comprimido / descomprimido                    | 2,80 MB / 9,26 MB                                                          | 1,08 MB / 3,99 MB               | 1,12 MB / 5,79 MB            |

¹ Referencia un archivo SVG por bandera; las imágenes se cargan solo cuando se usa la clase.
² Incluye todas las banderas como data URI.

## Dónde pierde pennants

- **Peso por bandera frente a country-flag-icons.** country-flag-icons simplifica escudos y
  emblemas; su módulo `ar` pesa menos de un tercio de nuestro dibujo `ar`, y todos sus SVG
  juntos, menos de una cuarta parte de nuestro conjunto rect. Si necesitas banderas
  rectangulares pequeñas y no te importan los emblemas detallados, es la opción más liviana.
- **Tamaño mediano de archivo.** Cada bandera lleva un marco (recorte y borde; en el banderín,
  también la barra), así que las banderas simples pesan más que los rectángulos de los otros
  dos paquetes.
- **Sin rectángulos 3:2.** pennants tiene banderín, 4:3, cuadrado y círculo;
  country-flag-icons trae 3:2 y 1:1.
- **Tamaño del paquete.** pennants incluye cuatro formas y más formatos (PNG, sprite, módulos
  JS), así que la descarga de npm es más del doble. Eso no cambia lo que descargan tus usuarios.
- **Costo del cargador.** El cargador diferido (`loadFlag`, los componentes) incluye de entrada
  un mapa de 271 entradas (<Size probe="load" /> con gzip en una build de Vite). El modo fetch lo evita;
  country-flag-icons no tiene cargador diferido.

## Dónde gana pennants

- **Peso total de los SVG frente a flag-icons**, con el mismo dibujo: alrededor de un 40 % menos
  para el conjunto rect 4:3 y alrededor de un tercio menos para los banderines (brotli), gracias
  a la precisión de coordenadas elegida por bandera.
- **CSS**: un tercio más chico que el de flag-icons y 40 veces más chico que la hoja de estilos
  con data URI de country-flag-icons.
- **Formas y API**, en la tabla siguiente.

## Funcionalidades

|                       | pennants                               | flag-icons                     | country-flag-icons           |
| --------------------- | -------------------------------------- | ------------------------------ | ---------------------------- |
| Formas                | Banderín, 4:3, cuadrado, círculo       | 4:3, 1:1                       | 3:2, 1:1                     |
| Detalle de emblemas   | Completo (dibujo de flag-icons)        | Completo                       | Simplificado                 |
| Archivos SVG          | Sí                                     | Sí                             | Sí                           |
| Clases CSS            | Sí, con referencias a archivos         | Sí, con referencias a archivos | Sí, con data URI             |
| PNG                   | 1x (2x para el banderín)               | No                             | No                           |
| Sprite SVG            | Banderín (el resto, desde el código)   | No                             | No                           |
| Módulo JS por bandera | Sí, dibujo para cualquier forma        | No                             | Sí                           |
| Cargador diferido     | `loadFlag`, modo fetch                 | No                             | No                           |
| React                 | `<Pennant>`, `<PennantSvg>`            | No                             | Un componente por bandera    |
| Web Component         | `<pennant-flag>`                       | No                             | No                           |
| Tipos de TypeScript   | Sí, códigos como unión `PennantCode`   | No                             | Sí, códigos como `string`    |
| Nombres traducidos    | `getPennantName` (`Intl`)              | No                             | No                           |
| Personalizable        | Barra del banderín (custom properties) | No                             | No                           |
| Emoji                 | `toEmoji`                              | No                             | `country-flag-icons/unicode` |

Las filas de funcionalidades reflejan la API documentada de cada paquete en las versiones
indicadas. Si algo quedó desactualizado,
[abre un issue](https://github.com/d3vaya/pennants/issues).
