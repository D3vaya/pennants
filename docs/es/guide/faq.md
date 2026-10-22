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

| Formato                           | Necesita                                                  |
| --------------------------------- | --------------------------------------------------------- |
| `<img>`, PNG, clases CSS          | `img-src` con tu dominio o `https://cdn.jsdelivr.net`     |
| `toDataUri(svg)` en `<img>` o CSS | `img-src data:`                                           |
| Chunks diferidos                  | `script-src` de tu propio origen (son parte de tu bundle) |
| SVG inline y `<pennant-flag>`     | ver abajo                                                 |

Los colores del degradado de la barra se escriben como atributos
`style="stop-color: var(...)"`, y `<pennant-flag>` agrega un elemento `<style>` a su shadow
root. Una política `style-src` sin `'unsafe-inline'` bloquea ambos: la barra se ve oscura y el
elemento pierde su tamaño. Con una política de estilos estricta, usa los formatos de imagen o las
clases CSS.

## SSR e hidratación {#ssr-e-hidratacion}

- `<Pennant>` (modo inline) renderiza en el servidor un `<span>` vacío del tamaño correcto y
  carga la bandera después de hidratar. No hay error de hidratación ni salto de layout, pero la
  bandera no está en el HTML.
- Para que la bandera esté en el HTML del servidor, usa `mode="img"` o
  `<PennantSvg svg={ar} />` con un import estático.
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
`pennants/react` ni `pennants/flags/*`.

## Imports de assets en el bundler {#imports-de-assets-en-el-bundler}

Importar un archivo de imagen devuelve lo que tu bundler tenga configurado:

```js
import url from 'pennants/svg/ar.svg'; // Vite: la URL
import markup from 'pennants/svg/ar.svg?raw'; // Vite: el SVG como texto
```

- **webpack 5:** agrega una regla con `type: 'asset/resource'` para los `.svg` de
  `node_modules/pennants`.
- **Next.js:** el import estático de un `.svg` devuelve un objeto; usa `.src`, la carpeta
  `/public` o `pennantUrl`.
- **`pennants/css` con Vite, SvelteKit o Astro:** Vite incrusta como data URI los assets de
  menos de 4 KiB, así que la mayoría de las 271 banderas termina dentro de tu CSS: 388 kB sin
  comprimir / 56 kB con gzip, en lugar de 15 kB / 3,7 kB. Para mantenerlas como archivos (en
  Astro, la opción va dentro de `vite.build`). Next.js y Angular no las incrustan.

```js
// vite.config.js
export default {
  build: {
    assetsInlineLimit: (file) => (file.includes('/pennants/svg/') ? false : undefined),
  },
};
```

## TypeScript 6 rechaza `import 'pennants/css'` {#typescript-css-import}

TypeScript 6 activa por defecto `noUncheckedSideEffectImports` y marca el error TS2882 en los
imports de efecto secundario que no puede asociar a un tipo de archivo conocido. Usa la ruta
completa, que termina en `.css` y queda cubierta por los tipos de CSS de tu bundler:

```js
import 'pennants/css/pennants.min.css';
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
