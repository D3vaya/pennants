<script setup lang="ts">
import { ref } from 'vue';
import { copyText, useLang } from '../shared';

const props = defineProps<{ code: string; label?: string }>();
const { t } = useLang();
const copied = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

async function copy() {
  copied.value = await copyText(props.code);
  clearTimeout(timer);
  timer = setTimeout(() => (copied.value = false), 1600);
}
</script>

<template>
  <div class="pn-code">
    <div class="pn-code-bar">
      <span class="pn-code-label">{{ label }}</span>
      <button type="button" class="pn-code-copy" @click="copy">
        {{ copied ? t.copied : t.copy }}
      </button>
    </div>
    <pre><code>{{ code }}</code></pre>
    <span class="visually-hidden" role="status">{{ copied ? t.copied : '' }}</span>
  </div>
</template>

<style scoped>
.pn-code {
  margin: 12px 0;
  border-radius: 8px;
  background: var(--vp-code-block-bg);
  overflow: hidden;
}
.pn-code-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px 4px 14px;
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 12px;
  color: var(--vp-c-text-2);
}
.pn-code-copy {
  padding: 2px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-1);
  font-size: 12px;
}
.pn-code-copy:hover {
  border-color: var(--vp-c-brand-1);
}
pre {
  margin: 0;
  padding: 12px 14px;
  overflow-x: auto;
  font: 13px/1.6 var(--vp-font-family-mono);
  color: var(--vp-code-block-color);
}
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
