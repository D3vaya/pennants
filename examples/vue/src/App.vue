<script setup lang="ts">
import { ref } from 'vue';
import ar from 'pennants/art/1x1/ar';
import { SHAPES, renderFlag, type PennantCode, type PennantShape } from 'pennants';

const code = ref<PennantCode>('br');
const shape = ref<PennantShape>('pennant');
const codes: PennantCode[] = ['br', 'mx', 'gb-eng'];
// Trusted markup composed from pennants/art/*; never pass user input to v-html.
const circle = renderFlag(ar, { shape: 'circle' });
</script>

<template>
  <h2>Web Component (lazy chunk per flag)</h2>
  <pennant-flag :code="code" :shape="shape" size="48" @pennant-error="console.warn($event)" />
  <button v-for="choice in codes" :key="choice" type="button" @click="code = choice">
    {{ choice }}
  </button>
  <button v-for="choice in SHAPES" :key="choice" type="button" @click="shape = choice">
    {{ choice }}
  </button>

  <h2>Art module + renderFlag (bundled)</h2>
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
