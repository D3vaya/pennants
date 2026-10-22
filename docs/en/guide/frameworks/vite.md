# Vite

Any Vite app (vanilla, React, Vue, Svelte, Solid...) can use every format. This page uses
vanilla TypeScript.

[Full example](https://github.com/d3vaya/pennants/tree/main/examples/vite)

```sh
npm install pennants
```

## Stop Vite from inlining the flags

Each stylesheet (`pennants/css`, `pennants/css/rect`, `pennants/css/square`,
`pennants/css/circle`) references 271 flag SVGs. By default, Vite inlines every asset under
4 KiB as a data URI, which puts most flags into your CSS. Emit them as files instead:

```ts [vite.config.ts]
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    assetsInlineLimit: (file) => (file.includes('/pennants/svg/') ? false : undefined),
  },
});
```

Or import the CDN variant (`pennants/css/cdn`, `pennants/css/circle/cdn`...). Its image
URLs point to jsDelivr, so Vite has nothing to inline or emit.

| `import 'pennants/css'`        | CSS (min / gzip / brotli)                                                                                                                                | Flag images                      |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Vite defaults                  | <Size probe="css-default" part="css" metric="min" /> / <Size probe="css-default" part="css" /> / <Size probe="css-default" part="css" metric="brotli" /> | most inlined in the CSS          |
| With `assetsInlineLimit` above | <Size probe="css" part="css" metric="min" /> / <Size probe="css" part="css" /> / <Size probe="css" part="css" metric="brotli" />                         | 271 files, fetched when used     |
| `pennants/css/cdn` instead     | <Size probe="css-cdn" part="css" metric="min" /> / <Size probe="css-cdn" part="css" /> / <Size probe="css-cdn" part="css" metric="brotli" />             | from jsDelivr, fetched when used |

## Usage

```ts [src/main.ts]
// Stylesheet for the `pn pn-xx` classes (pennant shape).
import 'pennants/css';
// Flag artwork: only the flags you import are bundled. 1x1 art draws
// pennant, square and circle; 4x3 art draws rect.
import ar from 'pennants/art/1x1/ar';
import ar4x3 from 'pennants/art/4x3/ar';
import { getPennantName, loadFlag, renderFlag, toPennantCode } from 'pennants';
// Static files as hashed URLs.
import deUrl from 'pennants/svg/pennant/de.svg?url';
import spriteUrl from 'pennants/sprite?url';

// Same art, any shape (synchronous, works during SSR too).
document.querySelector('#circle')!.innerHTML = renderFlag(ar, { shape: 'circle' });
document.querySelector('#rect')!.innerHTML = renderFlag(ar4x3, { shape: 'rect' });

// Runtime codes: loads only this flag's chunk.
const code = toPennantCode('BR'); // 'br'; throws RangeError on unknown codes
const lazy = document.querySelector('#lazy')!;
lazy.innerHTML = await loadFlag(code, { shape: 'square' });
lazy.setAttribute('role', 'img');
lazy.setAttribute('aria-label', getPennantName(code));

document.querySelector<HTMLImageElement>('#img')!.src = deUrl;
document.querySelector('#sprite')!.setAttribute('href', `${spriteUrl}#pn-mx`);
```

Each shape has its own stylesheet and base class, so they mix on one page. Add
`import 'pennants/css/circle'`, then:

```html
<span class="pn pn-ar pn-2x" role="img" aria-label="Argentina"></span>
<span class="pn-circle pn-ar pn-2x" role="img" aria-label="Argentina"></span>
<svg width="33" height="36" role="img" aria-label="Mexico"><use id="sprite" /></svg>
```

Only insert markup from `renderFlag`, `loadFlag` or `fetchPennant` with `innerHTML`. Never
insert user input this way.

`pennants/sprite` contains pennants only. For the `?url` imports, add
`"types": ["vite/client"]` to your tsconfig.

## Bundle impact

Measured with Vite 8, production build, compared with an empty app:

<SizeTable :probes="['art-pennant', 'art-circle', 'art-all', 'name', 'url', 'load', 'load-shapes', 'fetch', 'element']" />

Art modules are the lightest way to show a few known flags, and one art module serves every
shape. `loadFlag` and the Web Component cost a fixed few KB, then one small chunk per flag
on demand. `fetchPennant` from `pennants/fetch` skips bundled chunks entirely and fetches
`svg/<shape>/<code>.svg` from the CDN (or your `base`).
