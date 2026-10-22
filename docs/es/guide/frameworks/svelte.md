# Svelte

SvelteKit 3 con Svelte 5, prerenderizado con `adapter-static`. El mismo código funciona en
una app de Vite + Svelte sin SvelteKit.

[Ejemplo completo](https://github.com/d3vaya/pennants/tree/main/examples/svelte)

```sh
npm install pennants
```

## Configuración

SvelteKit 3 se configura en `vite.config.ts`. Deja las imágenes de las banderas fuera de tu
CSS (ver la [guía de Vite](./vite#evita-que-vite-incruste-las-banderas)):

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

## Uso

```svelte [src/routes/+page.svelte]
<script lang="ts">
  import 'pennants/css/pennants.min.css';
  // Seguro en SSR: el registro se omite donde no existe customElements.
  import 'pennants/element/register';
  import ar from 'pennants/flags/ar';
  import type { PennantCode } from 'pennants';

  let code = $state<PennantCode>('br');
</script>

<!-- En el HTML prerenderizado. Solo markup de confianza de pennants/flags/*. -->
<span class="flag" role="img" aria-label="Argentina">{@html ar}</span>

<!-- Clases CSS -->
<span class="pn pn-de pn-2x" role="img" aria-label="Alemania"></span>

<!-- Web Component: descarga solo la bandera elegida -->
<pennant-flag {code} size="48"></pennant-flag>
<button type="button" onclick={() => (code = 'mx')}>México</button>

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

Svelte no necesita configurar nada para los custom elements.

## Bundle y SSR

- `{@html ar}` se renderiza en el servidor: el SVG está en el HTML y la hidratación lo
  reutiliza. Suma alrededor de 1 KB con gzip por bandera al JavaScript de la página.
- `<pennant-flag>` se renderiza vacío en el servidor y se completa en el navegador. Cuesta
  unos 7 KB con gzip, más unos pocos KB por cada bandera que se muestra.
