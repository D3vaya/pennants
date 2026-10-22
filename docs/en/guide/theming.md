# Theming

The hanging bar is drawn with a gradient that reads two CSS custom properties:

| Property              | Default   |
| --------------------- | --------- |
| `--pennant-bar-light` | `#d5b97a` |
| `--pennant-bar-dark`  | `#8e713f` |

Set them on any ancestor. Custom properties inherit through the shadow root of
`<pennant-flag>`, so the same CSS works for every inline format.

<ThemePlayground />

```css
.medal-silver {
  --pennant-bar-light: #ececec;
  --pennant-bar-dark: #8a8a8a;
}

@media (prefers-color-scheme: dark) {
  :root {
    --pennant-bar-light: #c4a865;
    --pennant-bar-dark: #6a532c;
  }
}
```

## Which formats can be themed

Only inline SVG: per-flag modules inserted into the DOM, `loadPennant`, `<Pennant>` (inline
mode), `<PennantSvg>` and `<pennant-flag>`. Files loaded as images (`<img>`, PNG, CSS
backgrounds, the sprite through `<use>` from another file) are isolated documents and always
use the default gold.

## Size

| Format           | How to size                                                 |
| ---------------- | ----------------------------------------------------------- |
| CSS classes      | `font-size`, or `.pn-lg`, `.pn-2x`, `.pn-3x`, `.pn-4x`      |
| React            | `size={32}` (px) or `size="2rem"`; width follows 66:72      |
| `<pennant-flag>` | `size="32"`, `size="2rem"` or the `--pennant-size` property |
| Images           | `width` and `height` with the 66:72 ratio, e.g. 33 × 36     |

`pennantBox(size)` from `pennants/react` returns the `{ width, height }` pair used by the
components if you need to build your own wrapper.

## Styling the Web Component

```css
pennant-flag {
  --pennant-size: 1.5rem;
}

pennant-flag::part(svg) {
  filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.25));
}
```
