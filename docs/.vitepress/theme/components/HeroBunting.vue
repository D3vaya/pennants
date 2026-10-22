<script setup lang="ts">
import ShapeSwitcher from './ShapeSwitcher.vue';
import { currentShape, flagAsset } from '../shared';

// Two strings of pennants hanging like bunting.
const rows = [
  ['ar', 'br', 'mx', 'es', 'jp', 'za', 'ca'],
  ['fr', 'kr', 'in', 'ng', 'gb-sct', 'se', 'eu'],
];
const tilt = (index: number, total: number) => ((index + 0.5) / total - 0.5) * 12;
const drop = (index: number, total: number) => {
  const t = (index + 0.5) / total;
  return 4 * 22 * t * (1 - t);
};
</script>

<template>
  <div class="hero-flags">
    <div class="bunting" aria-hidden="true">
      <div v-for="(row, r) in rows" :key="r" class="row">
        <svg class="string" viewBox="0 0 100 30" preserveAspectRatio="none">
          <path d="M0 2 Q50 46 100 2" />
        </svg>
        <img
          v-for="(code, i) in row"
          :key="code"
          :src="flagAsset(code, currentShape)"
          alt=""
          width="50"
          :style="{
            '--tilt': `${tilt(i, row.length)}deg`,
            '--drop': `${drop(i, row.length)}px`,
            '--delay': `${(i + r) * -0.4}s`,
          }"
        />
      </div>
    </div>
    <ShapeSwitcher class="hero-switch" />
  </div>
</template>

<style scoped>
.hero-flags {
  display: grid;
  gap: 28px;
  justify-items: center;
}
.bunting {
  display: grid;
  gap: 28px;
  width: min(420px, 90vw);
}
.row {
  position: relative;
  display: flex;
  justify-content: space-between;
  padding: 0 4px;
}
.string {
  position: absolute;
  inset: 0 0 auto;
  width: 100%;
  height: 30px;
  overflow: visible;
}
.string path {
  fill: none;
  stroke: var(--vp-c-brand-1);
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}
img {
  position: relative;
  width: 50px;
  height: auto;
  transform-origin: 50% 0;
  transform: translateY(var(--drop)) rotate(var(--tilt));
  filter: drop-shadow(0 4px 6px rgb(0 0 0 / 0.18));
  animation: sway 5s ease-in-out infinite;
  animation-delay: var(--delay);
}
@keyframes sway {
  50% {
    transform: translateY(var(--drop)) rotate(calc(var(--tilt) + 4deg));
  }
}
@media (prefers-reduced-motion: reduce) {
  img {
    animation: none;
  }
}
@media (max-width: 640px) {
  img {
    width: 38px;
  }
}
</style>
