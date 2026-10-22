// Default Node environment: no DOMParser.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPennant as staticFetchPennant } from '../src/fetch.ts';
import { fetchPennant } from '../src/internal/fetch-lazy.ts';
import { clearFetchCache } from '../src/internal/fetch.ts';
import { sanitizeSvg } from '../src/internal/sanitize.ts';

afterEach(() => {
  vi.unstubAllGlobals();
  clearFetchCache();
});

describe('fetchPennant without a DOM', () => {
  it('rejects instead of trusting unparsed markup', async () => {
    expect(typeof DOMParser).toBe('undefined');
    vi.stubGlobal('fetch', async () => new Response('<svg xmlns="http://www.w3.org/2000/svg"/>'));
    await expect(fetchPennant('ar')).rejects.toThrow(/needs DOMParser/);
    clearFetchCache();
    await expect(staticFetchPennant('ar')).rejects.toThrow(/needs DOMParser/);
    expect(sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg"/>')).toBeUndefined();
  });
});
