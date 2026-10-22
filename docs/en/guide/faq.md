# FAQ & troubleshooting

## Duplicate ids when inlining the same flag twice

Each SVG defines ids for its clip path and gradient (`pn-ar-clip`, `pn-ar-bar`, ...). The ids
are namespaced per flag, so different flags never clash, but inserting the **same** markup twice
yields duplicate ids. Browsers usually still render it, until the first copy is hidden with
`display: none`: the other copies then lose their clip path and gradient.

- `<Pennant>` and `<PennantSvg>` rewrite the ids per instance (based on `useId`).
- `<pennant-flag>` keeps them inside its shadow root.
- For manual `innerHTML`, prefer `<img src={toDataUri(svg)}>` or one of the components when a
  flag can appear more than once.

## Content Security Policy

| Format                          | Needs                                                   |
| ------------------------------- | ------------------------------------------------------- |
| `<img>`, PNG, CSS classes       | `img-src` for your host or `https://cdn.jsdelivr.net`   |
| `toDataUri(svg)` in `<img>`/CSS | `img-src data:`                                         |
| Lazy chunks                     | `script-src` for your own origin (they are your bundle) |
| Inline SVG and `<pennant-flag>` | see below                                               |

The bar gradient stops are written as `style="stop-color: var(...)"` attributes, and
`<pennant-flag>` adds a `<style>` element to its shadow root. A `style-src` policy without
`'unsafe-inline'` blocks both, which turns the bar dark and breaks the element's sizing. With a
strict style policy, use the image formats or the CSS classes.

## SSR and hydration

- `<Pennant>` (inline mode) renders a correctly sized empty `<span>` on the server and loads the
  flag after hydration. No hydration mismatch, no layout shift, but no flag in the HTML.
- For flags in the server HTML, use `mode="img"`, or `<PennantSvg svg={ar} />` with a static
  import.
- `pennants/element` can be imported on the server: `definePennantElement` does nothing where
  `customElements` does not exist. The element renders after it is defined in the browser.
- `getPennantName` uses `Intl.DisplayNames`. Server and browser can ship different CLDR
  versions, so a few names may differ between them. Pass an explicit `title` if that matters.

## ESM only and `require`

The package is ESM only. Node.js 20.19+ and 22.12+ can `require()` ES modules without top-level
await, which this package does not use:

```js
const { getPennantName } = require('pennants'); // works on Node.js 20.19+
```

On older runtimes use `import()`. In TypeScript, use `moduleResolution: "bundler"`, `"node16"` or
`"nodenext"`; the legacy `"node"` (node10) mode does not read `exports` and cannot find
`pennants/react` or `pennants/flags/*`.

## Bundler asset imports

Importing an asset file returns whatever your bundler is configured to return:

```js
import url from 'pennants/svg/ar.svg'; // Vite: URL string
import markup from 'pennants/svg/ar.svg?raw'; // Vite: SVG markup
```

- **webpack 5:** add a rule with `type: 'asset/resource'` for `.svg` under `node_modules/pennants`.
- **Next.js:** a static import of an `.svg` file gives an object; use `.src`, or the
  `/public` folder, or `pennantUrl`.
- **`pennants/css` with Vite, SvelteKit or Astro:** Vite inlines assets under 4 KiB as data
  URIs, so most of the 271 flags end up inside your CSS: 388 kB raw / 56 kB gzip instead of
  15 kB / 3.7 kB. Keep them as files (in Astro, put the option under `vite.build`). Next.js and
  Angular do not inline them.

```js
// vite.config.js
export default {
  build: {
    assetsInlineLimit: (file) => (file.includes('/pennants/svg/') ? false : undefined),
  },
};
```

## TypeScript 6 rejects `import 'pennants/css'` {#typescript-css-import}

TypeScript 6 enables `noUncheckedSideEffectImports` by default and reports TS2882 for
side-effect imports it cannot resolve to a file type it knows. Use the full file path, which
ends in `.css` and is matched by your bundler's CSS typings:

```js
import 'pennants/css/pennants.min.css';
```

## A flag looks wrong

Flag designs come from flag-icons. Please check the
[flag-icons repository](https://github.com/lipis/flag-icons) first; problems with the pennant
frame (clipping, bar, sizes) belong in the
[pennants issue tracker](https://github.com/d3vaya/pennants/issues).

## A code is missing

`isPennantCode` and `codes` list exactly what ships. Requests for new flags go to flag-icons;
once a flag is there, it is added here with the next flag-icons update.
