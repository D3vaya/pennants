<script setup lang="ts">
import { SHAPES } from 'pennants';
import { flagAsset, shapeBox, shapeLabels, siteName, useLang } from '../shared';

const { lang } = useLang();
const samples = ['ar', 'jp', 'br', 'gb-sct', 'za'];
</script>

<template>
  <div class="shape-grid">
    <figure v-for="shape in SHAPES" :key="shape">
      <div class="flags">
        <img
          v-for="code in samples"
          :key="code"
          :src="flagAsset(code, shape)"
          :alt="siteName(code, lang)"
          v-bind="shapeBox(shape, 40)"
        />
      </div>
      <figcaption>
        <code>{{ shape }}</code> · {{ shapeLabels[lang][shape] }}
      </figcaption>
    </figure>
  </div>
</template>

<style scoped>
.shape-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
  margin: 20px 0;
}
figure {
  margin: 0;
  padding: 16px 12px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
}
.flags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: center;
  min-height: 52px;
}
img {
  display: block;
}
figcaption {
  margin-top: 8px;
  font-size: 13px;
  text-align: center;
  color: var(--vp-c-text-2);
}
</style>
