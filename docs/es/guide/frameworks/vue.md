# Vue

Vue 3 con Vite. Usa el Web Component `<pennant-flag>` para banderas que se eligen en tiempo
de ejecución, y `v-html` con un módulo por bandera para las que conoces al compilar.

[Ejemplo completo](https://github.com/d3vaya/pennants/tree/main/examples/vue)

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
import ar from 'pennants/flags/ar';
import type { PennantCode } from 'pennants';

const code = ref<PennantCode>('br');
</script>

<template>
  <!-- Diferido: descarga solo la bandera elegida -->
  <pennant-flag :code="code" size="48" label="Brasil" @pennant-error="console.warn($event)" />
  <button type="button" @click="code = 'mx'">México</button>

  <!-- Empaquetado: solo markup de confianza de pennants/flags/* -->
  <span class="flag" role="img" aria-label="Argentina" v-html="ar" />
</template>

<style scoped>
.flag {
  display: inline-block;
  height: 48px;
  aspect-ratio: 66 / 72;
}
.flag :deep(svg) {
  width: 100%;
  height: 100%;
}
</style>
```

El `label` de `<pennant-flag>` es opcional. Sin él, el nombre accesible es el nombre en
inglés de la bandera.

Para las clases `pn pn-xx`, importa `pennants/css/pennants.min.css` y añade la opción
`assetsInlineLimit` de la [guía de Vite](./vite#evita-que-vite-incruste-las-banderas).

## Bundle y SSR

- `pennants/element/register` suma unos 7 KB con gzip, más unos pocos KB por cada bandera
  que se muestra. Cada módulo por bandera suma alrededor de 1 KB con gzip.
- Nuxt / SSR: importar `pennants/element/register` en el servidor es seguro, porque el
  registro se omite donde no existe `customElements`. El servidor renderiza
  `<pennant-flag>` vacío, y la bandera aparece cuando el elemento se activa en el navegador.
  En Nuxt, pon la misma condición en `vue.compilerOptions.isCustomElement`. `v-html` con un
  módulo por bandera sí renderiza el SVG completo en el servidor.
