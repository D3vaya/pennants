# Vue

Vue 3 with Vite. Use the `<pennant-flag>` Web Component for flags chosen at runtime, and
`v-html` with `renderFlag` for flags known at build time.

[Full example](https://github.com/d3vaya/pennants/tree/main/examples/vue)

```sh
npm install pennants
```

## Configure the custom element

Tell the Vue compiler that `pennant-flag` is not a Vue component. Otherwise you get a "Failed
to resolve component" warning:

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

Register the element once:

```ts [src/main.ts]
import { createApp } from 'vue';
import 'pennants/element/register';
import App from './App.vue';

createApp(App).mount('#app');
```

## Usage

```vue [src/App.vue]
<script setup lang="ts">
import { ref } from 'vue';
import ar from 'pennants/art/1x1/ar';
import { renderFlag, type PennantCode, type PennantShape } from 'pennants';

const code = ref<PennantCode>('br');
const shape = ref<PennantShape>('pennant');
// Trusted markup composed from pennants/art/*; never pass user input to v-html.
const circle = renderFlag(ar, { shape: 'circle' });
</script>

<template>
  <!-- Lazy: fetches only the selected flag -->
  <pennant-flag :code="code" :shape="shape" size="48" @pennant-error="console.warn($event)" />
  <button type="button" @click="code = 'mx'">Mexico</button>
  <button type="button" @click="shape = 'circle'">Circle</button>

  <!-- Bundled -->
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

To use the `pn pn-xx` classes, import `pennants/css` and any other shapes you need (`pennants/css/circle` for
`pn-circle pn-xx`...), and add
the `assetsInlineLimit` option from the [Vite guide](./vite#stop-vite-from-inlining-the-flags).

## Bundle and SSR

- `pennants/element/register` adds <Size probe="element" /> gzip, plus a few KB per flag
  shown. One art module with `renderFlag` adds <Size probe="art-circle" /> gzip.
- Nuxt / SSR: importing `pennants/element/register` on the server is safe, because
  registration is skipped where `customElements` doesn't exist. The server renders
  `<pennant-flag>` empty, and the flag appears once the element upgrades in the browser. In
  Nuxt, set the same check under `vue.compilerOptions.isCustomElement`. `v-html` with
  `renderFlag` renders the full SVG on the server.
