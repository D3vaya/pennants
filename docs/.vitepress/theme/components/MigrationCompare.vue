<script setup lang="ts">
import { getPennantName } from 'pennants';
import { asset, useLang } from '../shared';

const { lang } = useLang();
const samples = ['ar', 'br', 'jp', 'gb-eng', 'eu', 'za'];
</script>

<template>
  <div class="compare">
    <figure v-for="code in samples" :key="code">
      <div class="pair">
        <img :src="asset(`flag-icons/${code}.svg`)" alt="" width="64" height="48" />
        <span class="arrow" aria-hidden="true">→</span>
        <img :src="asset(`svg/${code}.svg`)" alt="" width="44" height="48" />
      </div>
      <figcaption>
        <code>fi-{{ code }}</code> → <code>pn-{{ code }}</code>
        <span class="name">{{ getPennantName(code, lang) }}</span>
      </figcaption>
    </figure>
  </div>
</template>

<style scoped>
.compare {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 12px;
  margin: 20px 0;
}
figure {
  margin: 0;
  padding: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  text-align: center;
}
.pair {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
}
.pair img:first-child {
  border-radius: 2px;
  box-shadow: 0 0 0 1px var(--vp-c-divider);
}
.arrow {
  color: var(--vp-c-text-3);
}
figcaption {
  margin-top: 8px;
  font-size: 13px;
}
.name {
  display: block;
  color: var(--vp-c-text-2);
}
</style>
