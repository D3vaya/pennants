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
  import 'pennants/css';
  // Seguro en SSR: el registro se omite donde no existe customElements.
  import 'pennants/element/register';
  import ar from 'pennants/art/1x1/ar';
  import { renderFlag, type PennantCode, type PennantShape } from 'pennants';

  let code = $state<PennantCode>('br');
  let shape = $state<PennantShape>('pennant');
</script>

<!-- En el HTML prerenderizado. Markup de confianza compuesto desde pennants/art/*. -->
<span class="flag" role="img" aria-label="Argentina">{@html renderFlag(ar, { shape: 'circle' })}</span>

<!-- Clases CSS -->
<span class="pn pn-de pn-2x" role="img" aria-label="Alemania"></span>

<!-- Web Component: descarga solo la bandera elegida -->
<pennant-flag {code} {shape} size="48"></pennant-flag>
<button type="button" onclick={() => (code = 'mx')}>México</button>
<button type="button" onclick={() => (shape = 'circle')}>Círculo</button>

<style>
  .flag {
    display: inline-block;
    height: 48px;
    aspect-ratio: 1;
  }
  .flag :global(svg) {
    width: 100%;
    height: 100%;
  }
</style>
```

Svelte no necesita configurar nada para los custom elements.

## Bundle y SSR

- `{@html renderFlag(...)}` se renderiza en el servidor: el SVG está en el HTML y la
  hidratación lo reutiliza. Un módulo de arte con `renderFlag` suma
  <Size probe="art-circle" /> con gzip al JavaScript de la página.
- `<pennant-flag>` se renderiza vacío en el servidor y se completa en el navegador. Cuesta
  <Size probe="element" /> con gzip, más unos pocos KB por cada bandera que se muestra.
