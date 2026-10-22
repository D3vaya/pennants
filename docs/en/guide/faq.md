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

| Format                                    | Needs                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| `<img>`, PNG, CSS classes                 | `img-src` for your host or `https://cdn.jsdelivr.net`                  |
| `toDataUri(svg)` in `<img>`/CSS           | `img-src data:`                                                        |
| Lazy chunks                               | `script-src` for your own origin (they are your bundle)                |
| Fetch mode                                | `connect-src` for the `base` host (default `https://cdn.jsdelivr.net`) |
| Inline SVG, React, Web Component, theming | nothing extra: works with `style-src 'self'`                           |

No format needs `'unsafe-inline'`. Inline SVG uses no inline styles: the bar colors are
presentation attributes and theming is a rule in `pennants/css/theme.css`. `<pennant-flag>`
styles its shadow root with a constructable stylesheet (`adoptedStyleSheets`), which CSP does
not restrict; only in browsers without that API does it fall back to a `<style>` element.

## SSR and hydration

- `pennants/react` is safe to import from React Server Components. `<PennantSvg>` renders on the
  server; `<Pennant>` lives in a `'use client'` module and becomes a client reference.
  `pennants/react/static` exports only `<PennantSvg>`, for bundlers that would otherwise emit
  the lazy chunks anyway.
- `<Pennant>` (inline mode) renders a correctly sized empty `<span>` on the server and loads the
  flag after hydration. No hydration mismatch, no layout shift, but no flag in the HTML.
- For flags in the server HTML, use `mode="img"`, or `<PennantSvg art={ar} />` with a static
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
`pennants/react` or `pennants/art/*`.

## Bundler asset imports

Importing an asset file returns whatever your bundler is configured to return:

```js
import url from 'pennants/svg/pennant/ar.svg'; // Vite: URL string
import markup from 'pennants/svg/pennant/ar.svg?raw'; // Vite: SVG markup
```

- **webpack 5:** add a rule with `type: 'asset/resource'` for `.svg` under `node_modules/pennants`.
- **Next.js:** a static import of an `.svg` file gives an object; use `.src`, or the
  `/public` folder, or `pennantUrl`.
- **`pennants/css` with Vite, SvelteKit or Astro:** the simplest fix is
  `import 'pennants/css/cdn'`: the same classes, pointing at version-pinned jsDelivr URLs,
  which bundlers do not touch (<Size probe="css-cdn" part="css" /> gzip of CSS, flags load from the CDN). To self-host the
  flags instead, keep the default stylesheet and stop the inlining. Background: Vite inlines assets under 4 KiB as data
  URIs, so most of the 271 flags end up inside your CSS: <Size probe="css-default" part="css" metric="min" /> min /
  <Size probe="css-default" part="css" /> gzip instead of
  <Size probe="css" part="css" metric="min" /> / <Size probe="css" part="css" />. Keep them as files (in Astro, put the option under `vite.build`). Next.js and
  Angular do not inline them.

```js
// vite.config.js
export default {
  build: {
    assetsInlineLimit: (file) => (file.includes('/pennants/svg/') ? false : undefined),
  },
};
```

## A flag looks wrong

Flag designs come from flag-icons. Please check the
[flag-icons repository](https://github.com/lipis/flag-icons) first; problems with the pennant
frame (clipping, bar, sizes) belong in the
[pennants issue tracker](https://github.com/D3vaya/pennants/issues).

## A code is missing

`isPennantCode` and `codes` list exactly what ships. Requests for new flags go to flag-icons;
once a flag is there, it is added here with the next flag-icons update.
