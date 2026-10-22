# Which format should I use?

All formats show the same artwork. They differ in what they cost, where they render and what
you can change.

| Format                           | Bundle cost (min + brotli)             | SSR                           | Bar theming | Lazy                 | Caching                       |
| -------------------------------- | -------------------------------------- | ----------------------------- | ----------- | -------------------- | ----------------------------- |
| CSS classes `pn pn-ar`           | 0 JS, 930 B CSS                        | Yes                           | No          | Yes, per used class  | One file per flag, HTTP cache |
| `<img>` SVG (self-hosted or CDN) | 0                                      | Yes                           | No          | `loading="lazy"`     | HTTP / CDN cache              |
| `<img>` PNG 1x / 2x              | 0                                      | Yes                           | No          | `loading="lazy"`     | HTTP / CDN cache              |
| SVG sprite `<use href>`          | 0 JS, one 1.2 MB file (≈260 kB brotli) | Yes                           | No          | No, one file for all | One file, HTTP cache          |
| JS module `pennants/flags/ar`    | ≈0.5 kB per flag (`ar`: 962 B)         | Yes                           | Yes         | No, bundled          | Part of your bundle           |
| `loadPennant(code)`              | 1.48 kB + one chunk per flag on use    | Client (async)                | Yes         | Yes                  | Chunk files, HTTP cache       |
| React `<Pennant>`                | 2.76 kB + chunk on use                 | Box on server, flag on client | Yes         | Yes                  | Chunk files                   |
| React `<PennantSvg svg={ar}>`    | 2.76 kB + the imported flags           | Yes, full markup              | Yes         | No                   | Part of your bundle           |
| `<pennant-flag>`                 | 2.98 kB + chunk on use                 | Client only                   | Yes         | Yes                  | Chunk files                   |

## Quick decisions

- **Static site, a few flags, no build step:** `<img>` from the CDN.
- **Many flags in server-rendered HTML** (tables, country pickers): CSS classes. The browser
  downloads only the flags on the page.
- **Flags known at build time, must be visible on first paint with SSR:** per-flag modules,
  in React through `<PennantSvg svg={ar} />`.
- **Flag chosen at runtime** (user profile, API data): `loadPennant`, `<Pennant>` or
  `<pennant-flag>`.
- **You want to recolor the bar:** any inline format (modules, `loadPennant`, React,
  Web Component). See [Theming](./theming).
- **Email, native apps, Open Graph images:** PNG.
- **Hundreds of flags on one page at once:** the sprite, or CSS classes.

## SSR notes

`<Pennant>` in inline mode renders an empty box of the right size on the server and fills it
after hydration, so there is no layout shift but the flag is not in the HTML. If it must be,
use `mode="img"` or `<PennantSvg>` with a static import. `<pennant-flag>` renders in the browser
only. See the [FAQ](./faq#ssr-and-hydration).
