<script setup lang="ts">
import { SHAPES } from 'pennants';
import { currentShape, flagAsset, shapeBox, shapeLabels, useLang } from '../shared';

withDefaults(defineProps<{ code?: string }>(), { code: 'ar' });
const { lang, t } = useLang();
</script>

<template>
  <div class="switcher" role="radiogroup" :aria-label="t.shape">
    <button
      v-for="shape in SHAPES"
      :key="shape"
      type="button"
      role="radio"
      :aria-checked="currentShape === shape"
      :class="{ active: currentShape === shape }"
      @click="currentShape = shape"
    >
      <img :src="flagAsset(code, shape)" alt="" v-bind="shapeBox(shape, 20)" />
      {{ shapeLabels[lang][shape] }}
    </button>
  </div>
</template>

<style scoped>
.switcher {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
}
button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 4px 12px 4px 8px;
  border-radius: 999px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
button:hover {
  color: var(--vp-c-text-1);
}
button.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
img {
  display: block;
}
</style>
