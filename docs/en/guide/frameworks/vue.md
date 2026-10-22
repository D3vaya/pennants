# Vue

Vue 3 with Vite. Use the `<pennant-flag>` Web Component for flags chosen at runtime, and
`v-html` with a per-flag module for flags known at build time.

[Full example](https://github.com/d3vaya/pennants/tree/main/examples/vue)

```sh
npm install pennants
```

## Configure the custom element

Tell the Vue compiler that `pennant-flag` is not a Vue component. Otherwise you get a
"Failed to resolve component" warning:

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
import ar from 'pennants/flags/ar';
import type { PennantCode } from 'pennants';

const code = ref<PennantCode>('br');
</script>

<template>
  <!-- Lazy: fetches only the selected flag -->
  <pennant-flag :code="code" size="48" @pennant-error="console.warn($event)" />
  <button type="button" @click="code = 'mx'">Mexico</button>

  <!-- Bundled: trusted markup from pennants/flags/* only -->
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

To use the `pn pn-xx` classes, import `pennants/css/pennants.min.css` and add the
`assetsInlineLimit` option from the [Vite guide](./vite#stop-vite-from-inlining-the-flags).

## Bundle and SSR

- `pennants/element/register` adds about 7 KB gzip, plus a few KB per flag shown. Each
  per-flag module adds about 1 KB gzip.
- Nuxt / SSR: importing `pennants/element/register` on the server is safe, because
  registration is skipped where `customElements` doesn't exist. The server renders
  `<pennant-flag>` empty, and the flag appears once the element upgrades in the browser. In
  Nuxt, set the same check under `vue.compilerOptions.isCustomElement`. `v-html` with a
  per-flag module renders the full SVG on the server.
