// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fetchEntry from '../src/fetch.ts';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import art from '../src/generated/art/1x1/ar.ts';
import { SHAPES, codes, fetchPennant as fromRoot, pennantUrl, renderFlag } from '../src/index.ts';
import { fetchPennant as lazyFetchPennant } from '../src/internal/fetch-lazy.ts';
import { clearFetchCache } from '../src/internal/fetch.ts';
import { sanitizeSvg } from '../src/internal/sanitize.ts';

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

describe('entries', () => {
  it('root exports the lazy-sanitizer variant, pennants/fetch the static one', () => {
    expect(fromRoot).toBe(lazyFetchPennant);
    expect(fetchEntry.fetchPennant).not.toBe(lazyFetchPennant);
    expect(fetchEntry.pennantUrl).toBe(pennantUrl);
    expect(pennantUrl('ar').startsWith(fetchEntry.DEFAULT_CDN_BASE)).toBe(true);
  });
});

// Same sanitizer, same results: every behaviour is checked for both variants.
describe.each([
  ['root (lazy sanitizer)', lazyFetchPennant],
  ['pennants/fetch (static sanitizer)', fetchEntry.fetchPennant],
])('fetchPennant from %s', (_entry, fetchPennant) => {
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
    ['a script', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'],
    ['an event handler', '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>'],
    [
      'an event handler with a slash separator',
      '<svg xmlns="http://www.w3.org/2000/svg"><image/onerror=alert(1) href=x/></svg>',
    ],
    [
      'an image with onerror',
      '<svg xmlns="http://www.w3.org/2000/svg"><image onerror="alert(1)" href="x"/></svg>',
    ],
    [
      'a javascript: URL',
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><path/></a></svg>',
    ],
    [
      'an entity-encoded javascript&colon; URL',
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript&colon;alert(1)"><path/></a></svg>',
    ],
    [
      'a tab-split java&#x09;script: URL on use',
      '<svg xmlns="http://www.w3.org/2000/svg"><use href="java&#x09;script:alert(1)"/></svg>',
    ],
    [
      'an external use reference',
      '<svg xmlns="http://www.w3.org/2000/svg"><use href="https://evil.example/x.svg#a"/></svg>',
    ],
    [
      'an animate rewriting href',
      '<svg xmlns="http://www.w3.org/2000/svg"><a><animate attributeName="href" values="javas&#99;ript:alert(1)"/><path/></a></svg>',
    ],
    [
      'a set rewriting href',
      '<svg xmlns="http://www.w3.org/2000/svg"><use href="#a"><set attributeName="href" to="javascript:alert(1)"/></use></svg>',
    ],
    [
      'a document breakout',
      '<svg xmlns="http://www.w3.org/2000/svg"></svg><form><button formaction=javascript&colon;alert(1)>x</button></form><svg></svg>',
    ],
    [
      'a style element',
      '<svg xmlns="http://www.w3.org/2000/svg"><style>@import url(https://evil.example)</style></svg>',
    ],
    ['a style attribute', '<svg xmlns="http://www.w3.org/2000/svg" style="fill:red"></svg>'],
    [
      'an external url() in a presentation attribute',
      '<svg xmlns="http://www.w3.org/2000/svg"><path fill="url(https://evil.example/#a)"/></svg>',
    ],
    [
      'an embed',
      '<svg xmlns="http://www.w3.org/2000/svg"><embed src="https://evil.example"/></svg>',
    ],
    [
      'a foreignObject',
      '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div/></foreignObject></svg>',
    ],
    ['an iframe', '<svg xmlns="http://www.w3.org/2000/svg"><iframe src="x"></iframe></svg>'],
    [
      'a title (HTML integration point)',
      '<svg xmlns="http://www.w3.org/2000/svg"><title>&lt;img src=x onerror=alert(1)&gt;</title></svg>',
    ],
    [
      'an HTML element in the SVG namespace',
      '<svg xmlns="http://www.w3.org/2000/svg"><a xmlns="http://www.w3.org/1999/xhtml" href="#x"/></svg>',
    ],
    ['an svg without the SVG namespace', '<svg><path d="M0 0"/></svg>'],
    ['a non-svg root', '<g xmlns="http://www.w3.org/2000/svg"/>'],
    [
      'an attribute in a foreign namespace',
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:e="urn:evil"><path e:fill="red"/></svg>',
    ],
  ])('rejects %s', async (_name, body) => {
    fetchMock.mockImplementationOnce(async () => respond(body));
    await expect(fetchPennant('ar')).rejects.toThrow(TypeError);
  });

  it('re-serialises accepted markup and keeps local references', async () => {
    const body =
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1 1">' +
      '<defs><linearGradient id="pn-x-g"/></defs><path id="pn-x-a" fill="url(#pn-x-g)"/>' +
      '<use xlink:href="#pn-x-a"/><use href="#pn-x-a"/></svg>';
    fetchMock.mockImplementationOnce(async () => respond(body));
    const out = await fetchPennant('ar');
    expect(out).toContain('fill="url(#pn-x-g)"');
    expect(out).toContain('xlink:href="#pn-x-a"');
    expect(out.startsWith('<svg')).toBe(true);
  });

  it('fetches the shape folder', async () => {
    await fetchPennant('ar', { shape: 'circle', base: '/b' });
    expect(fetchMock).toHaveBeenCalledWith('/b/svg/circle/ar.svg');
    await expect(fetchPennant('ar', { shape: 'hex' as 'rect' })).rejects.toThrow(RangeError);
  });

  it('accepts every static asset of every shape', async () => {
    fetchMock.mockImplementation(async (url) =>
      respond(readFileSync(join(process.cwd(), String(url).slice(1)), 'utf8')),
    );
    for (const shape of SHAPES) {
      for (const code of codes) {
        await expect(fetchPennant(code, { base: '', shape })).resolves.toMatch(/^<svg/);
      }
    }
    expect(fetchMock).toHaveBeenCalledTimes(codes.length * SHAPES.length);
  }, 60_000); // ~1,100 jsdom XML parses
});

describe('sanitizeSvg', () => {
  const svg = (inner: string, attrs = ''): string =>
    `<svg xmlns="http://www.w3.org/2000/svg"${attrs}>${inner}</svg>`;

  it.each([
    ['a parser error reported inside the root', svg('<parsererror/>')],
    [
      'an xlink prefix bound to a foreign namespace',
      svg('<use xlink:href="#a"/>', ' xmlns:xlink="urn:evil"'),
    ],
    ['a data: value', svg('<path fill="data:x"/>')],
    ['markup characters in a value', svg('<path transform="&lt;script"/>')],
    ['a javascript value outside href', svg('<path d="javascript"/>')],
  ])('rejects %s', (_name, markup) => {
    expect(sanitizeSvg(markup)).toBeUndefined();
  });

  it('accepts local url() references', () => {
    expect(sanitizeSvg(svg('<path clip-path="url( \'#pn-a\' )"/>'))).toContain('clip-path');
  });
});
