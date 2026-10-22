<script setup lang="ts">
import { computed } from 'vue';
import { data } from '../sizes.data';
import { formatBytes, useLang, type Lang } from '../shared';
import type { SizeTriple } from '../sizes.data';

// Renders the bundle-budget probes as a table: min / gzip / brotli per column.
const props = defineProps<{ probes: string[] }>();
const { lang } = useLang();

const headers: Record<Lang, string[]> = {
  en: ['You use', 'Entry JS', 'CSS', 'Lazy JS files'],
  es: ['Qué usas', 'JS de entrada', 'CSS', 'Archivos JS diferidos'],
};

const triple = (value: SizeTriple | null | undefined, l: Lang): string =>
  value
    ? [value.min, value.gzip, value.brotli].map((n) => `+${formatBytes(n, l)}`).join(' / ')
    : '';

const rows = computed(() =>
  props.probes
    .map((name) => ({ name, probe: data.probes[name] }))
    .filter((row) => row.probe !== undefined)
    .map(({ name, probe }) => ({
      name,
      label: probe!.label,
      entry: triple(probe!.entry, lang.value),
      css: triple(probe!.css, lang.value),
      lazy: probe!.lazyFiles,
    })),
);
</script>

<template>
  <table>
    <thead>
      <tr>
        <th v-for="h in headers[lang]" :key="h" scope="col">{{ h }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row.name">
        <td>{{ row.label }}</td>
        <td>{{ row.entry }}</td>
        <td>{{ row.css }}</td>
        <td>{{ row.lazy }}</td>
      </tr>
    </tbody>
  </table>
  <p v-if="data.vite" class="pn-size-note">
    Vite {{ data.vite }} · min / gzip / brotli · {{ data.generated.slice(0, 10) }}
  </p>
</template>

<style scoped>
.pn-size-note {
  font-size: 13px;
  color: var(--vp-c-text-2);
}
</style>
