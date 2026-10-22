# Performance & weight

All numbers on this page are measured, not estimated, and you can reproduce them:

- bundle costs with `npm run bundle:budget` (Vite probes built against the packed library),
- file sizes and the [comparison](./comparison) with `node scripts/docs-compare.ts`.

## What it adds to your app

Vite 8.3.5 production build. Each row is the difference against an empty app (React rows
against an empty React app: 219.5 kB min / 67.7 kB gzip). Sizes are min / gzip / brotli.

| You use                               | Entry JS                     | CSS                             | Lazy JS files ¹ |
| ------------------------------------- | ---------------------------- | ------------------------------- | --------------- |
| `pennantUrl`                          | +2.0 kB / +801 B / +586 B    |                                 | 0               |
| `getPennantName`                      | +2.6 kB / +1.1 kB / +840 B   |                                 | 0               |
| One flag module (`pennants/flags/ar`) | +3.2 kB / +1.0 kB / +933 B   |                                 | 0               |
| `loadPennant`                         | +15.4 kB / +5.1 kB / +3.8 kB |                                 | 271             |
| `pennants/element/register`           | +19.6 kB / +7.0 kB / +5.3 kB |                                 | 271             |
| React `<Pennant>`                     | +18.5 kB / +6.9 kB / +5.0 kB |                                 | 271             |
| React `<PennantSvg>` with one flag    | +21.8 kB / +8.0 kB / +5.9 kB |                                 | 270             |
| CSS, `assetsInlineLimit` set ²        | +27 B                        | +14.8 kB / +3.7 kB / +2.7 kB    | 0               |
| CSS, `pennants/css/cdn`               | +27 B                        | +23.2 kB / +1.9 kB / +1.1 kB    | 0               |
| CSS, Vite defaults (flags inlined)    | +27 B                        | +372.4 kB / +52.0 kB / +42.9 kB | 0               |

¹ Emitted into your build, but downloaded only when that flag is shown.
² See [FAQ: bundler asset imports](./faq#bundler-asset-imports). Next.js 16 and Angular 22 do
not inline the flags; their CSS is 15–16 kB min.

What these numbers mean in practice:

- A static flag import costs about 1 kB gzip per flag; there is no fixed runtime cost.
- `loadFlag` and the components carry a 271-entry loader map with hashed chunk names, about
  5 kB gzip, before any flag is shown. For a handful of known flags, static imports are cheaper.
- In a Next.js Server Component, `<PennantSvg>` adds no client JavaScript: it renders to HTML.

## Flag files

| Set                           | Raw    | Brotli (sum of files) |
| ----------------------------- | ------ | --------------------- |
| All 271 SVGs (`svg/`)         | 1.2 MB | ≈370 kB               |
| Median SVG                    | 1.2 kB | ≈530 B                |
| Largest SVG (`rs`, Serbia)    | 60 kB  | ≈14 kB                |
| Sprite (`sprite/pennant.svg`) | 1.2 MB | ≈260 kB               |

PNG files average about 0.9 kB (1x) and 1.6 kB (2x). Country names cost nothing: ISO names come
from the runtime's `Intl.DisplayNames`; only the 22 non-ISO names (`gb-eng`, `asean`, ...) are
bundled.

The npm tarball is about 1.6 MB because it contains every format. What reaches your users
depends only on what you import.

## How lazy chunks work

`loadFlag` holds a map of 271 dynamic `import()` calls, one per flag. Bundlers turn each
entry into a separate chunk, so:

- your build output contains 271 small files, but
- a visitor downloads only the chunks for the flags actually shown, once, and the browser
  caches them.

`<Pennant>` and `<pennant-flag>` use the same loader and share an in-memory cache, so a flag
shown many times is fetched and parsed once.

## Keeping bundles minimal

- Import what you use: `import { getPennantName } from 'pennants'` does not pull in any flag.
- For a fixed, small set of flags, use static per-flag imports. Use `loadFlag` or the
  components when the flag is chosen at runtime and the set is large.
- Avoid `import * as flags` or building an object of all flag modules: that bundles all 271.
- Do not iterate `codes` and call `loadFlag` for each one to show a list; use CSS classes or
  `<img>` for long lists.
- With Vite, SvelteKit or Astro, set `assetsInlineLimit` so the CSS does not inline every flag.

## CDN or self-host?

|              | jsDelivr (`pennantUrl` default)       | Self-hosted (`base` option)         |
| ------------ | ------------------------------------- | ----------------------------------- |
| Setup        | None                                  | Copy `svg/` and `png/` to your host |
| Availability | Third-party dependency                | Same as your site                   |
| Privacy      | Requests go to jsDelivr               | No third party                      |
| CSP          | Allow `cdn.jsdelivr.net` in `img-src` | `img-src 'self'`                    |
| Caching      | Versioned URLs, cached long-term      | Up to your cache headers            |

`pennantUrl` defaults to a version-pinned base (`DEFAULT_CDN_BASE`), so URLs always match the
installed version. Self-host with `pennantUrl(code, { base: '/assets/pennants' })`.
