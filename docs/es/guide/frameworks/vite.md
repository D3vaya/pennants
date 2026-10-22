# Vite

Cualquier app de Vite (vanilla, React, Vue, Svelte, Solid...) puede usar todos los formatos.
Esta página usa TypeScript sin framework.

[Ejemplo completo](https://github.com/d3vaya/pennants/tree/main/examples/vite)

```sh
npm install pennants
```

## Evita que Vite incruste las banderas

Cada hoja de estilos (`pennants/css`, `pennants/css/rect`, `pennants/css/square`,
`pennants/css/circle`) referencia 271 SVG. Por defecto, Vite incrusta como data URI todo
recurso de menos de 4 KiB, lo que mete casi todas las banderas en tu CSS. Emítelos como
archivos:

```ts [vite.config.ts]
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    assetsInlineLimit: (file) => (file.includes('/pennants/svg/') ? false : undefined),
  },
});
```

O importa la variante CDN (`pennants/css/cdn`, `pennants/css/circle/cdn`...). Sus URLs de
imagen apuntan a jsDelivr, así que Vite no tiene nada que incrustar ni emitir.

| `import 'pennants/css'`              | CSS (min / gzip / brotli)                                                                                                                                | Imágenes                            |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Vite por defecto                     | <Size probe="css-default" part="css" metric="min" /> / <Size probe="css-default" part="css" /> / <Size probe="css-default" part="css" metric="brotli" /> | casi todas incrustadas en el CSS    |
| Con el `assetsInlineLimit` de arriba | <Size probe="css" part="css" metric="min" /> / <Size probe="css" part="css" /> / <Size probe="css" part="css" metric="brotli" />                         | 271 archivos, se piden al usarlos   |
| `pennants/css/cdn` en su lugar       | <Size probe="css-cdn" part="css" metric="min" /> / <Size probe="css-cdn" part="css" /> / <Size probe="css-cdn" part="css" metric="brotli" />             | desde jsDelivr, se piden al usarlas |

## Uso

```ts [src/main.ts]
// Hoja de estilos para las clases `pn pn-xx` (forma de banderín).
import 'pennants/css';
// Arte de las banderas: solo se empaquetan las que importas. El arte 1x1 dibuja
// pennant, square y circle; el 4x3 dibuja rect.
import ar from 'pennants/art/1x1/ar';
import ar4x3 from 'pennants/art/4x3/ar';
import { getPennantName, loadFlag, renderFlag, toPennantCode } from 'pennants';
// Archivos estáticos como URLs con hash.
import deUrl from 'pennants/svg/pennant/de.svg?url';
import spriteUrl from 'pennants/sprite?url';

// El mismo arte, cualquier forma (síncrono, también sirve en SSR).
document.querySelector('#circle')!.innerHTML = renderFlag(ar, { shape: 'circle' });
document.querySelector('#rect')!.innerHTML = renderFlag(ar4x3, { shape: 'rect' });

// Códigos en tiempo de ejecución: carga solo el chunk de esta bandera.
const code = toPennantCode('BR'); // 'br'; lanza RangeError si el código no existe
const lazy = document.querySelector('#lazy')!;
lazy.innerHTML = await loadFlag(code, { shape: 'square' });
lazy.setAttribute('role', 'img');
lazy.setAttribute('aria-label', getPennantName(code, 'es'));

document.querySelector<HTMLImageElement>('#img')!.src = deUrl;
document.querySelector('#sprite')!.setAttribute('href', `${spriteUrl}#pn-mx`);
```

Cada forma tiene su propia hoja y su clase base, así que se pueden combinar en una página.
Añade `import 'pennants/css/circle'` y luego:

```html
<span class="pn pn-ar pn-2x" role="img" aria-label="Argentina"></span>
<span class="pn-circle pn-ar pn-2x" role="img" aria-label="Argentina"></span>
<svg width="33" height="36" role="img" aria-label="México"><use id="sprite" /></svg>
```

Con `innerHTML`, inserta solo markup de `renderFlag`, `loadFlag` o `fetchPennant`. Nunca
contenido que venga del usuario.

`pennants/sprite` solo contiene banderines. Para los imports con `?url`, añade
`"types": ["vite/client"]` a tu tsconfig.

## Impacto en el bundle

Medido con Vite 8, build de producción, frente a una app vacía:

<SizeTable :probes="['art-pennant', 'art-circle', 'art-all', 'name', 'url', 'load', 'load-shapes', 'fetch', 'element']" />

Los módulos de arte son la opción más ligera para unas pocas banderas conocidas, y un mismo
módulo sirve para todas las formas. `loadFlag` y el Web Component cuestan unos pocos KB fijos
y luego un chunk pequeño por bandera, a demanda. `fetchPennant`, de `pennants/fetch`, no
empaqueta chunks: pide `svg/<forma>/<código>.svg` a la CDN (o a tu `base`).
