# Performance & weight

All numbers on this page are measured, not estimated, and you can reproduce them:

- bundle costs with `npm run bundle:budget` (Vite probes built against the packed library). The
  tables below are rendered from its JSON output, `docs/data/bundle-sizes.json`;
- file sizes and the [comparison](./comparison) with `node scripts/docs-compare.ts`.

## What it adds to your app

Each row is the difference against an empty app (React rows against an empty React app,
<Size probe="react" metric="min" /> min / <Size probe="react" /> gzip). Sizes are
min / gzip / brotli.

<SizeTable :probes="['art-pennant', 'art-rect', 'art-all', 'name', 'url', 'fetch', 'load', 'load-shapes', 'element', 'react-pennant', 'react-pennant-circle', 'react-svg', 'react-svg-circle']" />

¹ Emitted into your build, but downloaded only when needed: one chunk per flag and artwork set
plus the loader maps. Fetch mode from `pennants/fetch` bundles its sanitizer and emits no lazy
files.

### Stylesheets

<SizeTable :probes="['css', 'css-cdn', 'css-rect', 'css-rect-cdn', 'css-square', 'css-circle', 'css-mixed', 'css-default']" />

Each stylesheet also adds 27 bytes of entry JS. See
[FAQ: bundler asset imports](./faq#bundler-asset-imports) for `assetsInlineLimit`; Next.js and
Angular do not inline the flags.

What these numbers mean in practice:

- A static artwork import plus `renderFlag` costs <Size probe="art-pennant" /> gzip for the
  first flag; more shapes of the same flag reuse its artwork.
- `loadFlag` and the components carry the loader maps up front (<Size probe="load" /> gzip for
  `loadFlag`) before any flag is shown. For a handful of known flags, static imports are
  cheaper; `pennants/fetch` (<Size probe="fetch" /> gzip, sanitizer included) ships no map at all.
  Fetch mode in `<Pennant>`, `<pennant-flag>` and the root `fetchPennant` loads the sanitizer
  as a lazy chunk on the first fetch.
- In a Next.js Server Component, `<PennantSvg>` adds no client JavaScript: it renders to HTML.

## Flag files

Measured on the 0.1.0 build with `node scripts/docs-compare.ts` (brotli is the sum of
individually compressed files).

| Set                                 | Raw                   | Brotli             |
| ----------------------------------- | --------------------- | ------------------ |
| All 271 pennant SVGs                | 1.16 MB               | 362 kB             |
| All 271 rect / square / circle SVGs | 1.10 / 1.11 / 1.09 MB | 335 / 336 / 332 kB |
| Median SVG (pennant / rect)         | —                     | 525 B / 430 B      |
| Largest SVG (`rs`, Serbia)          | 62 kB                 | 15 kB              |
| Sprite (`sprite/pennant.svg`)       | 1.15 MB               | 248 kB             |

PNG files average 0.9 kB (pennant 1x), 1.6 kB (pennant 2x) and 0.6–1.0 kB (other shapes, 1x
only). Country names cost nothing: ISO names come from the runtime's `Intl.DisplayNames`; only
the 22 non-ISO names (`gb-eng`, `asean`, ...) are bundled.

The npm tarball is 2.80 MB (9.29 MB unpacked) because it contains four shapes in every format.
What reaches your users depends only on what you import.

## How lazy chunks work

`loadFlag` holds a map of dynamic `import()` calls, one per flag and artwork set. Bundlers turn each
entry into a separate chunk, so:

- your build output contains one small file per flag and artwork set, plus the maps, but
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
- With Vite, SvelteKit or Astro, use a `/cdn` stylesheet or set `assetsInlineLimit` so the CSS
  does not inline every flag.

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
