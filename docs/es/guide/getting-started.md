# Primeros pasos

`pennants` incluye 271 banderas (los 249 países y territorios de ISO 3166-1, más regiones y
organizaciones) con forma de banderín: una barra dorada de la que cuelga la bandera, cortada en
punta. Todos los banderines miden 66 × 72 (proporción 11:12).

## Instalación

::: code-group

```sh [npm]
npm install pennants
```

```sh [pnpm]
pnpm add pennants
```

```sh [yarn]
yarn add pennants
```

:::

También puedes usar los archivos directamente desde jsDelivr, sin instalar nada. En producción,
fija la versión:

```html
<img
  src="https://cdn.jsdelivr.net/npm/pennants@0.1.0/svg/ar.svg"
  width="33"
  height="36"
  alt="Argentina"
/>
```

## Requisitos

- Solo ESM. Node.js 20.19 o superior para herramientas y SSR.
- Cualquier navegador actual. El JavaScript apunta a ES2022.
- En TypeScript, `moduleResolution` debe ser `bundler`, `node16` o `nodenext` para que se
  resuelvan las rutas de `exports`.
- React 18 o superior, solo si usas `pennants/react`.

## Recorrido

### Clases CSS

Sin JavaScript. En una build de Vite 8 la hoja de estilos agrega 3,7 kB con gzip, y cada imagen
se descarga solo cuando algún elemento usa su clase.

```js
import 'pennants/css';
```

```html
<span class="pn pn-ar" role="img" aria-label="Argentina"></span>
<span class="pn pn-jp pn-2x" aria-hidden="true"></span>
```

`.pn` mide `1em` de alto, así que sigue al `font-size`. Tamaños auxiliares: `.pn-lg`, `.pn-2x`,
`.pn-3x` y `.pn-4x`.

::: warning Vite, SvelteKit y Astro
Por defecto, Vite incrusta en tu CSS como data URI cada bandera de menos de 4 KiB, y la hoja de
estilos pasa a ocupar 372 kB min (52 kB con gzip) con Vite 8.3.5. Puedes importar
`pennants/css/cdn`, que apunta a URLs de jsDelivr con la versión fijada y que los bundlers no
tocan, o mantener las banderas como archivos locales con
[`assetsInlineLimit`](./faq#imports-de-assets-en-el-bundler). Next.js y Angular no las
incrustan.
:::

### Imágenes

```html
<img src="/assets/pennants/svg/ar.svg" width="33" height="36" alt="Argentina" />
<img
  src="/assets/pennants/png/1x/ar.png"
  srcset="/assets/pennants/png/2x/ar.png 2x"
  width="66"
  height="72"
  alt="Argentina"
/>
```

Copia `node_modules/pennants/svg` (y `png`) a tu carpeta pública, o usa las URLs del CDN que
devuelve `pennantUrl(código)`.

### Un módulo por bandera

```js
import ar from 'pennants/flags/ar'; // el SVG como string, con tree-shaking

element.innerHTML = ar;
```

### Carga diferida

```js
import { loadPennant, toPennantCode } from 'pennants';

const svg = await loadPennant(toPennantCode(entradaDelUsuario)); // descarga un chunk pequeño
```

### React

```jsx
import { Pennant } from 'pennants/react';

<Pennant code="ar" size={32} locale="es" />;
```

### Web Component

```js
import 'pennants/element/register';
```

```html
<pennant-flag code="ar" size="32" label="Argentina"></pennant-flag>
```

## Siguientes pasos

- [¿Qué formato uso?](./formats) compara peso, SSR, personalización y caché.
- [Galería](/es/gallery): todas las banderas con el código listo para copiar.
- [Referencia de la API](/es/api/).
