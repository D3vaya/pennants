# ¿Qué formato uso?

Todos los formatos muestran el mismo dibujo. Cambian en cuánto pesan, dónde se renderizan y qué
puedes personalizar. Los pesos son lo que cada opción agrega a una app vacía de Vite 8 en
producción (gzip); en [Rendimiento y peso](./performance) están los tamaños sin comprimir y los
de la librería sola.

| Formato                                | Agrega a tu app (gzip)                                     | SSR                                        | Color de la barra | Diferido                  | Caché                              |
| -------------------------------------- | ---------------------------------------------------------- | ------------------------------------------ | ----------------- | ------------------------- | ---------------------------------- |
| Clases CSS `pn pn-ar`                  | 0 de JS, ≈3,7 kB de CSS ¹                                  | Sí                                         | No                | Sí, por clase usada       | Un archivo por bandera, caché HTTP |
| `<img>` SVG (propio o CDN)             | 0                                                          | Sí                                         | No                | `loading="lazy"`          | Caché HTTP / CDN                   |
| `<img>` PNG 1x / 2x                    | 0                                                          | Sí                                         | No                | `loading="lazy"`          | Caché HTTP / CDN                   |
| Sprite SVG `<use href>`                | 0 de JS; un archivo de 1,2 MB (≈260 kB con brotli)         | Sí                                         | No                | No, un archivo para todas | Un archivo, caché HTTP             |
| Módulo de dibujo `pennants/art/1x1/ar` | ≈1,0 kB por bandera                                        | Sí                                         | Sí                | No, va en el bundle       | Parte de tu bundle                 |
| `loadPennant(código)`                  | ≈5,1 kB (mapa de carga) + un chunk por bandera mostrada    | Cliente (asíncrono)                        | Sí                | Sí                        | Chunks, caché HTTP                 |
| Modo fetch ³                           | <Size probe="fetch" /> + una petición por bandera mostrada | Cliente (asíncrono)                        | Sí                | Sí                        | Caché HTTP / CDN                   |
| React `<Pennant>`                      | ≈6,9 kB + un chunk por bandera mostrada                    | Caja en el servidor, bandera en el cliente | Sí                | Sí                        | Chunks                             |
| React `<PennantSvg art={ar}>`          | ≈8,0 kB con `ar` incluida ²                                | Sí, con el SVG completo                    | Sí                | No                        | Parte de tu bundle                 |
| `<pennant-flag>`                       | ≈7,0 kB + un chunk por bandera mostrada                    | Solo cliente                               | Sí                | Sí                        | Chunks                             |

¹ Con `assetsInlineLimit` configurado como en las preguntas frecuentes, o 1,9 kB con
`pennants/css/cdn` (banderas desde jsDelivr); ver
[preguntas frecuentes](./faq#imports-de-assets-en-el-bundler); sin eso, Vite incrusta las
banderas y el CSS pesa 52 kB con gzip. Next.js y Angular generan archivos por defecto.

² En un Server Component de Next.js, `<PennantSvg>` no agrega JavaScript al cliente: se
renderiza a HTML.

³ `fetchPennant` de `pennants/fetch`, `<Pennant mode="fetch">` o `<pennant-flag>` con el
atributo `base`. Con CSP, necesita `connect-src` para ese dominio.

## Decisiones rápidas

- **Sitio estático, pocas banderas, sin build:** `<img>` desde el CDN.
- **Muchas banderas en HTML renderizado en el servidor** (tablas, selectores de país): clases
  CSS. El navegador descarga solo las banderas de la página.
- **Banderas conocidas al compilar que deben verse en el primer render con SSR:** módulos por
  bandera; en React, `<PennantSvg art={ar} />`.
- **Bandera elegida en tiempo de ejecución** (perfil de usuario, datos de una API):
  `loadFlag`, `<Pennant>` o `<pennant-flag>`. Para el bundle más chico, usa el modo fetch:
  sin mapa de carga, las banderas se descargan como archivos SVG desde el CDN o tu servidor.
- **Quieres cambiar el color de la barra:** SVG inline (módulos, `loadFlag`, React) con
  `pennants/css/theme.css`, o `<pennant-flag>`. Mira [Personalización](./theming).
- **Email, apps nativas, imágenes Open Graph:** PNG.
- **Cientos de banderas a la vez en una página:** el sprite o las clases CSS.

## Sobre SSR

`<Pennant>` en modo inline renderiza en el servidor una caja vacía del tamaño correcto y la
completa después de la hidratación: no hay saltos de layout, pero la bandera no está en el HTML.
Si necesitas que esté, usa `mode="img"` o `<PennantSvg>` con un import estático.
`<pennant-flag>` solo se renderiza en el navegador. Más detalles en las
[preguntas frecuentes](./faq#ssr-e-hidratacion).
