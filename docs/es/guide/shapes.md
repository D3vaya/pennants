# Formas

Cada bandera viene en cuatro formas. El banderín es la forma por defecto y el estilo propio de
la librería; las otras tres usan el mismo dibujo y el mismo borde oscurecido al 30 %, así que se
ven como una sola familia.

<ShapeGrid />

| Forma     | Lienzo  | Dibujo           | Marco                                       |
| --------- | ------- | ---------------- | ------------------------------------------- |
| `pennant` | 66 × 72 | flag-icons `1x1` | Barra dorada, punta inferior, borde de 3 px |
| `rect`    | 64 × 48 | flag-icons `4x3` | Borde de 2 px, esquinas con radio de 2 px   |
| `square`  | 48 × 48 | flag-icons `1x1` | Borde de 2 px, esquinas con radio de 2 px   |
| `circle`  | 48 × 48 | flag-icons `1x1` | Recorte circular, anillo de 2 px            |

Los códigos, los nombres y la API son los mismos en todas las formas. Solo el banderín tiene
barra, así que solo el banderín se puede [personalizar](./theming).

## Cómo elegir la forma en cada formato

| Formato          | Banderín (por defecto)                   | Otras formas                                             |
| ---------------- | ---------------------------------------- | -------------------------------------------------------- |
| Clases CSS       | `pennants/css`, clase `pn pn-ar`         | `pennants/css/rect`, clase `pn-rect pn-ar`               |
| CSS desde el CDN | `import 'pennants/css/cdn'`              | `import 'pennants/css/rect/cdn'`                         |
| Archivos SVG     | `pennants/svg/pennant/ar.svg`            | `pennants/svg/rect/ar.svg`                               |
| Archivos PNG     | `png/pennant/1x/` y `png/pennant/2x/`    | `png/rect/1x/` (solo 1x)                                 |
| Sprite SVG       | `pennants/sprite` (`sprite/pennant.svg`) | no se publica, ver [más abajo](#sprites-de-otras-formas) |
| URLs             | `pennantUrl('ar')`                       | `pennantUrl('ar', { shape: 'rect' })`                    |
| SVG diferido     | `loadFlag('ar')`                         | `loadFlag('ar', { shape: 'circle' })`                    |
| Modo fetch       | `fetchPennant('ar')`                     | `fetchPennant('ar', { shape: 'square' })`                |
| Dibujo estático  | `renderFlag(ar)`                         | `renderFlag(ar, { shape: 'circle' })`                    |
| React            | `<Pennant code="ar" />`                  | `<Pennant code="ar" shape="circle" />`                   |
| Web Component    | `<pennant-flag code="ar">`               | `<pennant-flag code="ar" shape="rect">`                  |

## Clases CSS

La hoja de estilos de cada forma tiene su propia clase base: `pn` (banderín), `pn-rect`,
`pn-square` y `pn-circle`. La clase de la bandera, `pn-<código>`, es la misma en todas, y sus
reglas dependen de la clase base, así que puedes cargar varias hojas de estilos y mezclar formas
en una misma página.

```js
import 'pennants/css';
import 'pennants/css/circle';
```

```html
<span class="pn pn-ar" role="img" aria-label="Argentina"></span>
<span class="pn-circle pn-ar" role="img" aria-label="Argentina"></span>
<span class="pn-circle pn-jp pn-2x" role="img" aria-label="Japón"></span>
```

Usa una sola clase base por elemento: `pn pn-circle pn-ar` no tiene un resultado definido. Los
tamaños auxiliares (`.pn-lg`, `.pn-2x` a `.pn-4x`) funcionan con todas las bases, y cada hoja
de estilos tiene una variante `/cdn` (`pennants/css/circle/cdn`). Cada hoja de estilos que
cargues suma su propio peso; mira [Rendimiento](./performance#hojas-de-estilos).

## Módulos de dibujo

Los módulos de JavaScript exportan el dibujo (`{ code, viewBox, content }`), no un SVG con
marco, así que cada bandera entra una sola vez en el bundle aunque la muestres en varias formas.
Elige el conjunto de dibujos del que sale la forma: `4x3` para `rect` y `1x1` para las demás
(`SHAPE_ART` guarda esa relación).

```js
import { renderFlag } from 'pennants';
import ar from 'pennants/art/1x1/ar';
import arAncha from 'pennants/art/4x3/ar';

renderFlag(ar); // banderín
renderFlag(ar, { shape: 'circle' });
renderFlag(arAncha, { shape: 'rect' });
```

```jsx
import { PennantSvg } from 'pennants/react';

<PennantSvg art={ar} shape="square" size={24} />;
```

`renderFlag` es síncrono, por eso es la opción para SSR. `loadArt(código, { set })` devuelve el
dibujo de forma diferida si quieres armar el marco tú mismo.

## Tamaño

Los tamaños indican la altura; el ancho sigue la proporción de la forma.

```js
import { SHAPE_SIZE } from 'pennants';
import { pennantBox } from 'pennants/react';

SHAPE_SIZE.rect; // { width: 64, height: 48 }
pennantBox(32, 'rect'); // { width: '42.667px', height: '32px' }
```

Cada clase base usa `height: 1em` y calcula el ancho con la proporción de su forma.

## Validar nombres de forma

```js
import { SHAPES, isShape, toShape } from 'pennants';

SHAPES; // ['pennant', 'rect', 'square', 'circle']
isShape('circle'); // true
toShape(entradaDelUsuario); // lanza RangeError con cualquier otro valor
```

Los componentes lanzan `RangeError` al renderizar con una forma desconocida; `<pennant-flag>`
dispara `pennant-error` en su lugar.

## Sprites de otras formas {#sprites-de-otras-formas}

En npm solo se publica `sprite/pennant.svg`, para que la instalación sea liviana. Los otros
sprites (`rect.svg`, `square.svg`, `circle.svg`) los genera la build. Para obtenerlos, clona el
repositorio y ejecuta:

```sh
npm ci
npm run generate   # genera sprite/rect.svg, sprite/square.svg y sprite/circle.svg
```

Los ids de los símbolos son `pn-<código>` en todos los sprites; el nombre del archivo indica la
forma.
