---
layout: home
title: pennants
titleTemplate: Country flags in pennant style

hero:
  name: pennants
  text: Every flag, every shape, one API
  tagline: 271 country flags as pennants (the signature style), rectangles, squares and circles. SVG, PNG, CSS, sprite, tree-shakable JS, React and a Web Component; you only ship the flags you show.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Browse the gallery
      link: /gallery
    - theme: alt
      text: Shapes
      link: /guide/shapes
    - theme: alt
      text: Which format?
      link: /guide/formats

features:
  - title: Four shapes
    details: Pennant by default, plus 4:3 rectangle, square and circle. Same codes, same API; pick the shape with one option.
  - title: Every format
    details: Static SVG and PNG, CSS classes, an SVG sprite, one ES module per flag, a React component and a framework-free custom element.
  - title: Pay only for what you show
    details: Each flag is its own module and lazy chunk; a static flag import adds about 1 kB gzip in a Vite build. Names come from Intl.DisplayNames, so no name data ships.
  - title: Typed and localized
    details: A PennantCode union for all 271 codes, and names in any language through Intl.DisplayNames, with no bundled name data.
  - title: Accessible by default
    details: Components get a localized accessible name automatically; pass an empty title or label for decorative flags.
  - title: Themeable
    details: Recolor the pennant's hanging bar with two CSS custom properties. CSP-safe.
  - title: Same codes as flag-icons
    details: Built from the flag-icons artwork. Keep rectangles with the rect shape, or switch to pennants.
---

## Quick start

```sh
npm install pennants
```

```js
import 'pennants/css';
```

```html
<span class="pn pn-ar" role="img" aria-label="Argentina"></span>
```

## Pick a format

<FormatPicker />

Not sure? Read [Which format should I use?](/guide/formats) or see every flag in the
[gallery](/gallery).
