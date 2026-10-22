# pennants

Country flags in pennant (banderín) style: a golden hanging bar over a flag cut into a pointed
pennant. 271 flags (249 ISO 3166-1 countries plus regions and organizations) shipped as SVG,
PNG, CSS classes, an SVG sprite, tree-shakable ES modules, a React component and a Web Component.

The flag artwork comes from [flag-icons](https://github.com/lipis/flag-icons) (MIT); `pennants`
wraps it in the pennant frame and adds a typed JavaScript API.

- Every pennant is 66 × 72 (aspect ratio 11:12).
- ESM only, TypeScript types included, zero runtime dependencies.
- Node.js >= 20.19 for tooling; any modern browser at runtime.

## Install

```sh
npm install pennants
```

Or use the CDN without installing:

```html
<img
  src="https://cdn.jsdelivr.net/npm/pennants@0.1.0/svg/ar.svg"
  width="33"
  height="36"
  alt="Argentina"
/>
```

Always pin a version in CDN URLs.

## Usage

### Static files

| Path                         | Content                              |
| ---------------------------- | ------------------------------------ |
| `pennants/svg/<code>.svg`    | Standalone SVG                       |
| `pennants/png/1x/<code>.png` | PNG, 66 × 72                         |
| `pennants/png/2x/<code>.png` | PNG, 132 × 144                       |
| `pennants/sprite`            | SVG sprite (`sprite/pennants.svg`)   |
| `pennants/css`               | CSS classes (`css/pennants.min.css`) |

```js
import arUrl from 'pennants/svg/ar.svg'; // your bundler turns this into a URL
```

### CSS classes

```js
import 'pennants/css';
```

```html
<span class="pn pn-ar"></span> <span class="pn pn-ar pn-2x"></span>
```

`.pn` is `1em` high and keeps the 11:12 ratio, so it scales with `font-size`. Size helpers:
`.pn-lg`, `.pn-2x`, `.pn-3x`, `.pn-4x`. Add `role="img"` and `aria-label` when the flag carries
meaning; otherwise add `aria-hidden="true"`.

### SVG sprite

```html
<svg width="33" height="36" role="img" aria-label="Argentina">
  <use href="/assets/pennants.svg#pn-ar" />
</svg>
```

Copy `node_modules/pennants/sprite/pennants.svg` to your public folder. Symbol ids are
`pn-<code>`.

### Per-flag modules

Each flag is its own module that exports the SVG markup as a string. Bundlers only include the
flags you import.

```js
import ar from 'pennants/flags/ar';

element.innerHTML = ar;
```

Only insert markup that comes from `pennants/flags/*` or `loadPennant` this way (and through
`<PennantSvg>`). Never pass user-provided strings to `innerHTML` or `PennantSvg`: they are not
sanitized.

### Core API

```js
import { isPennantCode, toPennantCode, loadPennant, getPennantName, pennantUrl } from 'pennants';

isPennantCode('ar'); // true
isPennantCode('AR'); // false: exact lowercase match
const code = toPennantCode(' AR '); // 'ar' (normalize user input; throws RangeError if unknown)

const svg = await loadPennant(code); // fetches only this flag's chunk

getPennantName('ar'); // 'Argentina'
getPennantName('ar', 'es'); // 'Argentina'
getPennantName('de', 'es'); // 'Alemania'
pennantUrl('ar'); // 'https://cdn.jsdelivr.net/npm/pennants@0.1.0/svg/ar.svg'
pennantUrl('ar', { format: 'png', scale: 2 }); // '.../png/2x/ar.png'
```

| Export                            | Description                                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `codes`                           | All supported codes, lowercase (`readonly PennantCode[]`).                                                            |
| `isoCodes`                        | The ISO 3166-1 alpha-2 subset.                                                                                        |
| `type PennantCode`                | Union of every supported code.                                                                                        |
| `isPennantCode(value)`            | Type guard. Exact lowercase match; use `toPennantCode` for user input.                                                |
| `toPennantCode(value)`            | Trims and lowercases; throws `RangeError` on unknown codes.                                                           |
| `loadPennant(code)`               | `Promise<string>` with the SVG markup. Each flag is a separate lazy chunk.                                            |
| `getPennantName(code, locale?)`   | Localized name via `Intl.DisplayNames`; falls back to English (`eu`, `gb-eng`, ...). Default `'en'`.                  |
| `toDataUri(svg)`                  | Encodes markup as a `data:image/svg+xml` URI.                                                                         |
| `pennantUrl(code, options?)`      | URL of a static asset. Options: `base` (default `DEFAULT_CDN_BASE`), `format` (`'svg'` \| `'png'`), `scale` (1 \| 2). |
| `toEmoji(code)`                   | Emoji flag for ISO codes; `''` when none exists (`xx`, `gb-eng`, `eu`).                                               |
| `PENNANT_WIDTH`, `PENNANT_HEIGHT` | `66`, `72`.                                                                                                           |
| `PENNANT_ASPECT_RATIO`            | `66 / 72`.                                                                                                            |
| `DEFAULT_CDN_BASE`                | `https://cdn.jsdelivr.net/npm/pennants@<installed version>`, so URLs match the installed assets.                      |

To serve assets yourself, copy `svg/` (and `png/`) to your public folder and pass
`pennantUrl(code, { base: '/assets/pennants' })`.

### React

React >= 18 is an optional peer dependency.

```jsx
import { Pennant, PennantSvg } from 'pennants/react';
import ar from 'pennants/flags/ar';

<Pennant code="ar" size={32} />                       // inline SVG, chunk loaded lazily
<Pennant code="ar" size={32} mode="img" base="/assets/pennants" /> // <img> to a static file
<PennantSvg svg={ar} size="2rem" />                   // inline SVG, bundled and SSR-ready
```

| Prop       | Components   | Description                                                                                                         |
| ---------- | ------------ | ------------------------------------------------------------------------------------------------------------------- |
| `code`     | `Pennant`    | Flag code, lowercase or uppercase (`ar`, `GB-ENG`). Unknown codes throw a `RangeError` during render.               |
| `svg`      | `PennantSvg` | Markup from `pennants/flags/*`. Must be trusted (see above).                                                        |
| `size`     | both         | Height as px number or CSS length. Width follows 66:72. Default `1em`.                                              |
| `title`    | both         | Accessible name. Defaults to `getPennantName(code, locale)`. `""` makes it decorative (`aria-hidden`, empty `alt`). |
| `locale`   | both         | Locale for the default name. Default `'en'`.                                                                        |
| `mode`     | `Pennant`    | `'inline'` (default) or `'img'`.                                                                                    |
| `base`     | `Pennant`    | `img` mode: where `svg/` is served (see `pennantUrl`). Default `DEFAULT_CDN_BASE`.                                  |
| `loading`  | `Pennant`    | `img` mode: `'lazy'` (default) or `'eager'`.                                                                        |
| `decoding` | `Pennant`    | `img` mode: `'async'` (default), `'sync'` or `'auto'`.                                                              |

Other HTML attributes (`className`, `style`, `data-*`, ...) and `ref` are forwarded. Inline
output is a `<span data-pennant="<code>">` wrapping the SVG; the box is reserved while the chunk
loads, and SVG ids are made unique per instance. `pennantBox(size)` returns the
`{ width, height }` used for the box, for custom wrappers.

### Web Component

```js
import 'pennants/element/register';
```

```html
<pennant-flag code="ar" size="32"></pennant-flag>
<pennant-flag code="ar" size="2rem" label="Argentina"></pennant-flag>
<!-- decorative: -->
<pennant-flag code="ar" label=""></pennant-flag>
```

| Attribute / API       | Description                                                                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `code`                | Flag code (any casing). The flag chunk is loaded lazily into a shadow root.                                                                                           |
| `size`                | Height in px (`32`) or any CSS length. Sets `--pennant-size` inline; removing it restores your own inline value.                                                      |
| `label`               | Accessible name. Defaults to the English flag name. `""` is decorative (`aria-hidden`). Without a name (unknown code, failed load) the element is also `aria-hidden`. |
| `--pennant-size`      | CSS custom property for the height (default `1em`); width follows 66:72.                                                                                              |
| `::part(svg)`         | Styles the wrapper around the inner SVG.                                                                                                                              |
| `pennant-load` event  | Fires when the flag renders. `event.detail.code`. Bubbles.                                                                                                            |
| `pennant-error` event | Fires on an unknown code or failed load. `event.detail.{ code, error }`. Bubbles.                                                                                     |

```js
document.addEventListener('pennant-error', (event) => console.warn(event.detail.code));
```

`code`, `size` and `label` are also available as properties. Importing `pennants/element`
does not register anything; call `definePennantElement` to choose the tag name. It returns the
constructor, is idempotent, and is a no-op where `customElements` is unavailable (SSR).

```js
import { definePennantElement } from 'pennants/element';

definePennantElement('my-flag');
```

### Theming the bar

Inline SVG (per-flag modules, `loadPennant`, `<Pennant>`, `<pennant-flag>`) reads two CSS
custom properties for the golden bar gradient:

```css
.silver {
  --pennant-bar-light: #e6e6e6;
  --pennant-bar-dark: #8a8a8a;
}
```

Defaults are `#d5b97a` and `#8e713f`. Images (`<img>`, PNG, CSS background) cannot be themed.

## Codes

Codes are lowercase ISO 3166-1 alpha-2 (`ar`, `de`, `jp`), plus:

| Code                                        | Flag                                                                         |
| ------------------------------------------- | ---------------------------------------------------------------------------- |
| `gb-eng`, `gb-sct`, `gb-wls`, `gb-nir`      | England, Scotland, Wales, Northern Ireland                                   |
| `es-ct`, `es-ga`, `es-pv`                   | Catalonia, Galicia, Basque Country                                           |
| `sh-ac`, `sh-hl`, `sh-ta`                   | Ascension, Saint Helena, Tristan da Cunha                                    |
| `eu`, `un`, `arab`, `asean`, `cefta`, `eac` | Organizations                                                                |
| `ic`, `cp`, `dg`, `pc`, `xk`, `xx`          | Canary Islands, Clipperton, Diego Garcia, Pacific Community, Kosovo, unknown |

The full list is exported as `codes`.

## Comparison with flag-icons

|                      | flag-icons            | pennants                               |
| -------------------- | --------------------- | -------------------------------------- |
| Shape                | Rectangle 4:3 and 1:1 | Pennant 11:12                          |
| SVG files            | Yes                   | Yes                                    |
| CSS classes          | Yes (`fi fi-ar`)      | Yes (`pn pn-ar`)                       |
| PNG                  | No                    | 1x and 2x                              |
| SVG sprite           | No                    | Yes                                    |
| JS modules per flag  | No                    | Yes, tree-shakable                     |
| Lazy loading API     | No                    | `loadPennant(code)`                    |
| TypeScript types     | No                    | `PennantCode` union, typed API         |
| Localized names      | No                    | `getPennantName` (`Intl.DisplayNames`) |
| React component      | No                    | `pennants/react`                       |
| Web Component        | No                    | `<pennant-flag>`                       |
| Themeable inline SVG | No                    | CSS custom properties                  |

If you need plain rectangular flags, use flag-icons directly.

## Demo

`demo/index.html` is a static gallery with search, size control and copyable snippets. Build
the assets (`npm run build`) and serve the repository root, for example
`npx serve .`, then open `/demo/`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Report vulnerabilities as described in
[SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © 2026 d3vaya. Flag artwork from flag-icons, MIT © 2013 Panayiotis Lipiridis; see
[NOTICE](NOTICE).

## En español

`pennants` ofrece banderas de países con forma de banderín (barra dorada y punta), basadas en
las banderas de flag-icons. Incluye SVG, PNG, clases CSS, sprite SVG, módulos ES por bandera,
un componente de React y un Web Component.

```sh
npm install pennants
```

```js
import 'pennants/css'; // <span class="pn pn-ar"></span>
import ar from 'pennants/flags/ar'; // SVG como string
import { getPennantName } from 'pennants';

getPennantName('de', 'es'); // 'Alemania'
```

Los códigos son ISO 3166-1 alfa-2 en minúsculas (`ar`, `es`, `mx`) más regiones como `es-ct`
o `gb-eng`. Las issues y PRs pueden escribirse en español o en inglés.
