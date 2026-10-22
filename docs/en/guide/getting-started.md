# Getting started

`pennants` ships 271 flags (249 ISO 3166-1 countries plus regions and organizations) in pennant
shape: a hanging golden bar over a flag cut into a point. Every pennant is 66 × 72 (ratio 11:12).

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
  src="https://cdn.jsdelivr.net/npm/pennants@0.1.0/svg/ar.svg"
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

No JavaScript. In a Vite 8 build the stylesheet adds 3.7 kB gzip, and each flag image is
fetched only when an element uses its class.

```js
import 'pennants/css';
```

```html
<span class="pn pn-ar" role="img" aria-label="Argentina"></span>
<span class="pn pn-jp pn-2x" aria-hidden="true"></span>
```

`.pn` is `1em` high, so it follows `font-size`. Helpers: `.pn-lg`, `.pn-2x`, `.pn-3x`, `.pn-4x`.

::: warning Vite, SvelteKit and Astro
By default Vite inlines every flag under 4 KiB into your CSS as a data URI, which grows the
stylesheet to 372 kB min (52 kB gzip) in Vite 8.3.5. Either import `pennants/css/cdn`, which
points at version-pinned jsDelivr URLs that bundlers leave alone, or keep the flags as local
files with [`assetsInlineLimit`](./faq#bundler-asset-imports). Next.js and Angular do not
inline them.
:::

### Images

```html
<img src="/assets/pennants/svg/ar.svg" width="33" height="36" alt="Argentina" />
<img
  src="/assets/pennants/png/1x/ar.png"
  srcset="/assets/pennants/png/2x/ar.png 2x"
  width="66"
  height="72"
  alt="Argentina"
/>
```

Copy `node_modules/pennants/svg` (and `png`) into your public folder, or use the CDN URLs from
`pennantUrl(code)`.

### One module per flag

```js
import ar from 'pennants/flags/ar'; // SVG markup as a string, tree-shaken

element.innerHTML = ar;
```

### Lazy loading

```js
import { loadPennant, toPennantCode } from 'pennants';

const svg = await loadPennant(toPennantCode(userInput)); // fetches one small chunk
```

### React

```jsx
import { Pennant } from 'pennants/react';

<Pennant code="ar" size={32} />;
```

### Web Component

```js
import 'pennants/element/register';
```

```html
<pennant-flag code="ar" size="32"></pennant-flag>
```

## Next steps

- [Which format should I use?](./formats) compares bundle cost, SSR, theming and caching.
- [Gallery](/gallery): every flag with copy-ready snippets.
- [API reference](/api/).
