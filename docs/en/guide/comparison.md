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

|                                                | pennants                                                                  | flag-icons                      | country-flag-icons           |
| ---------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------- | ---------------------------- |
| Flags                                          | 271                                                                       | 271                             | 265                          |
| All SVGs, raw / gzip / brotli                  | pennant: 1.16 MB / 416 kB / 362 kB<br>rect: 1.10 MB / 383 kB / 335 kB     | 1.93 MB / 647 kB / 561 kB (4x3) | 178 kB / 89 kB / 81 kB (3x2) |
| Median SVG, brotli                             | pennant: 525 B, rect: 430 B                                               | 356 B (4x3)                     | 253 B (3x2)                  |
| Full CSS, raw / gzip / brotli                  | pennant: 14.4 kB / 1.8 kB / 1.0 kB ¹<br>rect: 13.5 kB / 1.8 kB / 0.9 kB ¹ | 28.0 kB / 2.4 kB / 1.5 kB ¹     | 201 kB / 48 kB / 40 kB ²     |
| One flag JS module (`ar`), raw / gzip / brotli | 2.6 kB / 0.8 kB / 0.7 kB (artwork, any shape)                             | —                               | 0.3 kB / 0.2 kB / 0.2 kB     |
| npm tarball, packed / unpacked                 | 2.80 MB / 9.26 MB                                                         | 1.08 MB / 3.99 MB               | 1.12 MB / 5.79 MB            |

¹ References one SVG file per flag; images load only when a class is used.
² Contains every flag as a data URI.

## Where pennants loses

- **Per-flag weight against country-flag-icons.** country-flag-icons simplifies coats of arms
  and emblems; its `ar` module is less than a third of our `ar` artwork, and all its SVGs
  together are under a quarter of our rect set. If you need small rectangular flags and do not
  care about detailed emblems, it is the lighter choice.
- **Median file size.** Every flag carries a frame (clip path and border; on the pennant also
  the bar), so simple flags are larger than the plain rectangles of both other packages.
- **No 3:2 rectangles.** pennants has pennant, 4:3, square and circle shapes;
  country-flag-icons ships 3:2 and 1:1.
- **Tarball size.** pennants ships four shapes and more formats (PNG, sprite, JS modules), so
  the npm download is more than twice as large. This does not affect what your users download.
- **Runtime loader cost.** The lazy loader (`loadFlag`, the components) carries a 271-entry map
  up front (<Size probe="load" /> gzip in a Vite build). Fetch mode avoids it; country-flag-icons has no
  lazy loader.

## Where pennants wins

- **Total SVG weight against flag-icons**, from the same artwork: about 40 % less for the 4:3
  rect set and about a third less for pennants (brotli), thanks to per-flag coordinate
  precision.
- **CSS**: a third smaller than flag-icons and 40 times smaller than country-flag-icons'
  data-URI stylesheet.
- **Shapes and API**, below.

## Features

|                    | pennants                            | flag-icons           | country-flag-icons           |
| ------------------ | ----------------------------------- | -------------------- | ---------------------------- |
| Shapes             | Pennant, 4:3, square, circle        | 4:3, 1:1             | 3:2, 1:1                     |
| Emblem detail      | Full (flag-icons artwork)           | Full                 | Simplified                   |
| SVG files          | Yes                                 | Yes                  | Yes                          |
| CSS classes        | Yes, file references                | Yes, file references | Yes, data URIs               |
| PNG                | 1x (2x for the pennant)             | No                   | No                           |
| SVG sprite         | Pennant (others built from source)  | No                   | No                           |
| JS module per flag | Yes, artwork for any shape          | No                   | Yes                          |
| Lazy loader        | `loadFlag`, fetch mode              | No                   | No                           |
| React              | `<Pennant>`, `<PennantSvg>`         | No                   | One component per flag       |
| Web Component      | `<pennant-flag>`                    | No                   | No                           |
| TypeScript types   | Yes, codes as a `PennantCode` union | No                   | Yes, codes typed as `string` |
| Localized names    | `getPennantName` (`Intl`)           | No                   | No                           |
| Themeable          | Pennant bar (CSS custom properties) | No                   | No                           |
| Emoji helper       | `toEmoji`                           | No                   | `country-flag-icons/unicode` |

Feature rows reflect each package's documented API at the versions above. If something here
is out of date, please [open an issue](https://github.com/d3vaya/pennants/issues).
