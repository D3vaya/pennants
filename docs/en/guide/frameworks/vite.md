# Vite

Any Vite app (vanilla, React, Vue, Svelte, Solid...) can use every format. This page uses
vanilla TypeScript.

[Full example](https://github.com/d3vaya/pennants/tree/main/examples/vite)

```sh
npm install pennants
```

## Stop Vite from inlining the flags

`pennants.min.css` references all 271 flag SVGs. By default, Vite inlines every asset under
4 KiB as a data URI, which would put about 380 KB of flags into your CSS. Emit them as files
instead:

```ts [vite.config.ts]
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    assetsInlineLimit: (file) => (file.includes('/pennants/svg/') ? false : undefined),
  },
});
```

| `import 'pennants/css/pennants.min.css'` | CSS (min / gzip) | Flag files                   |
| ---------------------------------------- | ---------------- | ---------------------------- |
| Vite default                             | 388 KB / 56 KB   | most inlined in the CSS      |
| With `assetsInlineLimit` above           | 14.8 KB / 3.7 KB | 271 files, fetched when used |

## Usage

```ts [src/main.ts]
// Stylesheet for the `pn pn-xx` classes.
import 'pennants/css/pennants.min.css';
// One flag as an SVG string. Only the flags you import are bundled.
import ar from 'pennants/flags/ar';
import { getPennantName, loadPennant, toPennantCode } from 'pennants';
// Static files as hashed URLs.
import deUrl from 'pennants/svg/de.svg?url';
import spriteUrl from 'pennants/sprite?url';

document.querySelector('#inline')!.innerHTML = ar;

const code = toPennantCode('BR'); // 'br'; throws RangeError on unknown codes
const lazy = document.querySelector('#lazy')!;
lazy.innerHTML = await loadPennant(code); // fetches only this flag's chunk
lazy.setAttribute('role', 'img');
lazy.setAttribute('aria-label', getPennantName(code));

document.querySelector<HTMLImageElement>('#img')!.src = deUrl;
document.querySelector('#sprite')!.setAttribute('href', `${spriteUrl}#pn-mx`);
```

```html
<span class="pn pn-ar pn-2x" role="img" aria-label="Argentina"></span>
<svg width="33" height="36" role="img" aria-label="Mexico"><use id="sprite" /></svg>
```

Only insert markup from `pennants/flags/*` or `loadPennant` with `innerHTML`. Never insert
user input this way.

::: tip TypeScript
Write `import 'pennants/css/pennants.min.css'` rather than `import 'pennants/css'`. With
TypeScript 6, `noUncheckedSideEffectImports` is on by default, and the short specifier
fails with `TS2882`: it doesn't end in `.css`, so the `*.css` declarations from
`vite/client` don't apply. Add `"types": ["vite/client"]` to your tsconfig for the `?url`
imports.
:::

## Bundle impact

Measured with Vite 8, production build, compared with an empty app:

| You import                  | Entry JS (min / gzip) | Other files                   |
| --------------------------- | --------------------- | ----------------------------- |
| `pennants/flags/ar`         | +3.2 KB / +1.0 KB     | none                          |
| three per-flag modules      | +8.1 KB / +2.2 KB     | none                          |
| `getPennantName`            | +2.6 KB / +1.1 KB     | none                          |
| `pennantUrl`                | +2.0 KB / +0.8 KB     | none                          |
| `loadPennant`               | +15.4 KB / +5.1 KB    | one lazy chunk per flag shown |
| `pennants/element/register` | +19.5 KB / +7.0 KB    | one lazy chunk per flag shown |

Per-flag modules are the lightest way to show a few known flags. `loadPennant` and the Web
Component cost a fixed ~5–7 KB gzip, then a few KB per flag on demand.
