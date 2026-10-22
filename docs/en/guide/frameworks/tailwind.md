# Tailwind CSS

Tailwind CSS 4 with `@tailwindcss/vite`. Use the `pn pn-xx` classes and size them with
utilities.

[Full example](https://github.com/d3vaya/pennants/tree/main/examples/tailwind)

```sh
npm install pennants
```

## Setup

Import one shape's stylesheet into Tailwind's `components` layer:

```css [src/style.css]
@import 'tailwindcss';
@import 'pennants/css' layer(components); /* or pennants/css/circle, /rect, /square */
```

The layer matters. Without it, `.pn` is unlayered CSS, and unlayered CSS beats every Tailwind
utility, so `h-12` or `w-auto` would have no effect.

With Vite, add the `assetsInlineLimit` option from the
[Vite guide](./vite#stop-vite-from-inlining-the-flags). This keeps the 271 flag SVGs out of
your CSS.

## Sizing

`.pn` is `1em` tall, and its width follows the shape (`11/12em` for the pennant, `4/3em` for
rect, `1em` for square and circle). Size it with font-size utilities:

```html
<span class="pn pn-ar text-[32px]" role="img" aria-label="Argentina"></span>
<span class="pn pn-br text-5xl" role="img" aria-label="Brazil"></span>
<!-- Follows the surrounding text -->
<span class="text-xl"><span class="pn pn-mx" aria-hidden="true"></span> Mexico</span>
```

Or set a height and let the width follow:

```html
<span class="pn pn-jp h-12 w-auto aspect-[11/12]" role="img" aria-label="Japan"></span>
<span
  class="pn pn-de h-16 w-auto aspect-[11/12] drop-shadow-md transition hover:-rotate-6"
  role="img"
  aria-label="Germany"
></span>
```

Match the aspect ratio to the shape: `aspect-[11/12]` for the pennant, `aspect-[4/3]` for
rect, `aspect-square` for square and circle. With square and circle, `size-*` works too.

## Weight

The rules of one shape add about 14 KB minified (under 2 KB gzip) to your CSS. Tailwind
doesn't remove unused rules from imported CSS, but each flag image is downloaded only when it
is used.
