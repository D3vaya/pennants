import { afterEach, describe, expect, it, vi } from 'vitest';
import ar from '../src/generated/art/1x1/ar.ts';
import ar43 from '../src/generated/art/4x3/ar.ts';
import type * as CacheModule from '../src/internal/cache.ts';

afterEach(() => {
  vi.doUnmock('../src/internal/load-1x1.ts');
  vi.doUnmock('../src/internal/fetch-lazy.ts');
  vi.resetModules();
});

const freshCache = (): Promise<typeof CacheModule> => import('../src/internal/cache.ts');

describe('flag cache', () => {
  it('caches bundled art once per set, shared by the shapes drawn from it', async () => {
    const cache = await freshCache();
    expect(cache.peekFlag('ar', 'pennant')).toBeUndefined();
    await expect(cache.loadCachedFlag(' AR ', 'circle')).resolves.toEqual(ar);
    expect(cache.peekFlag('ar', 'pennant')).toEqual(ar);
    expect(cache.peekFlag('ar', 'square')).toEqual(ar);
    expect(cache.peekFlag('ar', 'rect')).toBeUndefined();
    await expect(cache.loadCachedFlag('ar', 'rect')).resolves.toEqual(ar43);
    expect(cache.peekFlag('ar', 'pennant', '/base')).toBeUndefined(); // sources are separate
  });

  it('uses fetchPennant with base + shape when a base is given', async () => {
    const fetchPennant = vi.fn(async () => '<svg>fetched</svg>');
    vi.doMock('../src/internal/fetch-lazy.ts', () => ({ fetchPennant }));
    const cache = await freshCache();
    await expect(cache.loadCachedFlag('AR', 'circle', '/base')).resolves.toBe('<svg>fetched</svg>');
    expect(fetchPennant).toHaveBeenCalledWith('ar', { base: '/base', shape: 'circle' });
    expect(cache.peekFlag('ar', 'circle', '/base')).toBe('<svg>fetched</svg>');
    expect(cache.peekFlag('ar', 'square', '/base')).toBeUndefined(); // fetched per shape
    expect(cache.peekFlag('ar', 'circle')).toBeUndefined();
  });

  it('notifies subscribers and supports unsubscribing', async () => {
    const cache = await freshCache();
    const listener = vi.fn();
    const unsubscribe = cache.subscribeFlags(listener);
    await cache.loadCachedFlag('ar', 'pennant');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    await cache.loadCachedFlag('br', 'pennant');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('drops results of loads that were in flight when cleared', async () => {
    let resolve!: (svg: string) => void;
    let reject!: (error: unknown) => void;
    const fetchPennant = vi
      .fn()
      .mockImplementationOnce(() => new Promise((res) => (resolve = res)))
      .mockImplementationOnce(() => new Promise((_res, rej) => (reject = rej)))
      .mockImplementation(async () => '<svg>new</svg>');
    vi.doMock('../src/internal/fetch-lazy.ts', () => ({ fetchPennant }));
    const cache = await freshCache();
    const stale = cache.loadCachedFlag('ar', 'pennant', '/b');
    cache.clearFlagCache();
    const failing = cache.loadCachedFlag('ar', 'pennant', '/b');
    cache.clearFlagCache();
    const fresh = cache.loadCachedFlag('ar', 'pennant', '/b'); // not de-duplicated with stale ones
    resolve('<svg>old</svg>');
    reject(new Error('late'));
    await expect(stale).resolves.toBe('<svg>old</svg>');
    await expect(failing).rejects.toThrow('late');
    await expect(fresh).resolves.toBe('<svg>new</svg>');
    expect(cache.peekFlag('ar', 'pennant', '/b')).toBe('<svg>new</svg>');
  });

  it('retries after the art chunk failed to load', async () => {
    let fail = true;
    vi.doMock('../src/internal/load-1x1.ts', () => {
      if (fail) throw new Error('chunk failed');
      return { loadArt1x1: async () => ar };
    });
    const cache = await freshCache();
    await expect(cache.loadCachedFlag('ar', 'pennant')).rejects.toThrow(
      /chunk failed|error when mocking/,
    );
    fail = false;
    vi.resetModules(); // a browser retries a failed dynamic import; emulate it
    await expect(cache.loadCachedFlag('ar', 'pennant')).resolves.toEqual(ar);
  });
});
