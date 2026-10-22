# Comparison

How `pennants` compares with [flag-icons](https://github.com/lipis/flag-icons) (where its
artwork comes from) and [country-flag-icons](https://gitlab.com/catamphetamine/country-flag-icons).
All three are MIT licensed.

## Measured sizes

pennants 0.1.0, flag-icons 7.6.0, country-flag-icons 1.6.20. Compressed sizes are the sum over
individual files, since each file is served on its own (Node zlib, brotli quality 11, gzip
level 9). Reproduce with:

```sh
npm run build && node scripts/docs-compare.ts
```

|                                       | pennants                    | flag-icons                      | country-flag-icons           |
| ------------------------------------- | --------------------------- | ------------------------------- | ---------------------------- |
| Flags                                 | 271                         | 271                             | 265                          |
| All SVGs, raw / gzip / brotli         | 1.21 MB / 432 kB / 375 kB   | 1.93 MB / 647 kB / 561 kB (4x3) | 178 kB / 89 kB / 81 kB (3x2) |
| Median SVG, brotli                    | 525 B                       | 356 B                           | 253 B                        |
| Full CSS, raw / gzip / brotli         | 12.2 kB / 1.8 kB / 1.0 kB ¹ | 28.0 kB / 2.4 kB / 1.5 kB ¹     | 201 kB / 48 kB / 40 kB ²     |
| One flag string module (`ar`), brotli | 1.0 kB                      | —                               | 0.2 kB                       |
| npm tarball, packed / unpacked        | 1.64 MB / 4.44 MB           | 1.08 MB / 3.99 MB               | 1.12 MB / 5.79 MB            |

¹ References one SVG file per flag; images load only when a class is used.
² Contains every flag as a data URI.

## Where pennants loses

- **Per-flag weight against country-flag-icons.** country-flag-icons simplifies coats of arms
  and emblems; its `ar` module is about a fifth of ours, and all its SVGs together are under a
  quarter. If you need small rectangular flags and do not care about detailed emblems, it is
  the lighter choice.
- **Median file size.** Every pennant carries the frame (clip path, bar gradient, border), so
  simple flags are larger than the plain rectangles of both other packages.
- **Shape.** There is one shape, the pennant. flag-icons ships 4:3 and 1:1 rectangles,
  country-flag-icons 3:2 and 1:1. If your design needs rectangles, use them.
- **Tarball size.** pennants ships more formats (PNG, sprite, JS modules), so the npm download
  is larger. This does not affect what your users download.
- **Runtime loader cost.** The lazy loader (`loadPennant`, the components) adds about 5 kB gzip
  up front for its 271-entry map. country-flag-icons has no lazy loader; you import flags
  statically.

## Where pennants wins

- **Total SVG weight against flag-icons**, from the same artwork: about a third less with
  brotli, thanks to per-flag coordinate precision.
- **CSS**: a third smaller than flag-icons and 40 times smaller than country-flag-icons'
  data-URI stylesheet.
- **Formats and API**, below.

## Features

|                        | pennants                            | flag-icons           | country-flag-icons           |
| ---------------------- | ----------------------------------- | -------------------- | ---------------------------- |
| Shapes                 | Pennant 11:12                       | 4:3, 1:1             | 3:2, 1:1                     |
| Emblem detail          | Full (flag-icons artwork)           | Full                 | Simplified                   |
| SVG files              | Yes                                 | Yes                  | Yes                          |
| CSS classes            | Yes, file references                | Yes, file references | Yes, data URIs               |
| PNG                    | 1x, 2x                              | No                   | No                           |
| SVG sprite             | Yes                                 | No                   | No                           |
| String module per flag | Yes                                 | No                   | Yes                          |
| Lazy loader            | `loadPennant`                       | No                   | No                           |
| React                  | `<Pennant>`, `<PennantSvg>`         | No                   | One component per flag       |
| Web Component          | `<pennant-flag>`                    | No                   | No                           |
| TypeScript types       | Yes, codes as a `PennantCode` union | No                   | Yes, codes typed as `string` |
| Localized names        | `getPennantName` (`Intl`)           | No                   | No                           |
| Themeable              | Bar color (CSS custom properties)   | No                   | No                           |
| Emoji helper           | `toEmoji`                           | No                   | `country-flag-icons/unicode` |

Feature rows reflect each package's documented API at the versions above. If something here
is out of date, please [open an issue](https://github.com/d3vaya/pennants/issues).
