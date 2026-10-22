# Migrating from flag-icons

`pennants` is built from the [flag-icons](https://github.com/lipis/flag-icons) artwork, so the
codes and the flag designs are the same. What changes is the shape (a pennant with a hanging
bar instead of a rectangle), the class prefix and the extra formats.

<MigrationCompare />

## Classes

| flag-icons                                   | pennants                                 | Notes                                          |
| -------------------------------------------- | ---------------------------------------- | ---------------------------------------------- |
| `import 'flag-icons/css/flag-icons.min.css'` | `import 'pennants/css/pennants.min.css'` |                                                |
| `fi fi-ar`                                   | `pn pn-ar`                               |                                                |
| `fi fi-ar fis` (square)                      | `pn pn-ar`                               | There is one shape; drop `fis`.                |
| `fib fi-ar` (background only)                | `pn pn-ar`                               | `.pn` already sets `background-size: contain`. |
| `flag-icons/flags/4x3/ar.svg`                | `pennants/svg/ar.svg`                    |                                                |
| `flag-icons/flags/1x1/ar.svg`                | `pennants/svg/ar.svg`                    |                                                |

A search and replace covers most projects:

```sh
# Review the diff before committing.
grep -rlE '\bfi fi-' src | xargs sed -i.bak -E 's/\bfi fi-([a-z-]+)( fis)?/pn pn-\1/g'
```

## Size and layout

|                | flag-icons `.fi`             | pennants `.pn`                 |
| -------------- | ---------------------------- | ------------------------------ |
| Height         | `1em` line box               | `1em`                          |
| Width          | `1.333em` (4:3), `1em` (1:1) | `0.917em` (66:72)              |
| Vertical align | baseline                     | `middle`                       |
| Size helpers   | none                         | `.pn-lg`, `.pn-2x` to `.pn-4x` |

Pennants are narrower than 4:3 flags. If you placed flags in fixed-width columns, check the
spacing. The bottom of a pennant is a point, so it looks lighter than a rectangle at the same
height; one step bigger (`.pn-lg`) is often a good match.

## What you gain

- PNG files (1x and 2x) and an SVG sprite.
- One ES module per flag, a lazy `loadPennant`, React components and a Web Component.
- TypeScript types for every code (`PennantCode`), `getPennantName` with localized names,
  `toEmoji` and `pennantUrl`.

## Side by side

You can keep both packages during a migration; the class prefixes (`fi` and `pn`) do not
collide.

```html
<span class="fi fi-ar"></span> <span class="pn pn-ar"></span>
```
