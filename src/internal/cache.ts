import { loadPennant } from '../index.ts';

/**
 * Shared, observable cache of loaded pennant markup. Lets every renderer
 * show an already-loaded flag synchronously (no flash on remount) and
 * de-duplicates concurrent requests for the same flag.
 */

const markup = new Map<string, string>();
const pending = new Map<string, Promise<string>>();
const listeners = new Set<() => void>();

const normalize = (code: string): string => code.trim().toLowerCase();

/** Synchronously returns cached markup, if this flag was already loaded. */
export function peekMarkup(code: string): string | undefined {
  return markup.get(normalize(code));
}

/** Loads (once) and caches a flag's markup. Rejects for unknown codes. */
export function loadMarkup(code: string): Promise<string> {
  const key = normalize(code);
  const hit = markup.get(key);
  if (hit !== undefined) return Promise.resolve(hit);
  let request = pending.get(key);
  if (!request) {
    request = loadPennant(key).then(
      (svg) => {
        pending.delete(key);
        markup.set(key, svg);
        for (const listener of listeners) listener();
        return svg;
      },
      (error: unknown) => {
        pending.delete(key);
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
  markup.clear();
  pending.clear();
}
