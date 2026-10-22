<script setup lang="ts">
import { computed } from 'vue';
import { data } from '../sizes.data';
import { formatBytes, useLang } from '../shared';

// <Size probe="load" /> → "+5.1 kB"; part="css" for stylesheet probes.
const props = withDefaults(
  defineProps<{
    probe: string;
    metric?: 'min' | 'gzip' | 'brotli';
    part?: 'entry' | 'css';
    sign?: boolean;
  }>(),
  { metric: 'gzip', part: 'entry', sign: false },
);
const { lang } = useLang();

const text = computed(() => {
  const probe = data.probes[props.probe];
  const value =
    props.part === 'css' ? probe?.css?.[props.metric] : probe?.[props.part][props.metric];
  // A missing probe renders a dash and is reported by the build log.
  if (value === undefined) {
    if (import.meta.env.SSR) console.warn(`[docs] missing bundle size: ${props.probe}`);
    return '—';
  }
  return `${props.sign ? '+' : ''}${formatBytes(value, lang.value)}`;
});
</script>

<template>
  <span class="pn-size">{{ text }}</span>
</template>
