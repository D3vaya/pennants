# Which format should I use?

All formats show the same artwork. They differ in what they cost, where they render and what
you can change. Costs below are what each option adds to an empty Vite 8 production app
(gzip); see [Performance & weight](./performance) for raw sizes and the library-only numbers.

| Format                           | Added to your app (gzip)                        | SSR                           | Bar theming | Lazy                 | Caching                       |
| -------------------------------- | ----------------------------------------------- | ----------------------------- | ----------- | -------------------- | ----------------------------- |
| CSS classes `pn pn-ar`           | 0 JS, ≈3.7 kB CSS ¹                             | Yes                           | No          | Yes, per used class  | One file per flag, HTTP cache |
| `<img>` SVG (self-hosted or CDN) | 0                                               | Yes                           | No          | `loading="lazy"`     | HTTP / CDN cache              |
| `<img>` PNG 1x / 2x              | 0                                               | Yes                           | No          | `loading="lazy"`     | HTTP / CDN cache              |
| SVG sprite `<use href>`          | 0 JS; one 1.2 MB file (≈260 kB brotli)          | Yes                           | No          | No, one file for all | One file, HTTP cache          |
| JS module `pennants/flags/ar`    | ≈1.0 kB per flag                                | Yes                           | Yes         | No, bundled          | Part of your bundle           |
| `loadPennant(code)`              | ≈5.1 kB (loader map) + one chunk per flag shown | Client (async)                | Yes         | Yes                  | Chunk files, HTTP cache       |
| React `<Pennant>`                | ≈6.9 kB + one chunk per flag shown              | Box on server, flag on client | Yes         | Yes                  | Chunk files                   |
| React `<PennantSvg svg={ar}>`    | ≈8.0 kB including `ar` ²                        | Yes, full markup              | Yes         | No                   | Part of your bundle           |
| `<pennant-flag>`                 | ≈7.0 kB + one chunk per flag shown              | Client only                   | Yes         | Yes                  | Chunk files                   |

¹ With `assetsInlineLimit` set as in the [FAQ](./faq#bundler-asset-imports), or 1.9 kB with
`pennants/css/cdn` (flags from jsDelivr); without either, Vite
inlines the flags and the CSS is 52 kB gzip. Next.js and Angular emit files by default.

² In a Next.js Server Component, `<PennantSvg>` adds no client JavaScript: it renders to HTML.

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
