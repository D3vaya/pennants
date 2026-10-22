<script setup lang="ts">
import { ref } from 'vue';
import ar from 'pennants/flags/ar';
import type { PennantCode } from 'pennants';

const code = ref<PennantCode>('br');
const choices: PennantCode[] = ['br', 'mx', 'gb-eng'];
</script>

<template>
  <h2>Web Component (lazy chunk per flag)</h2>
  <pennant-flag :code="code" size="48" @pennant-error="console.warn($event)" />
  <button v-for="choice in choices" :key="choice" type="button" @click="code = choice">
    {{ choice }}
  </button>

  <h2>Per-flag module (bundled)</h2>
  <!-- Trusted markup from pennants/flags/* only; never user input. -->
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
