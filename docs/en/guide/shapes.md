# Shapes

Every flag comes in four shapes. The pennant is the default and the signature style; the other
three use the same artwork and the same 30% darkening border, so they read as one family.

<ShapeGrid />

| Shape     | Canvas  | Artwork          | Frame                                   |
| --------- | ------- | ---------------- | --------------------------------------- |
| `pennant` | 66 × 72 | flag-icons `1x1` | Golden bar, pointed bottom, 3 px border |
| `rect`    | 64 × 48 | flag-icons `4x3` | 2 px border, 2 px corner radius         |
| `square`  | 48 × 48 | flag-icons `1x1` | 2 px border, 2 px corner radius         |
| `circle`  | 48 × 48 | flag-icons `1x1` | Circular clip, 2 px ring                |

Codes, names and the API are the same for every shape. Only the pennant has the bar, so only the
pennant can be [themed](./theming).

## Choosing a shape, per format

| Format         | Pennant (default)                       | Other shapes                               |
| -------------- | --------------------------------------- | ------------------------------------------ |
| CSS classes    | `pennants/css`, class `pn pn-cl`        | `pennants/css/rect`, class `pn-rect pn-cl` |
| CSS from CDN   | `import 'pennants/css/cdn'`             | `import 'pennants/css/rect/cdn'`           |
| SVG files      | `pennants/svg/pennant/cl.svg`           | `pennants/svg/rect/cl.svg`                 |
| PNG files      | `png/pennant/1x/` and `png/pennant/2x/` | [release assets](#release-assets) (1x)     |
| SVG sprite     | [release assets](#release-assets)       | [release assets](#release-assets)          |
| URLs           | `pennantUrl('cl')`                      | `pennantUrl('cl', { shape: 'rect' })`      |
| Lazy SVG       | `loadFlag('cl')`                        | `loadFlag('cl', { shape: 'circle' })`      |
| Fetch mode     | `fetchPennant('cl')`                    | `fetchPennant('cl', { shape: 'square' })`  |
| Static artwork | `renderFlag(cl)`                        | `renderFlag(cl, { shape: 'circle' })`      |
| React          | `<Pennant code="cl" />`                 | `<Pennant code="cl" shape="circle" />`     |
| Web Component  | `<pennant-flag code="cl">`              | `<pennant-flag code="cl" shape="rect">`    |

## CSS classes

Each shape's stylesheet has its own base class: `pn` (pennant), `pn-rect`, `pn-square` and
`pn-circle`. The flag class `pn-<code>` is the same everywhere, and flag rules are scoped to
their base, so you can load several stylesheets and mix shapes on one page.

```js
import 'pennants/css';
import 'pennants/css/circle';
```

```html
<span class="pn pn-cl" role="img" aria-label="Chile"></span>
<span class="pn-circle pn-cl" role="img" aria-label="Chile"></span>
<span class="pn-circle pn-jp pn-2x" role="img" aria-label="Japan"></span>
```

Use exactly one base class per element: `pn pn-circle pn-cl` is undefined. Size helpers
(`.pn-lg`, `.pn-2x` to `.pn-4x`) work with every base, and every stylesheet has a `/cdn`
variant (`pennants/css/circle/cdn`). Each stylesheet you load adds its own cost; see
[Performance](./performance#stylesheets).

## Artwork modules

JavaScript modules export artwork (`{ code, viewBox, content }`), not a framed SVG, so a flag is
bundled once however many shapes you render it in. Pick the artwork set the shape is drawn from:
`4x3` for `rect`, `1x1` for the others (`SHAPE_ART` holds the mapping).

```js
import { renderFlag } from 'pennants';
import cl from 'pennants/art/1x1/cl';
import arWide from 'pennants/art/4x3/cl';

renderFlag(cl); // pennant
renderFlag(cl, { shape: 'circle' });
renderFlag(arWide, { shape: 'rect' });
```

```jsx
import { PennantSvg } from 'pennants/react';

<PennantSvg art={cl} shape="square" size={24} />;
```

`renderFlag` is synchronous, which makes it the SSR-friendly option. `loadArt(code, { set })`
returns the artwork lazily if you want to frame it yourself.

## Sizing

Sizes are heights; widths follow the shape's ratio.

```js
import { SHAPE_SIZE } from 'pennants';
import { pennantBox } from 'pennants/react';

SHAPE_SIZE.rect; // { width: 64, height: 48 }
pennantBox(32, 'rect'); // { width: '42.667px', height: '32px' }
```

Each base class sets `height: 1em` and the width from its shape's ratio.

## Validating shape names

```js
import { SHAPES, isShape, toShape } from 'pennants';

SHAPES; // ['pennant', 'rect', 'square', 'circle']
isShape('circle'); // true
toShape(userInput); // throws RangeError for anything else
```

Components throw a `RangeError` for unknown shapes during render; `<pennant-flag>` fires
`pennant-error` instead. `pennantUrl` also throws for `format: 'png'` on any shape other than
the pennant, since only pennant PNGs are in the npm package.

## Release assets

To keep installs small, the npm package ships PNGs for the pennant only and no sprites. Every
[GitHub release](https://github.com/D3vaya/pennants/releases) since v0.2.0 has a
`pennants-assets-vX.Y.Z.zip` with all of them:

- `png/<shape>/1x/<code>.png` for every shape, plus `png/pennant/2x/`
- `sprite/<shape>.svg`: every flag of a shape as `<symbol id="pn-<code>">`
- `svg/<shape>/<code>.svg`, the same files as in the package

Copy what you need into your public folder. Sprites must be served from the same origin as the
page, because browsers don't load `<use>` references across origins:

```html
<svg width="33" height="36" role="img" aria-label="Mexico">
  <use href="/flags/pennant.svg#pn-mx" />
</svg>
```

You can also build them from a clone of the repository with `npm ci && npm run generate`.
