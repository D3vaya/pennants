# HTML & CDN

No build step. Load a stylesheet and the Web Component from jsDelivr, or copy the files from
`node_modules/pennants` to your server.

[Full example](https://github.com/d3vaya/pennants/tree/main/examples/html-cdn)

## From the CDN

Always pin the version in CDN URLs.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pennants@0.1.0/css/pennant.min.css" />
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/pennants@0.1.0/dist/element/register.js"
></script>

<!-- CSS classes: no JavaScript -->
<span class="pn pn-ar" role="img" aria-label="Argentina"></span>
<span class="pn pn-br pn-2x" role="img" aria-label="Brazil"></span>

<!-- Plain image: svg/<shape>/<code>.svg -->
<img
  src="https://cdn.jsdelivr.net/npm/pennants@0.1.0/svg/pennant/jp.svg"
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
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pennants@0.1.0/css/circle.min.css" />

<span class="pn pn-ar" role="img" aria-label="Argentina"></span>
<span class="pn-circle pn-ar" role="img" aria-label="Argentina"></span>
```

## Self-hosted

```sh
npm install pennants
```

Copy `css/`, `svg/`, `sprite/` and `dist/` from `node_modules/pennants` into a public folder
(the example's `build.js` copies them into `dist/pennants/`). Keep `css/` and `svg/` side by
side: the stylesheets load `../svg/<shape>/<code>.svg`.

```html
<link rel="stylesheet" href="./pennants/css/pennant.min.css" />
<script type="module" src="./pennants/dist/element/register.js"></script>

<img src="./pennants/svg/pennant/jp.svg" width="33" height="36" alt="Japan" />

<svg width="33" height="36" role="img" aria-label="Mexico">
  <use href="./pennants/sprite/pennant.svg#pn-mx" />
</svg>
```

The sprite must be served from the same origin as the page: browsers don't load `<use>`
references from other origins.

## Weight

- Each stylesheet is 15–17 KB minified (under 2 KB gzip). Each flag image is downloaded only
  when an element on the page uses its class.
- The Web Component is about <Size probe="element" metric="gzip" /> gzip on first load. Each
  flag is a separate chunk of a few KB, fetched on demand.
- `<img>` and the sprite need no JavaScript. The sprite holds every flag in one file of about
  1 MB, so use it only when you show many flags.
