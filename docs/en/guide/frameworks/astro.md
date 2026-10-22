# Astro

Astro renders flags to static HTML with zero JavaScript. Add JavaScript only where you need
flags that change at runtime.

[Full example](https://github.com/d3vaya/pennants/tree/main/examples/astro)

```sh
npm install pennants
```

## Config

Keep the flag images out of your CSS (see the
[Vite guide](./vite#stop-vite-from-inlining-the-flags)):

```js [astro.config.mjs]
import { defineConfig } from 'astro/config';

export default defineConfig({
  vite: {
    build: {
      assetsInlineLimit: (file) => (file.includes('/pennants/svg/') ? false : undefined),
    },
  },
});
```

## Zero JavaScript

```astro [src/pages/index.astro]
---
import 'pennants/css';
import { Image } from 'astro:assets';
import { renderFlag } from 'pennants';
import ar from 'pennants/art/1x1/ar';
import jp from 'pennants/svg/circle/jp.svg';
---

<!-- CSS classes -->
<span class="pn pn-de pn-2x" role="img" aria-label="Germany"></span>

<!-- Inline SVG in the HTML, any shape. Trusted markup composed from pennants/art/*. -->
<span class="flag" role="img" aria-label="Argentina" set:html={renderFlag(ar, { shape: 'square' })} />

<!-- Image: emitted to /_astro/ with width and height set -->
<Image src={jp} alt="Japan" height={48} />

<style>
  .flag { display: inline-block; height: 48px; aspect-ratio: 1; }
  .flag :global(svg) { width: 100%; height: 100%; }
</style>
```

None of these ship any JavaScript to the browser: `renderFlag` runs at build time, so a flag
costs only its markup in the HTML.

## Islands

Web Component (no framework needed). Astro bundles the `<script>`:

```astro
<pennant-flag code="mx" shape="rect" size="48"></pennant-flag>
<script>
  import 'pennants/element/register';
</script>
```

Or a React island (after `npx astro add react`):

```astro
---
import { Pennant } from 'pennants/react';
---

<Pennant client:visible code="br" shape="circle" size={48} />
```

The island is server-rendered as an empty, correctly sized box. The flag loads when the
island hydrates. The Web Component costs <Size probe="element" /> gzip. The React island
adds <Size probe="react-pennant" /> gzip on top of React itself
(<Size probe="react" /> gzip).
