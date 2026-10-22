# Vue

Vue 3 con Vite. Usa el Web Component `<pennant-flag>` para banderas que se eligen en tiempo
de ejecución, y `v-html` con `renderFlag` para las que conoces al compilar.

[Ejemplo completo](https://github.com/D3vaya/pennants/tree/main/examples/vue)

```sh
npm install pennants
```

## Configura el custom element

Indica al compilador de Vue que `pennant-flag` no es un componente de Vue. Si no, verás el
aviso "Failed to resolve component":

```ts [vite.config.ts]
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: { isCustomElement: (tag) => tag === 'pennant-flag' },
      },
    }),
  ],
});
```

Registra el elemento una sola vez:

```ts [src/main.ts]
import { createApp } from 'vue';
import 'pennants/element/register';
import App from './App.vue';

createApp(App).mount('#app');
```

## Uso

```vue [src/App.vue]
<script setup lang="ts">
import { ref } from 'vue';
import ar from 'pennants/art/1x1/ar';
import { renderFlag, type PennantCode, type PennantShape } from 'pennants';

const code = ref<PennantCode>('br');
const shape = ref<PennantShape>('pennant');
// Markup de confianza compuesto desde pennants/art/*; nunca pases datos del usuario a v-html.
const circle = renderFlag(ar, { shape: 'circle' });
</script>

<template>
  <!-- Diferido: descarga solo la bandera elegida -->
  <pennant-flag
    :code="code"
    :shape="shape"
    size="48"
    label="Brasil"
    @pennant-error="console.warn($event)"
  />
  <button type="button" @click="code = 'mx'">México</button>
  <button type="button" @click="shape = 'circle'">Círculo</button>

  <!-- Empaquetado -->
  <span class="flag" role="img" aria-label="Argentina" v-html="circle" />
</template>

<style scoped>
.flag {
  display: inline-block;
  height: 48px;
  aspect-ratio: 1;
}
.flag :deep(svg) {
  width: 100%;
  height: 100%;
}
</style>
```

El `label` de `<pennant-flag>` es opcional. Sin él, el nombre accesible es el nombre en
inglés de la bandera.

Para las clases `pn pn-xx`, importa `pennants/css` y las demás formas que necesites (`pennants/css/circle` para
`pn-circle pn-xx`...), y añade la
opción `assetsInlineLimit` de la [guía de Vite](./vite#evita-que-vite-incruste-las-banderas).

## Bundle y SSR

- `pennants/element/register` suma <Size probe="element" /> con gzip, más unos pocos KB por
  cada bandera que se muestra. Un módulo de arte con `renderFlag` suma
  <Size probe="art-circle" /> con gzip.
- Nuxt / SSR: importar `pennants/element/register` en el servidor es seguro, porque el
  registro se omite donde no existe `customElements`. El servidor renderiza
  `<pennant-flag>` vacío, y la bandera aparece cuando el elemento se activa en el navegador.
  En Nuxt, pon la misma condición en `vue.compilerOptions.isCustomElement`. `v-html` con
  `renderFlag` sí renderiza el SVG completo en el servidor.
