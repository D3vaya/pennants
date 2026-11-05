# HTML & CDN

No build step. Load a stylesheet and the Web Component from jsDelivr, or copy the files from
`node_modules/pennants` to your server.

[Full example](https://github.com/D3vaya/pennants/tree/main/examples/html-cdn)

## From the CDN

Always pin the version in CDN URLs.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pennants@0.2.0/css/pennant.min.css" />
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/pennants@0.2.0/dist/element/register.js"
></script>

<!-- CSS classes: no JavaScript -->
<span class="pn pn-cl" role="img" aria-label="Chile"></span>
<span class="pn pn-br pn-2x" role="img" aria-label="Brazil"></span>

<!-- Plain image: svg/<shape>/<code>.svg -->
<img
  src="https://cdn.jsdelivr.net/npm/pennants@0.2.0/svg/pennant/jp.svg"
  width="33"
  height="36"
  alt="Japan"
/>

<!-- Web Component: fetches only this flag, in any shape -->
<pennant-flag code="de" size="48"></pennant-flag>
<pennant-flag code="de" shape="circle" size="48"></pennant-flag>
```

There is one stylesheet per shape, and each has its own base class: `css/pennant.min.css`
(`pn`), `css/rect.min.css` (`pn-rect`), `css/square.min.css` (`pn-square`) and
`css/circle.min.css` (`pn-circle`). Load the ones you need and mix them on one page:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pennants@0.2.0/css/circle.min.css" />

<span class="pn pn-cl" role="img" aria-label="Chile"></span>
<span class="pn-circle pn-cl" role="img" aria-label="Chile"></span>
```

Use one base class per element: `pn-circle pn-cl`, not `pn pn-circle pn-cl`. Rules from
different stylesheets have the same specificity, so the last stylesheet loaded would win.

## Self-hosted

```sh
npm install pennants
```

Copy `css/`, `svg/` and `dist/` from `node_modules/pennants` into a public folder
(the example's `build.js` copies them into `dist/pennants/`). Keep `css/` and `svg/` side by
side: the stylesheets load `../svg/<shape>/<code>.svg`.

```html
<link rel="stylesheet" href="./pennants/css/pennant.min.css" />
<script type="module" src="./pennants/dist/element/register.js"></script>

<img src="./pennants/svg/pennant/jp.svg" width="33" height="36" alt="Japan" />
```

For an SVG sprite (every flag in one file, used with `<use href>`), download it from the
[release assets](../shapes#release-assets).

## Weight

- Each stylesheet is 15–17 KB minified (under 2 KB gzip). Each flag image is downloaded only
  when an element on the page uses its class.
- The Web Component is about <Size probe="element" metric="gzip" /> gzip on first load. Each
  flag is a separate chunk of a few KB, fetched on demand.
- `<img>` needs no JavaScript.
