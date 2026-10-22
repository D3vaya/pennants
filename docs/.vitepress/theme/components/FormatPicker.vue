<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { SHAPE_SIZE, loadFlag } from 'pennants';
import CopyCode from './CopyCode.vue';
import ShapeSwitcher from './ShapeSwitcher.vue';
import {
  asset,
  currentShape,
  flagAsset,
  type FormatId,
  shapeBox,
  shapeClass,
  siteName,
  snippets,
  useLang,
} from '../shared';

const { lang, t } = useLang();
const flags = ['ar', 'jp', 'br', 'es', 'gb-eng', 'za'];
const code = ref('ar');
const format = ref<FormatId>('css');
const markup = ref('');

// No size figures here: they live on the Performance page, read from the budget snapshot.
const notes: Record<'en' | 'es', Record<FormatId, string>> = {
  en: {
    css: 'One stylesheet per shape, combinable on one page, no JavaScript; each image loads only when its class is used. With Vite, use the cdn variant or set assetsInlineLimit (see FAQ).',
    img: 'Zero bundle cost. Cached by the browser and the CDN.',
    png: 'For email, native apps and places without SVG support. 2x files exist for the pennant only.',
    sprite: 'One file with every flag in one shape: worth it only when you show many at once.',
    module: 'Tree-shaken artwork: only the flags you import are bundled, framed in any shape.',
    lazy: 'A loader map up front, then one small chunk per flag on first use.',
    fetch: 'No loader map: each flag is downloaded as an SVG file from the CDN or your host.',
    react:
      'Lazy inline SVG, fetch or <img>; accessible name by default; safe in Server Components.',
    element: 'Framework-free custom element with lazy loading or fetch mode; CSP-safe.',
  },
  es: {
    css: 'Una hoja de estilos por forma, combinables en una misma página, sin JavaScript; cada imagen se descarga solo cuando se usa su clase. Con Vite, usa la variante cdn o configura assetsInlineLimit (ver FAQ).',
    img: 'Cero impacto en el bundle. La caché del navegador y del CDN hace el resto.',
    png: 'Para email, apps nativas y lugares sin soporte de SVG. Los archivos 2x existen solo para el banderín.',
    sprite:
      'Un archivo con todas las banderas en una forma: conviene solo si muestras muchas a la vez.',
    module:
      'Dibujos con tree-shaking: solo se incluyen las banderas que importas, en cualquier forma.',
    lazy: 'Un mapa de carga de entrada y luego un chunk pequeño por bandera al usarla por primera vez.',
    fetch:
      'Sin mapa de carga: cada bandera se descarga como archivo SVG desde el CDN o tu servidor.',
    react:
      'SVG inline diferido, fetch o <img>; nombre accesible por defecto; compatible con Server Components.',
    element:
      'Custom element sin framework, con carga diferida o modo fetch; compatible con CSP estricta.',
  },
};

const all = computed(() => snippets(code.value, lang.value, currentShape.value));
const snippet = computed(() => all.value.find((s) => s.id === format.value) ?? all.value[0]!);
const name = computed(() => siteName(code.value, lang.value));
const inline = computed(() => ['module', 'lazy', 'fetch', 'react'].includes(format.value));
const box = computed(() => shapeBox(currentShape.value, 96));
const viewBox = computed(() => {
  const size = SHAPE_SIZE[currentShape.value];
  return `0 0 ${size.width} ${size.height}`;
});
const pngPath = computed(
  () =>
    `png/${currentShape.value}/${currentShape.value === 'pennant' ? '2x' : '1x'}/${code.value}.png`,
);

watch(
  [code, inline, currentShape],
  async ([value, needsMarkup, shape]) => {
    if (!needsMarkup || import.meta.env.SSR) return;
    markup.value = await loadFlag(value, { shape });
  },
  { immediate: true },
);
</script>

<template>
  <div class="picker">
    <div class="shape-row"><ShapeSwitcher :code="code" /></div>
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
      <div
        class="preview"
        :aria-label="`${t.preview}: ${name}`"
        role="img"
        :style="{ '--w': `${box.width}px`, '--h': `${box.height}px` }"
      >
        <span
          v-if="format === 'css'"
          :class="[shapeClass(currentShape), `pn-${code}`]"
          class="big"
        />
        <img v-else-if="format === 'img'" :src="flagAsset(code, currentShape)" alt="" />
        <img v-else-if="format === 'png'" :src="asset(pngPath)" alt="" />
        <svg v-else-if="format === 'sprite'" :viewBox="viewBox">
          <use :href="asset(`sprite/${currentShape}.svg#pn-${code}`)" />
        </svg>
        <pennant-flag
          v-else-if="format === 'element'"
          :code="code"
          :shape="currentShape"
          size="96"
          label=""
        />
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
  width: var(--w);
  height: var(--h);
}
.shape-row {
  padding: 8px 8px 0;
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
