<script setup lang="ts">
import { computed } from 'vue';
import { codes, getPennantName, isoCodes, toEmoji } from 'pennants';
import { asset, useLang } from '../shared';

const props = defineProps<{ kind: 'iso' | 'other' }>();
const { lang, t } = useLang();
const iso = new Set<string>(isoCodes);

const rows = computed(() =>
  codes
    .filter((code) => (props.kind === 'iso') === iso.has(code))
    .map((code) => ({ code, name: getPennantName(code, lang.value), emoji: toEmoji(code) })),
);
</script>

<template>
  <table class="codes">
    <thead>
      <tr>
        <th scope="col">{{ t.flag }}</th>
        <th scope="col">{{ t.code }}</th>
        <th scope="col">{{ t.name }}</th>
        <th scope="col">{{ t.emoji }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row.code">
        <td>
          <img :src="asset(`svg/${row.code}.svg`)" alt="" width="22" height="24" loading="lazy" />
        </td>
        <td>
          <code>{{ row.code }}</code>
        </td>
        <td>{{ row.name }}</td>
        <td>{{ row.emoji || '—' }}</td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.codes img {
  display: block;
}
.codes td,
.codes th {
  padding: 4px 12px;
}
</style>
