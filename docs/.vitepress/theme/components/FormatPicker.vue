<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { getPennantName, loadPennant } from 'pennants';
import CopyCode from './CopyCode.vue';
import { asset, snippets, useLang, type FormatId } from '../shared';

const { lang, t } = useLang();
const flags = ['ar', 'jp', 'br', 'es', 'gb-eng', 'za'];
const code = ref('ar');
const format = ref<FormatId>('css');
const markup = ref('');

const notes: Record<'en' | 'es', Record<FormatId, string>> = {
  en: {
    css: 'One small stylesheet; each image loads only when its class is used. With Vite, set assetsInlineLimit (see FAQ).',
    img: 'Zero bundle cost. Cached by the browser and the CDN.',
    png: 'For email, native apps and places without SVG support.',
    sprite:
      'One file with all 271 flags (≈260 kB brotli): worth it only when you show many at once.',
    module:
      'Tree-shaken: only the flags you import are bundled (≈1 kB gzip for the first, ≈0.6 kB each more).',
    lazy: '≈5 kB gzip for the loader map, then one small chunk per flag, fetched on first use.',
    react: 'Lazy inline SVG or <img>, accessible name by default, SSR-safe (≈7 kB gzip).',
    element: 'Framework-free custom element with lazy loading (≈7 kB gzip).',
  },
  es: {
    css: 'Una hoja de estilos pequeña; cada imagen se descarga solo cuando se usa su clase. Con Vite, configura assetsInlineLimit (ver FAQ).',
    img: 'Cero impacto en el bundle. La caché del navegador y del CDN hace el resto.',
    png: 'Para email, apps nativas y lugares sin soporte de SVG.',
    sprite:
      'Un archivo con las 271 banderas (≈260 kB con brotli): conviene solo si muestras muchas a la vez.',
    module:
      'Tree-shaking: solo se incluyen las banderas que importas (≈1 kB con gzip la primera, ≈0,6 kB cada una más).',
    lazy: '≈5 kB con gzip del mapa de carga y luego un chunk pequeño por bandera, al usarla por primera vez.',
    react:
      'SVG inline diferido o <img>, nombre accesible por defecto, compatible con SSR (≈7 kB con gzip).',
    element: 'Custom element sin framework, con carga diferida (≈7 kB con gzip).',
  },
};

const all = computed(() => snippets(code.value, lang.value));
const snippet = computed(() => all.value.find((s) => s.id === format.value) ?? all.value[0]!);
const name = computed(() => getPennantName(code.value, lang.value));
const inline = computed(() => ['module', 'lazy', 'react'].includes(format.value));

watch(
  [code, inline],
  async ([value, needsMarkup]) => {
    if (!needsMarkup || import.meta.env.SSR) return;
    markup.value = await loadPennant(value);
  },
  { immediate: true },
);
</script>

<template>
  <div class="picker">
    <div class="tabs" role="radiogroup" :aria-label="t.format">
      <button
        v-for="s in all"
        :key="s.id"
        type="button"
        role="radio"
        :aria-checked="s.id === format"
        :class="{ active: s.id === format }"
        @click="format = s.id"
      >
        {{ s.label }}
      </button>
    </div>
    <div class="body">
      <div class="preview" :aria-label="`${t.preview}: ${name}`" role="img">
        <span v-if="format === 'css'" :class="['pn', `pn-${code}`]" class="big" />
        <img v-else-if="format === 'img'" :src="asset(`svg/${code}.svg`)" alt="" />
        <img v-else-if="format === 'png'" :src="asset(`png/2x/${code}.png`)" alt="" />
        <svg v-else-if="format === 'sprite'" viewBox="0 0 66 72">
          <use :href="asset(`sprite/pennants.svg#pn-${code}`)" />
        </svg>
        <pennant-flag v-else-if="format === 'element'" :code="code" size="96" label="" />
        <span v-else class="inline" v-html="markup" />
        <select v-model="code" :aria-label="t.flag">
          <option v-for="f in flags" :key="f" :value="f">{{ f }}</option>
        </select>
      </div>
      <div class="code">
        <CopyCode :label="snippet.label" :code="snippet.code" />
        <p class="note">{{ notes[lang][format] }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.picker {
  margin: 24px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid var(--vp-c-divider);
}
.tabs button {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.tabs button:hover {
  color: var(--vp-c-text-1);
}
.tabs button.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
.body {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 16px;
  padding: 16px;
}
.preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
}
.preview img,
.preview svg,
.preview .inline :deep(svg) {
  display: block;
  width: 88px;
  height: 96px;
}
.big {
  font-size: 96px;
}
.preview select {
  padding: 2px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  font: 13px var(--vp-font-family-mono);
}
.note {
  margin: 0 !important;
  font-size: 14px;
  color: var(--vp-c-text-2);
}
@media (max-width: 640px) {
  .body {
    grid-template-columns: 1fr;
  }
}
</style>
