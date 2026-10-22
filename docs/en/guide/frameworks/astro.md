# Astro

Astro renders pennants to static HTML with zero JavaScript. Add JavaScript only where you
need flags that change at runtime.

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
import 'pennants/css/pennants.min.css';
import { Image } from 'astro:assets';
import ar from 'pennants/flags/ar';
import jp from 'pennants/svg/jp.svg';
---

<!-- CSS classes -->
<span class="pn pn-de pn-2x" role="img" aria-label="Germany"></span>

<!-- Inline SVG in the HTML. Trusted markup from pennants/flags/* only. -->
<span class="flag" role="img" aria-label="Argentina" set:html={ar} />

<!-- Image: emitted to /_astro/ with width and height set -->
<Image src={jp} alt="Japan" height={48} />

<style>
  .flag { display: inline-block; height: 48px; aspect-ratio: 66 / 72; }
  .flag :global(svg) { width: 100%; height: 100%; }
</style>
```

None of these ship any JavaScript to the browser. A per-flag module costs only its markup
in the HTML, about 3 KB per flag before compression.

## Islands

Web Component (no framework needed). Astro bundles the `<script>`:

```astro
<pennant-flag code="mx" size="48"></pennant-flag>
<script>
  import 'pennants/element/register';
</script>
```

Or a React island (after `npx astro add react`):

```astro
---
import { Pennant } from 'pennants/react';
---

<Pennant client:visible code="br" size={48} />
```

The island is server-rendered as an empty, correctly sized box. The flag loads when the
island hydrates. The Web Component costs about 7 KB gzip. The React island also loads
React itself (about 65 KB gzip).
