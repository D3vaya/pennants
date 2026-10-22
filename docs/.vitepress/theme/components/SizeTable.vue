<script setup lang="ts">
import { computed } from 'vue';
import { data } from '../sizes.data';
import { formatBytes, probeLabel, useLang, type Lang } from '../shared';
import type { SizeTriple } from '../sizes.data';

// Renders bundle-budget probes as a table: min / gzip / brotli per column.
const props = defineProps<{ probes: string[] }>();
const { lang } = useLang();

const headers: Record<Lang, string[]> = {
  en: ['You use', 'Entry JS', 'CSS', 'Lazy JS files ¹'],
  es: ['Qué usas', 'JS de entrada', 'CSS', 'Archivos JS diferidos ¹'],
};

const triple = (value: SizeTriple | null | undefined, l: Lang): string =>
  value
    ? [value.min, value.gzip, value.brotli].map((n) => `+${formatBytes(n, l)}`).join(' / ')
    : '';

// CSS-only probes leave the entry column empty and vice versa: hide unused columns.
const showEntry = computed(() => props.probes.some((name) => data.probes[name]?.css === null));
const showCss = computed(() => props.probes.some((name) => data.probes[name]?.css));

const rows = computed(() =>
  props.probes.map((name) => {
    const probe = data.probes[name];
    if (!probe) throw new Error(`[docs] missing bundle size probe: ${name}`);
    const cssOnly = probe.css !== null;
    return {
      name,
      label: probeLabel(probe.label, lang.value),
      entry: cssOnly ? '' : triple(probe.entry, lang.value),
      css: triple(probe.css, lang.value),
      lazy: probe.lazyFiles,
    };
  }),
);
</script>

<template>
  <table>
    <thead>
      <tr>
        <th scope="col">{{ headers[lang][0] }}</th>
        <th v-if="showEntry" scope="col">{{ headers[lang][1] }}</th>
        <th v-if="showCss" scope="col">{{ headers[lang][2] }}</th>
        <th scope="col">{{ headers[lang][3] }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row.name">
        <!-- Labels come from scripts/bundle-budget.ts and are escaped before rendering. -->
        <td v-html="row.label" />
        <td v-if="showEntry" class="size">{{ row.entry }}</td>
        <td v-if="showCss" class="size">{{ row.css }}</td>
        <td>{{ row.lazy }}</td>
      </tr>
    </tbody>
  </table>
  <p class="pn-size-note">
    Vite {{ data.vite }} · min / gzip / brotli · {{ data.generated.slice(0, 10) }}
  </p>
</template>

<style scoped>
.size {
  white-space: nowrap;
}
.pn-size-note {
  font-size: 13px;
  color: var(--vp-c-text-2);
}
</style>
