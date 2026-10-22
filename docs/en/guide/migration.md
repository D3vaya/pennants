# Migrating from flag-icons

`pennants` is built from the [flag-icons](https://github.com/lipis/flag-icons) artwork, so the
codes and the flag designs are the same. You can keep the rectangular look with the `rect` and
`square` shapes, or switch to the pennant.

<MigrationCompare />

## Keep rectangles

| flag-icons                                   | pennants                                           |
| -------------------------------------------- | -------------------------------------------------- |
| `import 'flag-icons/css/flag-icons.min.css'` | `import 'pennants/css/rect'`                       |
| `fi fi-ar` (4:3)                             | `pn pn-ar` with `pennants/css/rect`                |
| `fi fi-ar fis` (1:1)                         | `pn pn-ar` with `pennants/css/square`              |
| `fib fi-ar` (background only)                | `pn pn-ar` (`.pn` sets `background-size: contain`) |
| `flag-icons/flags/4x3/ar.svg`                | `pennants/svg/rect/ar.svg`                         |
| `flag-icons/flags/1x1/ar.svg`                | `pennants/svg/square/ar.svg`                       |

`.pn` in `pennants/css/rect` is `1em` high and `1.333em` wide, the same box as flag-icons'
`.fi`, so layouts keep their spacing. The rect and square shapes add a thin darkening border and
2 px rounded corners.

Each stylesheet serves one shape, so a page that used both `fi` and `fi fis` needs either one
shape for both, or the components for one of them (`<Pennant shape="square">`).

## Switch to pennants

Replace the stylesheet with `import 'pennants/css'`; the classes are the same `pn pn-<code>`.

|                | flag-icons `.fi`             | pennants `.pn`                 |
| -------------- | ---------------------------- | ------------------------------ |
| Height         | `1em` line box               | `1em`                          |
| Width          | `1.333em` (4:3), `1em` (1:1) | `0.917em` (66:72)              |
| Vertical align | baseline                     | `middle`                       |
| Size helpers   | none                         | `.pn-lg`, `.pn-2x` to `.pn-4x` |

Pennants are narrower than 4:3 flags, so check fixed-width columns. The bottom is a point, so a
pennant looks lighter than a rectangle at the same height; one step bigger (`.pn-lg`) is often a
good match.

## Search and replace

For a 4:3 to `rect` migration, the class change is mechanical:

```sh
# Review the diff before committing.
grep -rlE '\bfi fi-' src | xargs sed -i.bak -E 's/\bfi fi-([a-z-]+)/pn pn-\1/g'
```

Then replace the stylesheet import, and handle any `fis` classes as described above.

## What you gain

- PNG files and an SVG sprite, in addition to SVG and CSS.
- Artwork modules per flag, a lazy `loadFlag`, fetch mode, React components and a Web
  Component.
- TypeScript types for every code (`PennantCode`), `getPennantName` with localized names,
  `toEmoji` and `pennantUrl`.

## Side by side

You can keep both packages during a migration; the class prefixes (`fi` and `pn`) do not
collide.

```html
<span class="fi fi-ar"></span> <span class="pn pn-ar"></span>
```
