# Svelte

SvelteKit 3 with Svelte 5, prerendered with `adapter-static`. The same code works in a plain
Vite + Svelte app.

[Full example](https://github.com/d3vaya/pennants/tree/main/examples/svelte)

```sh
npm install pennants
```

## Config

SvelteKit 3 is configured in `vite.config.ts`. Keep the flag images out of your CSS (see the
[Vite guide](./vite#stop-vite-from-inlining-the-flags)):

```ts [vite.config.ts]
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit({ adapter: adapter() })],
  build: {
    assetsInlineLimit: (file) => (file.includes('/pennants/svg/') ? false : undefined),
  },
});
```

## Usage

```svelte [src/routes/+page.svelte]
<script lang="ts">
  import 'pennants/css/pennants.min.css';
  // Safe during SSR: registration is skipped where customElements is missing.
  import 'pennants/element/register';
  import ar from 'pennants/flags/ar';
  import type { PennantCode } from 'pennants';

  let code = $state<PennantCode>('br');
</script>

<!-- In the prerendered HTML. Trusted markup from pennants/flags/* only. -->
<span class="flag" role="img" aria-label="Argentina">{@html ar}</span>

<!-- CSS classes -->
<span class="pn pn-de pn-2x" role="img" aria-label="Germany"></span>

<!-- Web Component: fetches only the selected flag -->
<pennant-flag {code} size="48"></pennant-flag>
<button type="button" onclick={() => (code = 'mx')}>Mexico</button>

<style>
  .flag {
    display: inline-block;
    height: 48px;
    aspect-ratio: 66 / 72;
  }
  .flag :global(svg) {
    width: 100%;
    height: 100%;
  }
</style>
```

Svelte needs no custom element configuration.

## Bundle and SSR

- `{@html ar}` is server-rendered: the SVG is in the HTML, and hydration reuses it. It adds
  about 1 KB gzip per flag to the page's JavaScript.
- `<pennant-flag>` is rendered empty on the server and filled in the browser. It costs about
  7 KB gzip, plus a few KB per flag shown.
