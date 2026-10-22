<script setup lang="ts">
import { computed } from 'vue';
import { data } from '../sizes.data';
import { formatBytes, useLang } from '../shared';

// <Size probe="load" /> renders the probe's gzip entry size; part="css" for stylesheet probes.
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
  // Every figure must come from the snapshot: a missing probe fails the build.
  if (value === undefined) throw new Error(`[docs] missing bundle size: ${props.probe}`);
  return `${props.sign ? '+' : ''}${formatBytes(value, lang.value)}`;
});
</script>

<template>
  <span class="pn-size">{{ text }}</span>
</template>
