# Preguntas frecuentes

## IDs duplicados al insertar dos veces la misma bandera {#ids-duplicados}

Cada SVG define ids para su clip path y su degradado (`pn-ar-clip`, `pn-ar-bar`, ...). Los ids
llevan el código de la bandera, así que banderas distintas nunca chocan, pero insertar **el
mismo** SVG dos veces genera ids repetidos. Los navegadores suelen dibujarlo igual, hasta que la
primera copia se oculta con `display: none`: entonces las demás pierden el recorte y el
degradado.

- `<Pennant>` y `<PennantSvg>` reescriben los ids en cada instancia (a partir de `useId`).
- `<pennant-flag>` los mantiene dentro de su shadow root.
- Si insertas el SVG a mano con `innerHTML` y la bandera puede repetirse, usa
  `<img src={toDataUri(svg)}>` o uno de los componentes.

## Content Security Policy {#csp}

| Formato                                           | Necesita                                                                         |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| `<img>`, PNG, clases CSS                          | `img-src` con tu dominio o `https://cdn.jsdelivr.net`                            |
| `toDataUri(svg)` en `<img>` o CSS                 | `img-src data:`                                                                  |
| Chunks diferidos                                  | `script-src` de tu propio origen (son parte de tu bundle)                        |
| Modo fetch                                        | `connect-src` para el dominio de `base` (por defecto `https://cdn.jsdelivr.net`) |
| SVG inline, React, Web Component, personalización | nada extra: funciona con `style-src 'self'`                                      |

Ningún formato necesita `'unsafe-inline'`. El SVG inline no usa estilos inline: los colores de
la barra son atributos de presentación y la personalización es una regla de
`pennants/css/theme.css`. `<pennant-flag>` aplica sus estilos con una hoja de estilos
construible (`adoptedStyleSheets`), que la CSP no restringe; solo en navegadores sin esa API
recurre a un elemento `<style>`.

## SSR e hidratación {#ssr-e-hidratacion}

- `pennants/react` se puede importar desde React Server Components. `<PennantSvg>` se renderiza
  en el servidor; `<Pennant>` vive en un módulo `'use client'` y pasa a ser una referencia de
  cliente. `pennants/react/static` exporta solo `<PennantSvg>`, para bundlers que de otro modo
  emitirían igual los chunks diferidos.
- `<Pennant>` (modo inline) renderiza en el servidor un `<span>` vacío del tamaño correcto y
  carga la bandera después de hidratar. No hay error de hidratación ni salto de layout, pero la
  bandera no está en el HTML.
- Para que la bandera esté en el HTML del servidor, usa `mode="img"` o
  `<PennantSvg art={ar} />` con un import estático.
- `pennants/element` se puede importar en el servidor: `definePennantElement` no hace nada donde
  no existe `customElements`. El elemento se dibuja cuando se define en el navegador.
- `getPennantName` usa `Intl.DisplayNames`. El servidor y el navegador pueden traer versiones
  distintas de CLDR, así que algún nombre puede variar entre ambos. Si importa, pasa un `title`
  explícito.

## Solo ESM y `require` {#esm}

El paquete es solo ESM. Node.js 20.19+ y 22.12+ pueden hacer `require()` de módulos ES sin
top-level await, y este paquete no lo usa:

```js
const { getPennantName } = require('pennants'); // funciona en Node.js 20.19+
```

En entornos más antiguos usa `import()`. En TypeScript, usa `moduleResolution: "bundler"`,
`"node16"` o `"nodenext"`; el modo antiguo `"node"` (node10) no lee `exports` y no encuentra
`pennants/react` ni `pennants/art/*`.

## Imports de assets en el bundler {#imports-de-assets-en-el-bundler}

Importar un archivo de imagen devuelve lo que tu bundler tenga configurado:

```js
import url from 'pennants/svg/pennant/ar.svg'; // Vite: la URL
import markup from 'pennants/svg/pennant/ar.svg?raw'; // Vite: el SVG como texto
```

- **webpack 5:** agrega una regla con `type: 'asset/resource'` para los `.svg` de
  `node_modules/pennants`.
- **Next.js:** el import estático de un `.svg` devuelve un objeto; usa `.src`, la carpeta
  `/public` o `pennantUrl`.
- **`pennants/css` con Vite, SvelteKit o Astro:** lo más simple es
  `import 'pennants/css/cdn'`: las mismas clases, apuntando a URLs de jsDelivr con la versión
  fijada, que los bundlers no tocan (<Size probe="css-cdn" part="css" /> de CSS con gzip; las banderas se cargan del CDN).
  Si prefieres servir las banderas tú mismo, usa la hoja de estilos normal y evita que se
  incrusten. El motivo: Vite incrusta como data URI los assets de
  menos de 4 KiB, así que la mayoría de las 271 banderas termina dentro de tu CSS: <Size probe="css-default" part="css" metric="min" /> min /
  <Size probe="css-default" part="css" /> con gzip, en lugar de
  <Size probe="css" part="css" metric="min" /> / <Size probe="css" part="css" />. Para mantenerlas como archivos (en
  Astro, la opción va dentro de `vite.build`). Next.js y Angular no las incrustan.

```js
// vite.config.js
export default {
  build: {
    assetsInlineLimit: (file) => (file.includes('/pennants/svg/') ? false : undefined),
  },
};
```

## Una bandera se ve mal {#bandera-incorrecta}

Los diseños vienen de flag-icons. Revisa primero el
[repositorio de flag-icons](https://github.com/lipis/flag-icons); los problemas del banderín en
sí (recorte, barra, tamaños) van en el
[gestor de issues de pennants](https://github.com/d3vaya/pennants/issues).

## Falta un código {#falta-un-codigo}

`isPennantCode` y `codes` listan exactamente lo que incluye el paquete. Las banderas nuevas se
piden en flag-icons; cuando estén allí, se agregan aquí con la siguiente actualización de
flag-icons.
