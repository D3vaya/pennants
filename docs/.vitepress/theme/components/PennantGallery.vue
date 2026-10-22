<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { SHAPE_SIZE, codes, isoCodes, toEmoji } from 'pennants';
import CopyCode from './CopyCode.vue';
import ShapeSwitcher from './ShapeSwitcher.vue';
import {
  currentShape,
  flagAsset,
  shapeBox,
  shapeLabels,
  siteName,
  snippets,
  useLang,
} from '../shared';

const { lang, t } = useLang();
const query = ref('');
const size = ref(56);
const selected = ref<string | null>(null);
const dialog = ref<HTMLDialogElement | null>(null);
const iso = new Set<string>(isoCodes);
// Tile width follows the shape's aspect ratio.
const ratio = computed(
  () => SHAPE_SIZE[currentShape.value].width / SHAPE_SIZE[currentShape.value].height,
);

const entries = computed(() =>
  codes.map((code) => {
    const name = siteName(code, lang.value);
    const english = siteName(code, 'en');
    return { code, name, search: `${code} ${name} ${english}`.toLowerCase() };
  }),
);

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();

const visible = computed(() => {
  const q = normalize(query.value);
  return q ? entries.value.filter((entry) => normalize(entry.search).includes(q)) : entries.value;
});

const current = computed(() => {
  const code = selected.value;
  if (!code) return null;
  return {
    code,
    name: siteName(code, lang.value),
    emoji: toEmoji(code),
    iso: iso.has(code),
    snippets: snippets(code, lang.value, currentShape.value),
  };
});

async function open(code: string) {
  selected.value = code;
  await nextTick();
  dialog.value?.showModal();
  if (dialog.value) dialog.value.scrollTop = 0;
}

function close() {
  dialog.value?.close();
}

function onDialogClick(event: MouseEvent) {
  // Clicking the backdrop (the dialog element itself) closes it.
  if (event.target === dialog.value) close();
}
</script>

<template>
  <div class="gallery" :style="{ '--tile': `${size}px`, '--ratio': ratio }">
    <div class="controls">
      <ShapeSwitcher />
      <label class="control">
        <span>{{ t.search }}</span>
        <input
          v-model="query"
          type="search"
          :placeholder="t.searchPlaceholder"
          autocomplete="off"
        />
      </label>
      <label class="control">
        <span>{{ t.size }}</span>
        <input v-model.number="size" type="range" min="24" max="144" step="4" />
        <output>{{ size }}px</output>
      </label>
      <p class="count" aria-live="polite">{{ t.count(visible.length, codes.length) }}</p>
    </div>

    <ul class="grid">
      <li v-for="entry in visible" :key="entry.code">
        <button
          type="button"
          :aria-label="t.openDetails(entry.name, entry.code)"
          @click="open(entry.code)"
        >
          <img
            :src="flagAsset(entry.code, currentShape)"
            alt=""
            loading="lazy"
            v-bind="shapeBox(currentShape, 72)"
          />
          <span class="code">{{ entry.code }}</span>
          <span class="name">{{ entry.name }}</span>
        </button>
      </li>
    </ul>
    <p v-if="visible.length === 0" class="empty">{{ t.noResults }}</p>

    <dialog ref="dialog" class="panel" aria-labelledby="pn-panel-title" @click="onDialogClick">
      <div v-if="current" class="panel-body">
        <header class="panel-head">
          <img
            :src="flagAsset(current.code, currentShape)"
            alt=""
            v-bind="shapeBox(currentShape, 96)"
          />
          <div>
            <h2 id="pn-panel-title">{{ current.name }} {{ current.emoji }}</h2>
            <p>
              <code>{{ current.code }}</code> · {{ current.iso ? t.iso : t.other }} ·
              {{ shapeLabels[lang][currentShape] }}
            </p>
          </div>
          <button type="button" class="close" autofocus @click="close">{{ t.close }}</button>
        </header>
        <h3>{{ t.snippetsFor }}</h3>
        <CopyCode v-for="s in current.snippets" :key="s.id" :label="s.label" :code="s.code" />
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  align-items: center;
  margin: 16px 0;
}
.control {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  color: var(--vp-c-text-2);
  font-size: 14px;
}
.control input[type='search'] {
  width: 18rem;
  max-width: 70vw;
  padding: 6px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}
.control input[type='search']:focus {
  border-color: var(--vp-c-brand-1);
}
.control input[type='range'] {
  accent-color: var(--vp-c-brand-1);
}
.count {
  margin: 0 !important;
  color: var(--vp-c-text-2);
  font-size: 14px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(max(calc(var(--tile) * var(--ratio) + 40px), 104px), 1fr)
  );
  gap: 8px;
  margin: 0 !important;
  padding: 0 !important;
  list-style: none;
}
.grid li {
  margin: 0 !important;
}
.grid button {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 12px 6px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  transition:
    border-color 0.15s,
    transform 0.15s;
}
.grid button:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}
.grid img {
  width: calc(var(--tile) * var(--ratio));
  height: var(--tile);
}
.code {
  font: 600 13px var(--vp-font-family-mono);
}
.name {
  font-size: 12px;
  line-height: 1.3;
  color: var(--vp-c-text-2);
  text-align: center;
}
.empty {
  color: var(--vp-c-text-2);
}
.panel {
  width: min(720px, calc(100vw - 32px));
  max-height: calc(100vh - 64px);
  padding: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}
.panel::backdrop {
  background: rgb(0 0 0 / 0.5);
}
.panel-body {
  padding: 20px 24px;
}
.panel-head {
  display: flex;
  gap: 16px;
  align-items: center;
}
.panel-head h2 {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 22px;
}
.panel-head p {
  margin: 4px 0 0;
  color: var(--vp-c-text-2);
}
.panel h3 {
  margin: 20px 0 4px;
  font-size: 15px;
}
.close {
  margin-left: auto;
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}
.close:hover {
  border-color: var(--vp-c-brand-1);
}
@media (prefers-reduced-motion: reduce) {
  .grid button {
    transition: none;
  }
  .grid button:hover {
    transform: none;
  }
}
</style>
