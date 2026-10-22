# Performance & weight

Measured on the 0.1.0 build with size-limit (minified, brotli). Numbers include every dependency
of the import.

| Import                                     | Size    |
| ------------------------------------------ | ------- |
| `import { isPennantCode } from 'pennants'` | 449 B   |
| `pennants` core, including `loadPennant`   | 1.48 kB |
| `pennants/react`                           | 2.76 kB |
| `pennants/element`                         | 2.98 kB |
| One flag module (`pennants/flags/ar`)      | 962 B   |
| `pennants/css`                             | 930 B   |

## Flags

- Median flag: about 1.2 kB raw, 0.5 kB with brotli. The largest, `rs` (Serbia), is 60 kB raw.
- All 271 SVGs: 1.2 MB raw, about 370 kB with brotli.
- PNG: about 0.9 kB per 1x file and 1.6 kB per 2x file on average.
- Country names cost nothing: ISO names come from the runtime's `Intl.DisplayNames`. Only the
  22 non-ISO names (`gb-eng`, `asean`, ...) are bundled.

The npm tarball is 1.5 MB (4.1 MB unpacked) because it contains every format. What reaches your
users depends only on what you import.

## How lazy chunks work

`loadPennant` holds a map of 271 dynamic `import()` calls, one per flag. Bundlers turn each one
into a separate chunk, so:

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
- With Vite, keep the flag SVGs referenced by `pennants/css` from being inlined into your CSS.
  See [FAQ: bundler asset imports](./faq#bundler-asset-imports).

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
