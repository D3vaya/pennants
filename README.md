# pennants

[![npm](https://img.shields.io/npm/v/pennants)](https://www.npmjs.com/package/pennants)
[![core size](https://img.shields.io/bundlejs/size/pennants?exports=getPennantName&label=core)](https://bundlejs.com/?q=pennants&treeshake=[{getPennantName}])
[![CI](https://github.com/d3vaya/pennants/actions/workflows/ci.yml/badge.svg)](https://github.com/d3vaya/pennants/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/pennants)](LICENSE)

Every flag, every shape, one API. 271 country flags (249 ISO 3166-1 countries plus regions and
organizations) as pennants, the signature style, and as 4:3 rectangles, squares and circles.
SVG, PNG, CSS classes, an SVG sprite, tree-shakable ES modules, a React component and a Web
Component. Typed and lazy: you only ship the flags you show.

![A string of pennant flags above rectangle, square and circle flags](https://raw.githubusercontent.com/d3vaya/pennants/main/docs/public/preview.png)

**[Documentation](https://d3vaya.github.io/pennants/)** ·
**[Gallery](https://d3vaya.github.io/pennants/gallery)** ·
[Which format?](https://d3vaya.github.io/pennants/guide/formats) ·
[Shapes](https://d3vaya.github.io/pennants/guide/shapes) ·
[API](https://d3vaya.github.io/pennants/api/) ·
[Español](https://d3vaya.github.io/pennants/es/)

```sh
npm install pennants
```

## Quick start

**CSS classes**: no JavaScript, images load per used class.

```js
import 'pennants/css';
```

```html
<span class="pn pn-ar" role="img" aria-label="Argentina"></span>
```

**Image or CDN**: zero bundle cost.

```html
<img
  src="https://cdn.jsdelivr.net/npm/pennants@0.1.0/svg/pennant/ar.svg"
  width="33"
  height="36"
  alt="Argentina"
/>
```

**One module per flag**: tree-shaken artwork, framed in any shape.

```js
import { renderFlag } from 'pennants';
import ar from 'pennants/art/1x1/ar';

renderFlag(ar, { shape: 'circle' }); // SVG markup
```

**Lazy, by code**: each flag is its own chunk.

```js
import { loadFlag, getPennantName } from 'pennants';

const svg = await loadFlag('ar'); // or loadFlag('ar', { shape: 'rect' })
getPennantName('de', 'es'); // 'Alemania'
```

**React**: accessible name by default, SSR-safe.

```jsx
import { Pennant } from 'pennants/react';

<Pennant code="ar" size={32} />;
```

**Web Component**: no framework.

```html
<script type="module">
  import 'pennants/element/register';
</script>
<pennant-flag code="ar" size="32"></pennant-flag>
```

**Shapes**: `pennant` (default), `rect` (4:3), `square`, `circle`. Pass `shape` to any API, or
import `pennants/css/rect` (`square`, `circle`) for CSS classes.

Also: `pennants/svg/<shape>/<code>.svg`, `pennants/png/<shape>/1x/<code>.png` (plus `2x` for
the pennant) and `pennants/sprite` (pennant, `<use href="pennant.svg#pn-ar">`).

## Weight

Measured with Vite 8.3.5 (production build, difference against an empty app, gzip). Reproduce
with `npm run bundle:budget`.

| You use                                | Added up front | Lazy files ¹ |
| -------------------------------------- | -------------- | ------------ |
| `<img>` / CDN, PNG                     | 0              | 0            |
| CSS classes, `assetsInlineLimit` set ² | 3.7 kB CSS     | 0            |
| CSS classes, `pennants/css/cdn`        | 1.9 kB CSS ³   | 0            |
| One flag, static import (`ar`)         | 1.0 kB JS      | 0            |
| `getPennantName`                       | 1.1 kB JS      | 0            |
| `loadPennant`                          | 5.1 kB JS      | 271          |
| React `<Pennant>`                      | 6.9 kB JS      | 271          |
| `<pennant-flag>`                       | 7.0 kB JS      | 271          |

¹ Emitted into your build, downloaded only when that flag is shown.
² With Vite's defaults every flag is inlined into the CSS (52 kB gzip); see the
[FAQ](https://d3vaya.github.io/pennants/guide/faq#bundler-asset-imports). Next.js and Angular do
not inline.
³ Same classes, with flag URLs pointing at jsDelivr (version-pinned); bundlers leave them alone.

More numbers, including min and brotli: [Performance & weight](https://d3vaya.github.io/pennants/guide/performance)
and the [comparison with flag-icons and country-flag-icons](https://d3vaya.github.io/pennants/guide/comparison).

## Compared with flag-icons

The artwork is [flag-icons](https://github.com/lipis/flag-icons)' and the codes are the same:
`fi fi-ar` becomes `pn pn-ar`, with `pennants/css/rect` if you want to keep 4:3 rectangles.

|                                 | flag-icons            | pennants                               |
| ------------------------------- | --------------------- | -------------------------------------- |
| Shapes                          | Rectangle 4:3 and 1:1 | Pennant, rectangle 4:3, square, circle |
| SVG files and CSS classes       | Yes                   | Yes                                    |
| PNG and SVG sprite              | No                    | Yes                                    |
| JS module per flag, lazy loader | No                    | Yes                                    |
| TypeScript types                | No                    | `PennantCode` union, typed API         |
| Localized names                 | No                    | `getPennantName` (`Intl.DisplayNames`) |
| React and Web Component         | No                    | Yes                                    |
| Themeable bar                   | No                    | CSS custom properties                  |

See [Migrating from flag-icons](https://d3vaya.github.io/pennants/guide/migration).

## Good to know

- ESM only. Node.js 20.19+ (where `require()` of ESM also works). React 18+ for
  `pennants/react`.
- Only pass markup from `renderFlag`, `loadFlag` or `fetchPennant` to `innerHTML`, and artwork from
  `pennants/art/*` to `<PennantSvg>`; never user input.
- The pennant's bar can be themed with `--pennant-bar-light` and `--pennant-bar-dark`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © 2026 d3vaya. Flag artwork from flag-icons, MIT © 2013 Panayiotis Lipiridis; see
[NOTICE](NOTICE).

## En español

Banderas de países como banderines, rectángulos 4:3, cuadrados y círculos, en todos los
formatos: SVG, PNG, CSS, sprite, módulos JS, React y Web Component. Documentación completa en español:
**[d3vaya.github.io/pennants/es/](https://d3vaya.github.io/pennants/es/)**.

```js
import 'pennants/css'; // <span class="pn pn-ar"></span>
```
