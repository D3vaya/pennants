import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fetchEntry from '../src/fetch.ts';
import { readFileSync } from 'node:fs';
import art from '../src/generated/art/1x1/ar.ts';
import { SHAPES, codes, fetchPennant as fromRoot, pennantUrl, renderFlag } from '../src/index.ts';
import { clearFetchCache, fetchPennant } from '../src/internal/fetch.ts';

const ar = renderFlag(art);
const respond = (body: string, status = 200): Response => new Response(body, { status });
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  clearFetchCache();
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => respond(ar));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchPennant', () => {
  it('is exported from pennants/fetch and the root entry', () => {
    expect(fetchEntry.fetchPennant).toBe(fetchPennant);
    expect(fromRoot).toBe(fetchPennant);
    expect(fetchEntry.pennantUrl).toBe(pennantUrl);
    expect(pennantUrl('ar').startsWith(fetchEntry.DEFAULT_CDN_BASE)).toBe(true);
  });

  it('fetches from the versioned CDN by default', async () => {
    await expect(fetchPennant('AR')).resolves.toBe(ar.trim());
    expect(fetchMock).toHaveBeenCalledWith(pennantUrl('ar'));
  });

  it('honours a custom base', async () => {
    await fetchPennant('gb-eng', { base: '/static/pennants/' });
    expect(fetchMock).toHaveBeenCalledWith(pennantUrl('gb-eng', { base: '/static/pennants/' }));
    expect(fetchMock.mock.calls[0]?.[0]).toMatch(/^\/static\/pennants\/svg\/.*gb-eng\.svg$/);
  });

  it('caches and de-duplicates per URL', async () => {
    const [a, b] = await Promise.all([fetchPennant('ar'), fetchPennant('ar')]);
    await fetchPennant('ar');
    expect(a).toBe(b);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await fetchPennant('ar', { base: '/other' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects unknown codes without fetching', async () => {
    await expect(fetchPennant('zz')).rejects.toThrow(RangeError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects HTTP errors and retries afterwards', async () => {
    fetchMock.mockImplementationOnce(async () => respond('Not found', 404));
    await expect(fetchPennant('ar')).rejects.toThrow(/HTTP 404/);
    await expect(fetchPennant('ar')).resolves.toBe(ar.trim());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects network failures', async () => {
    fetchMock.mockImplementationOnce(() => Promise.reject(new TypeError('offline')));
    await expect(fetchPennant('ar')).rejects.toThrow('offline');
  });

  it.each([
    ['an HTML page', '<!doctype html><html><body>404</body></html>'],
    ['an empty body', ''],
    ['a truncated svg', '<svg viewBox="0 0 66 72">'],
    ['a script', '<svg><script>alert(1)</script></svg>'],
    ['an event handler', '<svg onload="alert(1)"></svg>'],
    ['a javascript: URL', '<svg><a href="javascript:alert(1)"><path/></a></svg>'],
    ['a foreignObject', '<svg><foreignObject><div/></foreignObject></svg>'],
    ['an iframe', '<svg><iframe src="x"></iframe></svg>'],
  ])('rejects %s', async (_name, body) => {
    fetchMock.mockImplementationOnce(async () => respond(body));
    await expect(fetchPennant('ar')).rejects.toThrow(TypeError);
  });

  it('fetches the shape folder', async () => {
    await fetchPennant('ar', { shape: 'circle', base: '/b' });
    expect(fetchMock).toHaveBeenCalledWith('/b/svg/circle/ar.svg');
    await expect(fetchPennant('ar', { shape: 'hex' as 'rect' })).rejects.toThrow(RangeError);
  });

  it('accepts every static asset of every shape', async () => {
    const root = new URL('../', import.meta.url);
    fetchMock.mockImplementation(async (url) =>
      respond(readFileSync(new URL(String(url).slice(1), root), 'utf8')),
    );
    for (const shape of SHAPES) {
      for (const code of codes) {
        await expect(fetchPennant(code, { base: '', shape })).resolves.toMatch(/^<svg/);
      }
    }
    expect(fetchMock).toHaveBeenCalledTimes(codes.length * SHAPES.length);
  });
});
