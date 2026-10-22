# HTML & CDN

No build step. Load the stylesheet and the Web Component from jsDelivr, or copy the files from
`node_modules/pennants` to your server.

[Full example](https://github.com/d3vaya/pennants/tree/main/examples/html-cdn)

## From the CDN

Always pin the version in CDN URLs.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pennants@0.1.0/css/pennants.min.css" />
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/pennants@0.1.0/dist/element/register.js"
></script>

<!-- CSS classes: no JavaScript -->
<span class="pn pn-ar" role="img" aria-label="Argentina"></span>
<span class="pn pn-br pn-2x" role="img" aria-label="Brazil"></span>

<!-- Plain image -->
<img
  src="https://cdn.jsdelivr.net/npm/pennants@0.1.0/svg/jp.svg"
  width="33"
  height="36"
  alt="Japan"
/>

<!-- Web Component: fetches only this flag -->
<pennant-flag code="de" size="48"></pennant-flag>
```

## Self-hosted

```sh
npm install pennants
```

Copy `css/`, `svg/`, `sprite/` and `dist/` from `node_modules/pennants` into a public folder
(the example's `build.js` copies them into `dist/pennants/`). Keep `css/` and `svg/` side by
side: the stylesheet loads `../svg/<code>.svg`.

```html
<link rel="stylesheet" href="./pennants/css/pennants.min.css" />
<script type="module" src="./pennants/dist/element/register.js"></script>

<img src="./pennants/svg/jp.svg" width="33" height="36" alt="Japan" />

<svg width="33" height="36" role="img" aria-label="Mexico">
  <use href="./pennants/sprite/pennants.svg#pn-mx" />
</svg>
```

The sprite must be served from the same origin as the page: browsers don't load `<use>`
references from other origins.

## Weight

- The stylesheet is about 12 KB minified (under 2 KB gzip). Each flag image is
  downloaded only when an element on the page uses its class.
- The Web Component is about 20 KB minified (7 KB gzip) on first load. Each flag is a separate
  chunk of a few KB, fetched on demand.
- `<img>` and the sprite need no JavaScript. The sprite is one 1.1 MB file (about 290 KB
  gzip) with every flag, so use it only when you show many flags.
