import { fetchPennant } from './fetch.ts';
import type * as LoadModule from './load.ts';

/**
 * Shared, observable cache of loaded pennant markup. Lets every renderer
 * show an already-loaded flag synchronously (no flash on remount) and
 * de-duplicates concurrent requests for the same flag.
 *
 * Two sources:
 * - bundled (`base === undefined`): the per-flag chunks of `loadPennant`.
 *   The loader map is itself imported lazily, so apps that only fetch never
 *   download it;
 * - fetch (`base` is a string): `fetchPennant(code, { base })`.
 */

const markup = new Map<string, string>();
const pending = new Map<string, Promise<string>>();
const listeners = new Set<() => void>();
let generation = 0;

const keyOf = (code: string, base: string | undefined): string => {
  const normalized = code.trim().toLowerCase();
  return base === undefined ? normalized : `${base}\n${normalized}`;
};

let loader: Promise<typeof LoadModule> | undefined;

async function bundled(code: string): Promise<string> {
  loader ??= import('./load.ts').catch((error: unknown) => {
    loader = undefined; // e.g. a chunk failed to download: retry next time
    throw error;
  });
  const { loadPennant } = await loader;
  return loadPennant(code);
}

/** Synchronously returns cached markup, if this flag was already loaded. */
export function peekMarkup(code: string, base?: string): string | undefined {
  return markup.get(keyOf(code, base));
}

/** Loads (once) and caches a flag's markup. Rejects for unknown codes. */
export function loadMarkup(code: string, base?: string): Promise<string> {
  const key = keyOf(code, base);
  const hit = markup.get(key);
  if (hit !== undefined) return Promise.resolve(hit);
  let request = pending.get(key);
  if (!request) {
    const normalized = code.trim().toLowerCase();
    const current = generation;
    request = (base === undefined ? bundled(normalized) : fetchPennant(normalized, { base })).then(
      (svg) => {
        if (current !== generation) return svg; // cache was cleared meanwhile
        pending.delete(key);
        markup.set(key, svg);
        for (const listener of listeners) listener();
        return svg;
      },
      (error: unknown) => {
        if (current === generation) pending.delete(key);
        throw error;
      },
    );
    pending.set(key, request);
  }
  return request;
}

/** Subscribes to cache updates; returns the unsubscribe function. */
export function subscribeMarkup(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test helper: forgets every cached flag. */
export function clearMarkupCache(): void {
  generation++;
  markup.clear();
  pending.clear();
}
