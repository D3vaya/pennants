# Performance & weight

Two views of the same cost: what the library code weighs on its own, and what it adds to a real
app once a bundler has processed it.

## Library code

Measured on the 0.1.0 build with size-limit (minified, brotli), including every dependency of
the import.

| Import                                     | Size    |
| ------------------------------------------ | ------- |
| `import { isPennantCode } from 'pennants'` | 449 B   |
| `pennants` core, including `loadPennant`   | 1.48 kB |
| `pennants/react`                           | 2.76 kB |
| `pennants/element`                         | 2.98 kB |
| One flag module (`pennants/flags/ar`)      | 962 B   |
| `pennants/css`                             | 930 B   |

## In a real app

Added to an empty Vite 8 production build, raw / gzip. These include the bundler's module and
chunk-loading code, which is why they are larger than the numbers above.

| What you use                              | Entry JS (raw / gzip) | Extra files                  |
| ----------------------------------------- | --------------------- | ---------------------------- |
| `pennantUrl` only                         | 2.0 / 0.8 kB          |                              |
| `getPennantName` only                     | 2.6 / 1.1 kB          |                              |
| One flag module (`pennants/flags/ar`)     | 3.2 / 1.0 kB          |                              |
| Three flag modules                        | 8.1 / 2.2 kB          |                              |
| `loadPennant`                             | 15.4 / 5.1 kB         | one chunk per flag shown     |
| `pennants/element/register`               | 19.5 / 7.0 kB         | one chunk per flag shown     |
| React `<Pennant>` (on top of `react-dom`) | 18.5 / 6.9 kB         | one chunk per flag shown     |
| React `<PennantSvg svg={ar}>`             | 21.8 / 8.0 kB         |                              |
| `pennants/css/pennants.min.css`           | CSS 14.8 / 3.7 kB ¹   | 271 SVG files, loaded on use |

¹ With `assetsInlineLimit` as in the [FAQ](./faq#bundler-asset-imports). With Vite's default
the flags are inlined and the CSS is 388 kB raw / 56 kB gzip. Next.js 16 and Angular 22 do not
inline: their CSS is 15–16 kB raw.

In a Next.js Server Component, `<PennantSvg>` adds no client JavaScript.

## Flags

- Median flag: about 1.2 kB raw, 0.5 kB with brotli. The largest, `rs` (Serbia), is 60 kB raw.
- All 271 SVGs: 1.2 MB raw, about 370 kB with brotli.
- PNG: about 0.9 kB per 1x file and 1.6 kB per 2x file on average.
- Country names cost nothing: ISO names come from the runtime's `Intl.DisplayNames`. Only the
  22 non-ISO names (`gb-eng`, `asean`, ...) are bundled.

The npm tarball is 1.5 MB (4.1 MB unpacked) because it contains every format. What reaches your
users depends only on what you import.

## How lazy chunks work

`loadPennant` holds a map of 271 dynamic `import()` calls, one per flag; that map is most of
its 5 kB. Bundlers turn each entry into a separate chunk, so:

- your build output contains 271 small files, but
- a visitor downloads only the chunks for the flags actually shown, once, and the browser
  caches them.

`<Pennant>` and `<pennant-flag>` use the same loader and share an in-memory cache, so a flag
shown many times is fetched and parsed once.

## Keeping bundles minimal

- Import what you use: `import { getPennantName } from 'pennants'` does not pull in any flag.
- Prefer static per-flag imports for a fixed, small set of flags; prefer `loadPennant` or the
  components when the flag is chosen at runtime.
- Avoid `import * as flags` patterns or building an object of all flag modules: that bundles all 271.
- Do not iterate `codes` and call `loadPennant` for each one to show a list; use CSS classes or
  `<img>` for long lists.
- With Vite, SvelteKit or Astro, keep the flag SVGs referenced by the CSS from being inlined
  (388 kB instead of 15 kB). See [FAQ: bundler asset imports](./faq#bundler-asset-imports).
- For a handful of known flags, static per-flag imports (≈0.6–1 kB gzip each) are cheaper
  than `loadPennant` (≈5 kB for the loader map).

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
