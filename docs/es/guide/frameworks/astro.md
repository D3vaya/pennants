# Astro

Astro renderiza los banderines como HTML estático, sin nada de JavaScript. Añade JavaScript
solo donde necesites banderas que cambian en tiempo de ejecución.

[Ejemplo completo](https://github.com/d3vaya/pennants/tree/main/examples/astro)

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
import 'pennants/css/pennants.min.css';
import { Image } from 'astro:assets';
import ar from 'pennants/flags/ar';
import jp from 'pennants/svg/jp.svg';
---

<!-- Clases CSS -->
<span class="pn pn-de pn-2x" role="img" aria-label="Alemania"></span>

<!-- SVG en línea en el HTML. Solo markup de confianza de pennants/flags/*. -->
<span class="flag" role="img" aria-label="Argentina" set:html={ar} />

<!-- Imagen: se emite en /_astro/ con width y height -->
<Image src={jp} alt="Japón" height={48} />

<style>
  .flag { display: inline-block; height: 48px; aspect-ratio: 66 / 72; }
  .flag :global(svg) { width: 100%; height: 100%; }
</style>
```

Ninguna de estas opciones envía JavaScript al navegador. Un módulo por bandera solo cuesta
su markup en el HTML: unos 3 KB por bandera antes de comprimir.

## Islas

Web Component (sin framework). Astro empaqueta el `<script>`:

```astro
<pennant-flag code="mx" size="48" label="México"></pennant-flag>
<script>
  import 'pennants/element/register';
</script>
```

O una isla de React (después de `npx astro add react`):

```astro
---
import { Pennant } from 'pennants/react';
---

<Pennant client:visible code="br" size={48} locale="es" />
```

La isla se renderiza en el servidor como una caja vacía del tamaño correcto. La bandera se
carga cuando la isla se hidrata. El Web Component cuesta unos 7 KB con gzip. La isla de
React además carga React (unos 65 KB con gzip).
