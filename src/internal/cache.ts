import { SHAPE_ART, type FlagArt, type PennantShape } from '../shapes.ts';
import { fetchPennant } from './fetch.ts';
import { loadArt } from './load.ts';

/**
 * Shared, observable cache of loaded flags. Lets every renderer show an
 * already-loaded flag synchronously (no flash on remount) and de-duplicates
 * concurrent requests.
 *
 * Two sources:
 * - bundled (`base === undefined`): artwork from the lazily imported per-set
 *   loader map. Art is cached once per set (`1x1`/`4x3`), so a flag drawn as
 *   pennant, square and circle is downloaded once; composition per shape is
 *   left to the renderer;
 * - fetch (`base` is a string): the complete framed SVG from
 *   `fetchPennant(code, { base, shape })`, cached per base + shape.
 *
 * `shape` must already be validated by the caller.
 */

/** Bundled artwork, or a complete framed SVG fetched from static assets. */
export type CachedFlag = FlagArt | string;

const flags = new Map<string, CachedFlag>();
const pending = new Map<string, Promise<CachedFlag>>();
const listeners = new Set<() => void>();
let generation = 0;

const normalize = (code: string): string => code.trim().toLowerCase();

const keyOf = (code: string, shape: PennantShape, base: string | undefined): string =>
  base === undefined ? `${SHAPE_ART[shape]}\n${code}` : `${base}\n${shape}\n${code}`;

/** Synchronously returns the cached flag, if it was already loaded. */
export function peekFlag(code: string, shape: PennantShape, base?: string): CachedFlag | undefined {
  return flags.get(keyOf(normalize(code), shape, base));
}

/** Loads (once) and caches a flag. Rejects for unknown codes. */
export function loadCachedFlag(
  code: string,
  shape: PennantShape,
  base?: string,
): Promise<CachedFlag> {
  const normalized = normalize(code);
  const key = keyOf(normalized, shape, base);
  const hit = flags.get(key);
  if (hit !== undefined) return Promise.resolve(hit);
  let request = pending.get(key);
  if (!request) {
    const current = generation;
    const load: Promise<CachedFlag> =
      base === undefined
        ? loadArt(normalized, { set: SHAPE_ART[shape] })
        : fetchPennant(normalized, { base, shape });
    request = load.then(
      (flag) => {
        if (current !== generation) return flag; // cache was cleared meanwhile
        pending.delete(key);
        flags.set(key, flag);
        for (const listener of listeners) listener();
        return flag;
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
export function subscribeFlags(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test helper: forgets every cached flag. */
export function clearFlagCache(): void {
  generation++;
  flags.clear();
  pending.clear();
}
