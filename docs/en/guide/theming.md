# Theming

Only the pennant shape has a bar; `rect`, `square` and `circle` have nothing to theme.

The hanging bar is a gradient whose two stops carry the classes `pn-bar-l` and `pn-bar-d`. A
small stylesheet maps them to two CSS custom properties:

| Property              | Default   |
| --------------------- | --------- |
| `--pennant-bar-light` | `#d5b97a` |
| `--pennant-bar-dark`  | `#8e713f` |

The mapping rule ships in `pennants/css/theme.css` (about 110 bytes) and is already part of
`pennants/css` and `pennants/css/cdn`. If you use inline SVG without the CSS classes (per-flag
modules, `loadFlag`, React), import it once:

```js
import 'pennants/css/theme.css';
```

`<pennant-flag>` carries the same rule in its own shadow stylesheet (exported as
`PENNANT_ELEMENT_CSS`), so it needs no import.

Then set the properties on any ancestor; custom properties inherit into the element's shadow
root. Without the stylesheet the stops keep their default
gold, so nothing breaks. Because theming is a plain stylesheet rule, it works under a strict
Content Security Policy (`style-src 'self'`).

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

- Inline SVG in your document, with the theme stylesheet loaded: per-flag modules inserted into
  the DOM, `loadFlag`, `fetchPennant`, `<Pennant>` (inline and fetch modes) and
  `<PennantSvg>`.
- `<pennant-flag>`, with no extra stylesheet.

Files loaded as images (`<img>`, PNG, CSS backgrounds, the sprite through `<use>` from another
file) are isolated documents and always use the default gold.

## Size

| Format           | How to size                                                 |
| ---------------- | ----------------------------------------------------------- |
| CSS classes      | `font-size`, or `.pn-lg`, `.pn-2x`, `.pn-3x`, `.pn-4x`      |
| React            | `size={32}` (px) or `size="2rem"`; width follows the shape  |
| `<pennant-flag>` | `size="32"`, `size="2rem"` or the `--pennant-size` property |
| Images           | `width` and `height` with the shape's ratio, e.g. 33 × 36   |

`pennantBox(size, shape)` from `pennants/react` returns the `{ width, height }` pair used by the
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
