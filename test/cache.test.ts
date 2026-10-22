import { afterEach, describe, expect, it, vi } from 'vitest';
import ar from '../src/generated/flags/ar.ts';
import type * as CacheModule from '../src/internal/cache.ts';

afterEach(() => {
  vi.doUnmock('../src/internal/load.ts');
  vi.doUnmock('../src/internal/fetch.ts');
  vi.resetModules();
});

const freshCache = (): Promise<typeof CacheModule> => import('../src/internal/cache.ts');

describe('markup cache', () => {
  it('loads bundled flags lazily and caches them by code', async () => {
    const cache = await freshCache();
    expect(cache.peekMarkup('ar')).toBeUndefined();
    await expect(cache.loadMarkup(' AR ')).resolves.toBe(ar);
    expect(cache.peekMarkup('ar')).toBe(ar);
    expect(cache.peekMarkup('ar', '/base')).toBeUndefined(); // sources are separate
  });

  it('uses fetchPennant when a base is given', async () => {
    const fetchPennant = vi.fn(async () => '<svg>fetched</svg>');
    vi.doMock('../src/internal/fetch.ts', () => ({ fetchPennant }));
    const cache = await freshCache();
    await expect(cache.loadMarkup('AR', '/base')).resolves.toBe('<svg>fetched</svg>');
    expect(fetchPennant).toHaveBeenCalledWith('ar', { base: '/base' });
    expect(cache.peekMarkup('ar', '/base')).toBe('<svg>fetched</svg>');
    expect(cache.peekMarkup('ar')).toBeUndefined();
  });

  it('notifies subscribers and supports unsubscribing', async () => {
    const cache = await freshCache();
    const listener = vi.fn();
    const unsubscribe = cache.subscribeMarkup(listener);
    await cache.loadMarkup('ar');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    await cache.loadMarkup('br');
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
    vi.doMock('../src/internal/fetch.ts', () => ({ fetchPennant }));
    const cache = await freshCache();
    const stale = cache.loadMarkup('ar', '/b');
    cache.clearMarkupCache();
    const failing = cache.loadMarkup('ar', '/b');
    cache.clearMarkupCache();
    const fresh = cache.loadMarkup('ar', '/b'); // not de-duplicated with the stale ones
    resolve('<svg>old</svg>');
    reject(new Error('late'));
    await expect(stale).resolves.toBe('<svg>old</svg>');
    await expect(failing).rejects.toThrow('late');
    await expect(fresh).resolves.toBe('<svg>new</svg>');
    expect(cache.peekMarkup('ar', '/b')).toBe('<svg>new</svg>');
  });

  it('retries importing the loader map after a failure', async () => {
    let fail = true;
    vi.doMock('../src/internal/load.ts', () => {
      if (fail) throw new Error('chunk failed');
      return { loadPennant: async () => '<svg>ok</svg>' };
    });
    const cache = await freshCache();
    await expect(cache.loadMarkup('ar')).rejects.toThrow(/chunk failed|error when mocking/);
    fail = false;
    vi.resetModules(); // a real browser retries the dynamic import; emulate it
    await expect(cache.loadMarkup('ar')).resolves.toBe('<svg>ok</svg>');
  });
});
