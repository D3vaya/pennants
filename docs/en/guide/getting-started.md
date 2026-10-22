# Getting started

`pennants` ships 271 flags (249 ISO 3166-1 countries plus regions and organizations) in pennant
shape: a hanging golden bar over a flag cut into a point. Every pennant is 66 × 72. The same
flags also come as rectangles (4:3), squares and circles; see [Shapes](./shapes).

## Install

::: code-group

```sh [npm]
npm install pennants
```

```sh [pnpm]
pnpm add pennants
```

```sh [yarn]
yarn add pennants
```

:::

Or skip the install and load files from jsDelivr. Pin the version in production:

```html
<img
  src="https://cdn.jsdelivr.net/npm/pennants@0.1.0/svg/pennant/ar.svg"
  width="33"
  height="36"
  alt="Argentina"
/>
```

## Requirements

- ESM only. Node.js 20.19 or later for tooling and SSR.
- Any evergreen browser. The JavaScript targets ES2022.
- TypeScript users need `moduleResolution` set to `bundler`, `node16` or `nodenext` so the
  `exports` subpaths resolve.
- React 18 or later, only if you use `pennants/react`.

## Tour

### CSS classes

No JavaScript. In a Vite build the stylesheet adds <Size probe="css" part="css" /> gzip, and
each flag image is fetched only when an element uses its class.

```js
import 'pennants/css'; // or 'pennants/css/rect', 'pennants/css/square', 'pennants/css/circle'
```

```html
<span class="pn pn-ar" role="img" aria-label="Argentina"></span>
<span class="pn pn-jp pn-2x" aria-hidden="true"></span>
```

`.pn` is `1em` high, so it follows `font-size`. Helpers: `.pn-lg`, `.pn-2x`, `.pn-3x`, `.pn-4x`.

::: warning Vite, SvelteKit and Astro
By default Vite inlines every flag under 4 KiB into your CSS as a data URI, which grows the
stylesheet to <Size probe="css-default" part="css" metric="min" /> min
(<Size probe="css-default" part="css" /> gzip). Either import `pennants/css/cdn`, which
points at version-pinned jsDelivr URLs that bundlers leave alone, or keep the flags as local
files with [`assetsInlineLimit`](./faq#bundler-asset-imports). Next.js and Angular do not
inline them.
:::

### Images

```html
<img src="/assets/pennants/svg/pennant/ar.svg" width="33" height="36" alt="Argentina" />
<img
  src="/assets/pennants/png/pennant/1x/ar.png"
  srcset="/assets/pennants/png/pennant/2x/ar.png 2x"
  width="66"
  height="72"
  alt="Argentina"
/>
```

Copy `node_modules/pennants/svg` (and `png`) into your public folder, or use the CDN URLs from
`pennantUrl(code)`.

### One module per flag

Each flag's artwork is its own module, tree-shaken; `renderFlag` frames it in any shape.

```js
import { renderFlag } from 'pennants';
import ar from 'pennants/art/1x1/ar';

element.innerHTML = renderFlag(ar); // or renderFlag(ar, { shape: 'circle' })
```

### Lazy loading

```js
import { loadFlag, toPennantCode } from 'pennants';

const svg = await loadFlag(toPennantCode(userInput)); // fetches one small chunk
const circle = await loadFlag('jp', { shape: 'circle' });
```

### Fetch mode

`loadFlag` bundles a small loader map with one chunk per flag. Fetch mode skips that: it
downloads `<base>/svg/<shape>/<code>.svg` at runtime, from jsDelivr by default or from your own copy of
the `svg/` folder.

```js
import { fetchPennant } from 'pennants/fetch';

const svg = await fetchPennant('ar'); // or fetchPennant('ar', { base: '/assets/pennants' })
```

The same mode exists in the components: `<Pennant code="ar" mode="fetch" />` and
`<pennant-flag code="ar" base="https://cdn.jsdelivr.net/npm/pennants@0.1.0">`.
Responses are cached per URL and must be a script-free `<svg>` document.

### React

```jsx
import { Pennant } from 'pennants/react';

<Pennant code="ar" size={32} />;
<Pennant code="ar" shape="circle" size={32} />;
```

### Web Component

```js
import 'pennants/element/register';
```

```html
<pennant-flag code="ar" size="32"></pennant-flag>
<pennant-flag code="ar" shape="rect" size="32"></pennant-flag>
```

## Next steps

- [Which format should I use?](./formats) compares bundle cost, SSR, theming and caching.
- [Gallery](/gallery): every flag with copy-ready snippets.
- [API reference](/api/).
