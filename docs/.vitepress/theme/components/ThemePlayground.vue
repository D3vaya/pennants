<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { loadPennant } from 'pennants';
import CopyCode from './CopyCode.vue';
import { useLang } from '../shared';

const { t } = useLang();
const defaults = { light: '#d5b97a', dark: '#8e713f' };
const presets = [
  { name: 'Gold', ...defaults },
  { name: 'Silver', light: '#ececec', dark: '#8a8a8a' },
  { name: 'Bronze', light: '#e0a46a', dark: '#7a4420' },
  { name: 'Ink', light: '#4b5563', dark: '#111827' },
  { name: 'Celeste', light: '#9fd3f5', dark: '#3b82c4' },
];
const light = ref(defaults.light);
const dark = ref(defaults.dark);
const flags = ['ar', 'uy', 'gr', 'fi', 'ca', 'kr'];
// Inline SVG, themed by the .pn-bar-l/.pn-bar-d rule from the site's pennants CSS.
const markup = ref<string[]>([]);
onMounted(async () => {
  markup.value = await Promise.all(flags.map((code) => loadPennant(code)));
});

const css = computed(
  () =>
    `.my-pennants {\n  --pennant-bar-light: ${light.value};\n  --pennant-bar-dark: ${dark.value};\n}`,
);

function apply(preset: { light: string; dark: string }) {
  light.value = preset.light;
  dark.value = preset.dark;
}
</script>

<template>
  <div class="playground">
    <div class="flags" :style="{ '--pennant-bar-light': light, '--pennant-bar-dark': dark }">
      <span v-for="(svg, i) in markup" :key="flags[i]" class="flag" v-html="svg" />
    </div>
    <div class="controls">
      <label>{{ t.light }} <input v-model="light" type="color" /></label>
      <label>{{ t.dark }} <input v-model="dark" type="color" /></label>
      <span class="presets" role="group" :aria-label="t.presets">
        <button v-for="p in presets" :key="p.name" type="button" @click="apply(p)">
          <span class="swatch" :style="{ background: `linear-gradient(${p.light}, ${p.dark})` }" />
          {{ p.name }}
        </button>
      </span>
    </div>
    <CopyCode label="CSS" :code="css" />
  </div>
</template>

<style scoped>
.playground {
  margin: 24px 0;
  padding: 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}
.flag :deep(svg) {
  display: block;
  width: 66px;
  height: 72px;
}
.flags {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  min-height: 72px;
  margin-bottom: 16px;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  align-items: center;
  font-size: 14px;
}
.controls label {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}
.presets {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
}
.presets button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 2px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  font-size: 13px;
}
.presets button:hover {
  border-color: var(--vp-c-brand-1);
}
.swatch {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
</style>
