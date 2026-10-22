/**
 * Build-time loader for docs/data/bundle-sizes.json, the snapshot written by
 * `node scripts/bundle-budget.ts --json docs/data/bundle-sizes.json`.
 * Every size figure on the site should come from here so it cannot drift.
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export interface SizeTriple {
  min: number;
  gzip: number;
  brotli: number;
}

export interface Probe {
  label: string;
  baseline: 'empty' | 'react' | null;
  entry: SizeTriple;
  css: SizeTriple | null;
  lazyFiles: number;
}

export interface BundleSizes {
  vite: string;
  generated: string;
  probes: Record<string, Probe>;
}

const snapshot = fileURLToPath(new URL('../../data/bundle-sizes.json', import.meta.url));

export default {
  watch: ['../../data/bundle-sizes.json'],
  load(): BundleSizes {
    if (!existsSync(snapshot)) return { vite: '', generated: '', probes: {} };
    return JSON.parse(readFileSync(snapshot, 'utf8')) as BundleSizes;
  },
};
