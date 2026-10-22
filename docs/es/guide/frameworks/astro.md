# Astro

Astro renderiza las banderas como HTML estático, sin nada de JavaScript. Añade JavaScript
solo donde necesites banderas que cambian en tiempo de ejecución.

[Ejemplo completo](https://github.com/D3vaya/pennants/tree/main/examples/astro)

```sh
npm install pennants
```

## Configuración

Deja las imágenes de las banderas fuera de tu CSS (ver la
[guía de Vite](./vite#evita-que-vite-incruste-las-banderas)):

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

## Sin JavaScript

```astro [src/pages/index.astro]
---
import 'pennants/css';
import { Image } from 'astro:assets';
import { renderFlag } from 'pennants';
import ar from 'pennants/art/1x1/ar';
import jp from 'pennants/svg/circle/jp.svg';
---

<!-- Clases CSS -->
<span class="pn pn-de pn-2x" role="img" aria-label="Alemania"></span>

<!-- SVG en línea en el HTML, en cualquier forma. Markup de confianza compuesto desde pennants/art/*. -->
<span class="flag" role="img" aria-label="Argentina" set:html={renderFlag(ar, { shape: 'square' })} />

<!-- Imagen: se emite en /_astro/ con width y height -->
<Image src={jp} alt="Japón" height={48} />

<style>
  .flag { display: inline-block; height: 48px; aspect-ratio: 1; }
  .flag :global(svg) { width: 100%; height: 100%; }
</style>
```

Ninguna de estas opciones envía JavaScript al navegador: `renderFlag` se ejecuta al
compilar, así que cada bandera solo cuesta su markup en el HTML.

## Islas

Web Component (sin framework). Astro empaqueta el `<script>`:

```astro
<pennant-flag code="mx" shape="rect" size="48" label="México"></pennant-flag>
<script>
  import 'pennants/element/register';
</script>
```

O una isla de React (después de `npx astro add react`):

```astro
---
import { Pennant } from 'pennants/react';
---

<Pennant client:visible code="br" shape="circle" size={48} locale="es" />
```

La isla se renderiza en el servidor como una caja vacía del tamaño correcto. La bandera se
carga cuando la isla se hidrata. El Web Component cuesta <Size probe="element" /> con gzip.
La isla de React suma <Size probe="react-pennant" /> con gzip, además de React
(<Size probe="react" /> con gzip).
