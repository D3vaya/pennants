# Which format should I use?

All formats show the same artwork. They differ in what they cost, where they render and what
you can change. Costs are what each option adds to an empty Vite production build (gzip),
read from the bundle-budget snapshot; [Performance & weight](./performance) has min and brotli
too.

| Format                                    | Added to your app (gzip)                                       | SSR                           | Bar theming | Lazy                 | Caching                       |
| ----------------------------------------- | -------------------------------------------------------------- | ----------------------------- | ----------- | -------------------- | ----------------------------- |
| CSS classes `pn pn-ar`, `pn-circle pn-ar` | 0 JS, <Size probe="css" part="css" /> CSS ¹                    | Yes                           | No          | Yes, per used class  | One file per flag, HTTP cache |
| `<img>` SVG (self-hosted or CDN)          | 0                                                              | Yes                           | No          | `loading="lazy"`     | HTTP / CDN cache              |
| `<img>` PNG 1x / 2x                       | 0                                                              | Yes                           | No          | `loading="lazy"`     | HTTP / CDN cache              |
| SVG sprite `<use href>`                   | 0 JS; one 1.15 MB file (248 kB brotli)                         | Yes                           | No          | No, one file for all | One file, HTTP cache          |
| Art module `pennants/art/1x1/ar`          | <Size probe="art-pennant" /> for the first flag                | Yes                           | Yes         | No, bundled          | Part of your bundle           |
| `loadFlag(code)`                          | <Size probe="load" /> (loader maps) + one chunk per flag shown | Client (async)                | Yes         | Yes                  | Chunk files, HTTP cache       |
| Fetch mode ³                              | <Size probe="fetch" /> + one request per flag shown            | Client (async)                | Yes         | Yes                  | HTTP / CDN cache              |
| React `<Pennant>`                         | <Size probe="react-pennant" /> + one chunk per flag shown      | Box on server, flag on client | Yes         | Yes                  | Chunk files                   |
| React `<PennantSvg art={ar}>`             | <Size probe="react-svg" /> including `ar` ²                    | Yes, full markup              | Yes         | No                   | Part of your bundle           |
| `<pennant-flag>`                          | <Size probe="element" /> + one chunk per flag shown            | Client only                   | Yes         | Yes                  | Chunk files                   |

¹ With `assetsInlineLimit` set as in the [FAQ](./faq#bundler-asset-imports), or
<Size probe="css-cdn" part="css" /> with `pennants/css/cdn` (flags from jsDelivr). Without
either, Vite inlines the flags and the CSS is <Size probe="css-default" part="css" /> gzip.
Next.js and Angular emit files by default.

² In a Next.js Server Component, `<PennantSvg>` adds no client JavaScript: it renders to HTML.

³ `fetchPennant` from `pennants/fetch`, `<Pennant mode="fetch">`, or `<pennant-flag>` with a
`base` attribute. Needs `connect-src` for the host in a CSP.

## Quick decisions

- **Static site, a few flags, no build step:** `<img>` from the CDN.
- **Many flags in server-rendered HTML** (tables, country pickers): CSS classes. The browser
  downloads only the flags on the page.
- **Flags known at build time, must be visible on first paint with SSR:** per-flag modules,
  in React through `<PennantSvg art={ar} />`.
- **Flag chosen at runtime** (user profile, API data): `loadFlag`, `<Pennant>` or
  `<pennant-flag>`. For the smallest bundle, use fetch mode: no loader map, flags are
  downloaded as SVG files from the CDN or your own host.
- **You want to recolor the bar:** inline SVG (modules, `loadFlag`, React) with
  `pennants/css/theme.css`, or `<pennant-flag>`. See [Theming](./theming).
- **Email, native apps, Open Graph images:** PNG.
- **Hundreds of flags on one page at once:** the sprite, or CSS classes.

## SSR notes

`<Pennant>` in inline mode renders an empty box of the right size on the server and fills it
after hydration, so there is no layout shift but the flag is not in the HTML. If it must be,
use `mode="img"` or `<PennantSvg>` with a static import. `<pennant-flag>` renders in the browser
only. See the [FAQ](./faq#ssr-and-hydration).
