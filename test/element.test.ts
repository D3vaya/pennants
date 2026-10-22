// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ar from '../src/generated/art/1x1/ar.ts';
import br from '../src/generated/art/1x1/br.ts';
import { renderFlag } from '../src/index.ts';
import type { FlagArt } from '../src/shapes.ts';
import * as load from '../src/internal/load.ts';
import type * as Load from '../src/internal/load.ts';
import { clearFlagCache } from '../src/internal/cache.ts';
import { clearFetchCache } from '../src/internal/fetch.ts';
import { PENNANT_ELEMENT_CSS, PennantElement, definePennantElement } from '../src/element/index.ts';
import type { PennantErrorDetail, PennantLoadDetail } from '../src/element/index.ts';

vi.mock('../src/internal/load.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof Load>();
  return { ...actual, loadArt: vi.fn(actual.loadArt) };
});

const loadArt = vi.mocked(load.loadArt);

function deferred(): { promise: Promise<FlagArt>; resolve: (v: FlagArt) => void } {
  let resolve!: (v: FlagArt) => void;
  const promise = new Promise<FlagArt>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

function nextEvent<T>(el: HTMLElement, type: 'pennant-load' | 'pennant-error'): Promise<T> {
  return new Promise((resolve) =>
    el.addEventListener(type, (event) => resolve((event as CustomEvent<T>).detail), { once: true }),
  );
}

function create(attrs: Record<string, string> = {}): PennantElement {
  const el = document.createElement('pennant-flag');
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
  return el;
}

const content = (el: PennantElement): HTMLElement => {
  const span = el.shadowRoot?.querySelector('span');
  if (!span) throw new Error('missing content node');
  return span;
};

definePennantElement();

beforeEach(() => {
  clearFlagCache();
  loadArt.mockReset();
});
afterEach(() => {
  document.body.replaceChildren();
});

describe('definePennantElement', () => {
  it('registers pennant-flag and is idempotent', () => {
    expect(customElements.get('pennant-flag')).toBe(PennantElement);
    expect(definePennantElement()).toBe(PennantElement);
    expect(definePennantElement('pennant-flag')).toBe(PennantElement);
  });

  it('supports extra tag names via a subclass', () => {
    const Ctor = definePennantElement('my-flag');
    expect(Ctor).not.toBe(PennantElement);
    expect(definePennantElement('my-flag')).toBe(Ctor);
    expect(document.createElement('my-flag')).toBeInstanceOf(PennantElement);
  });
});

describe('<pennant-flag>', () => {
  it('uses an open shadow root with sizing styles (<style> fallback without adoptedStyleSheets)', () => {
    const el = create();
    const style = el.shadowRoot?.querySelector('style')?.textContent ?? '';
    expect(style).toBe(PENNANT_ELEMENT_CSS);
    expect(style).toContain(
      ':host{display:inline-block;height:var(--pennant-size,1em);aspect-ratio:66/72}',
    );
    expect(content(el).getAttribute('part')).toBe('svg');
  });

  it('lazy-loads on connect and fires pennant-load', async () => {
    const el = create({ code: 'AR' });
    await flush();
    expect(loadArt).not.toHaveBeenCalled(); // not connected yet
    const loaded = nextEvent<PennantLoadDetail>(el, 'pennant-load');
    document.body.append(el);
    expect(await loaded).toEqual({ code: 'ar' });
    expect(loadArt).toHaveBeenCalledWith('ar', { set: '1x1' });
    const svg = content(el).querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('100%');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('bubbles events so they can be delegated', async () => {
    const listener = vi.fn();
    document.body.addEventListener('pennant-load', listener);
    document.body.append(create({ code: 'ar' }));
    await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1));
    document.body.removeEventListener('pennant-load', listener);
  });

  it('sets role="img" and the default name', () => {
    const el = create({ code: 'gb-eng' });
    document.body.append(el);
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('England');
  });

  it('prefers label, and label="" marks it decorative', () => {
    const el = create({ code: 'ar', label: 'Home' });
    document.body.append(el);
    expect(el.getAttribute('aria-label')).toBe('Home');
    el.label = '';
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-label')).toBe(false);
    el.label = null;
    expect(el.hasAttribute('aria-hidden')).toBe(false);
    expect(el.getAttribute('aria-label')).toBe('Argentina');
  });

  it('is hidden instead of an unnamed role="img" for unknown or missing codes', () => {
    const el = create({ code: 'zz' });
    document.body.append(el);
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-label')).toBe(false);
    expect(el.getAttribute('aria-hidden')).toBe('true');
    el.label = 'Unknown flag';
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Unknown flag');
    expect(el.hasAttribute('aria-hidden')).toBe(false);
    el.label = null;
    el.removeAttribute('code');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('is hidden after a failed load without a label, and named again once loaded', async () => {
    loadArt.mockImplementationOnce(() => Promise.reject(new Error('offline')));
    const el = create({ code: 'ar' });
    const failed = nextEvent(el, 'pennant-error');
    document.body.append(el);
    expect(el.getAttribute('aria-label')).toBe('Argentina');
    await failed;
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-label')).toBe(false);
    expect(el.getAttribute('aria-hidden')).toBe('true');
    el.code = 'br';
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Brazil');
    await nextEvent(el, 'pennant-load');
    expect(el.getAttribute('aria-label')).toBe('Brazil');
  });

  it('keeps an explicit label after a failed load', async () => {
    loadArt.mockImplementationOnce(() => Promise.reject(new Error('offline')));
    const el = create({ code: 'ar', label: 'Home' });
    const failed = nextEvent(el, 'pennant-error');
    document.body.append(el);
    await failed;
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Home');
  });

  it('reflects properties to attributes and back', () => {
    const el = create();
    el.code = 'br';
    el.size = 24;
    el.label = 'Brasil';
    expect(el.getAttribute('code')).toBe('br');
    expect(el.getAttribute('size')).toBe('24');
    expect(el.getAttribute('label')).toBe('Brasil');
    el.setAttribute('code', 'ar');
    expect(el.code).toBe('ar');
    el.code = null;
    el.size = null;
    el.label = null;
    expect(el.hasAttribute('code')).toBe(false);
    expect(el.size).toBeNull();
    expect(el.label).toBeNull();
  });

  it('maps size to the --pennant-size custom property', () => {
    const el = create({ size: '32' });
    expect(el.style.getPropertyValue('--pennant-size')).toBe('32px');
    el.size = 1.5;
    expect(el.style.getPropertyValue('--pennant-size')).toBe('1.5px');
    el.size = '2rem';
    expect(el.style.getPropertyValue('--pennant-size')).toBe('2rem');
    el.size = '';
    expect(el.style.getPropertyValue('--pennant-size')).toBe('');
    el.size = null;
    expect(el.style.getPropertyValue('--pennant-size')).toBe('');
  });

  it("never removes the user's own --pennant-size", () => {
    const el = create();
    el.style.setProperty('--pennant-size', '48px');
    document.body.append(el);
    expect(el.style.getPropertyValue('--pennant-size')).toBe('48px');
    el.setAttribute('label', 'x'); // unrelated attribute changes keep it too
    expect(el.style.getPropertyValue('--pennant-size')).toBe('48px');
    el.size = 20;
    expect(el.style.getPropertyValue('--pennant-size')).toBe('20px');
    el.size = '2rem';
    expect(el.style.getPropertyValue('--pennant-size')).toBe('2rem');
    el.size = null; // restores the user's value
    expect(el.style.getPropertyValue('--pennant-size')).toBe('48px');
  });

  it('leaves a --pennant-size the user changed after the size attribute', () => {
    const el = create({ size: '20' });
    el.style.setProperty('--pennant-size', '3em');
    el.removeAttribute('size');
    expect(el.style.getPropertyValue('--pennant-size')).toBe('3em');
  });

  it('upgrades properties set before definition', async () => {
    const el = document.createElement('late-flag') as PennantElement;
    (el as unknown as Record<string, unknown>).code = 'ar';
    (el as unknown as Record<string, unknown>).size = 20;
    document.body.append(el);
    definePennantElement('late-flag');
    expect(el).toBeInstanceOf(PennantElement);
    expect(el.getAttribute('code')).toBe('ar');
    expect(el.getAttribute('size')).toBe('20');
    await vi.waitFor(() => expect(content(el).querySelector('svg')).not.toBeNull());
  });

  it('reloads when code changes and ignores stale results', async () => {
    const slow = deferred();
    const fast = deferred();
    loadArt.mockImplementation((code) => (code === 'ar' ? slow.promise : fast.promise));
    const el = create({ code: 'ar' });
    const events: string[] = [];
    el.addEventListener('pennant-load', (e) => events.push(e.detail.code));
    document.body.append(el);
    el.code = 'br';
    expect(el.getAttribute('aria-label')).toBe('Brazil');
    fast.resolve(br);
    await flush();
    slow.resolve(ar);
    await flush();
    expect(content(el).innerHTML).toContain('#229e45');
    expect(content(el).innerHTML).not.toContain('#74acdf');
    expect(events).toEqual(['br']);
  });

  it('keeps the current flag while the next one loads', async () => {
    const el = create({ code: 'ar' });
    document.body.append(el);
    await nextEvent(el, 'pennant-load');
    const pending = deferred();
    loadArt.mockImplementation(() => pending.promise);
    el.code = 'br';
    expect(content(el).innerHTML).toContain('#74acdf');
    pending.resolve(br);
    await nextEvent(el, 'pennant-load');
    expect(content(el).innerHTML).toContain('#229e45');
  });

  it('shows cached flags synchronously', async () => {
    const first = create({ code: 'ar' });
    document.body.append(first);
    await nextEvent(first, 'pennant-load');
    const second = create({ code: 'ar' });
    document.body.append(second);
    expect(content(second).querySelector('svg')).not.toBeNull();
    expect(loadArt).toHaveBeenCalledTimes(1);
  });

  it('ignores loads that finish while detached and resumes on reconnect', async () => {
    const pending = deferred();
    loadArt.mockImplementationOnce(() => pending.promise);
    const el = create({ code: 'ar' });
    const listener = vi.fn();
    el.addEventListener('pennant-load', listener);
    document.body.append(el);
    el.remove();
    pending.resolve(ar);
    await flush();
    expect(listener).not.toHaveBeenCalled();
    expect(content(el).innerHTML).toBe('');
    document.body.append(el); // cached now: rendered synchronously
    expect(content(el).querySelector('svg')).not.toBeNull();
    await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1));
  });

  it('does not reload when moved after loading', async () => {
    const el = create({ code: 'ar' });
    document.body.append(el);
    await nextEvent(el, 'pennant-load');
    const listener = vi.fn();
    el.addEventListener('pennant-load', listener);
    const host = document.createElement('div');
    document.body.append(host);
    host.append(el);
    await flush();
    expect(listener).not.toHaveBeenCalled();
  });

  it('fires pennant-error for unknown codes and clears the content', async () => {
    const el = create({ code: 'ar' });
    document.body.append(el);
    await nextEvent(el, 'pennant-load');
    const failed = nextEvent<PennantErrorDetail>(el, 'pennant-error');
    el.code = 'ZZ';
    const detail = await failed;
    expect(detail.code).toBe('ZZ');
    expect(detail.error).toBeInstanceOf(RangeError);
    expect(content(el).innerHTML).toBe('');
  });

  it('reloads on reconnect when the code became invalid while detached', async () => {
    const el = create({ code: 'ar' });
    document.body.append(el);
    await nextEvent(el, 'pennant-load');
    el.remove();
    el.code = 'zz';
    const failed = nextEvent<PennantErrorDetail>(el, 'pennant-error');
    document.body.append(el);
    expect((await failed).code).toBe('zz');
    expect(content(el).innerHTML).toBe('');
  });

  it('fires pennant-error when the chunk fails to load', async () => {
    loadArt.mockImplementationOnce(() => Promise.reject(new Error('offline')));
    const el = create({ code: 'ar' });
    const failed = nextEvent<PennantErrorDetail>(el, 'pennant-error');
    document.body.append(el);
    expect((await failed).error).toEqual(new Error('offline'));
  });

  it('ignores errors of stale loads', async () => {
    let reject!: (e: unknown) => void;
    loadArt.mockImplementationOnce(() => new Promise<FlagArt>((_resolve, rej) => (reject = rej)));
    const el = create({ code: 'ar' });
    const listener = vi.fn();
    el.addEventListener('pennant-error', listener);
    document.body.append(el);
    el.code = 'br';
    const loaded = nextEvent(el, 'pennant-load');
    await vi.waitFor(() => expect(loadArt).toHaveBeenCalledWith('ar', { set: '1x1' }));
    reject(new Error('late'));
    await loaded;
    expect(listener).not.toHaveBeenCalled();
  });

  it('clears the flag when code is removed', async () => {
    const el = create({ code: 'ar' });
    document.body.append(el);
    await nextEvent(el, 'pennant-load');
    el.removeAttribute('code');
    expect(content(el).innerHTML).toBe('');
    expect(el.hasAttribute('aria-label')).toBe(false);
  });

  it('skips work when an attribute is set to the same value', () => {
    const el = create({ code: 'ar' });
    document.body.append(el);
    loadArt.mockClear();
    el.setAttribute('code', 'ar');
    expect(loadArt).not.toHaveBeenCalled();
  });

  it('renders nothing without a code', () => {
    const el = create();
    document.body.append(el);
    expect(content(el).innerHTML).toBe('');
  });
});

describe('<pennant-flag> fetch mode', () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => {
    clearFetchCache();
    fetchMock.mockReset();
    fetchMock.mockImplementation(
      async (url) => new Response(renderFlag(String(url).endsWith('/br.svg') ? br : ar)),
    );
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches from the base attribute instead of the bundled chunks', async () => {
    const el = create({ code: 'ar', base: '/assets' });
    const loaded = nextEvent<PennantLoadDetail>(el, 'pennant-load');
    document.body.append(el);
    expect(await loaded).toEqual({ code: 'ar' });
    expect(fetchMock).toHaveBeenCalledWith('/assets/svg/pennant/ar.svg');
    expect(loadArt).not.toHaveBeenCalled();
    expect(content(el).querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('reflects base and reloads when it changes, without touching a11y', async () => {
    const el = create({ code: 'ar', label: 'Home' });
    document.body.append(el);
    await nextEvent(el, 'pennant-load');
    expect(fetchMock).not.toHaveBeenCalled();
    const loaded = nextEvent(el, 'pennant-load');
    el.base = '/cdn';
    expect(el.getAttribute('base')).toBe('/cdn');
    await loaded;
    expect(fetchMock).toHaveBeenCalledWith('/cdn/svg/pennant/ar.svg');
    expect(el.getAttribute('aria-label')).toBe('Home');
    el.base = null;
    expect(el.hasAttribute('base')).toBe(false);
  });

  it('switches a whole tag to fetch mode via definePennantElement(tag, { base })', async () => {
    const Ctor = definePennantElement('cdn-flag', { base: '/static' });
    expect(Ctor).not.toBe(PennantElement);
    expect(Ctor?.defaultBase).toBe('/static');
    expect(PennantElement.defaultBase).toBeUndefined();
    expect(definePennantElement('cdn-flag', { base: '/ignored' })).toBe(Ctor);
    const el = document.createElement('cdn-flag') as PennantElement;
    el.setAttribute('code', 'br');
    const loaded = nextEvent(el, 'pennant-load');
    document.body.append(el);
    await loaded;
    expect(fetchMock).toHaveBeenCalledWith('/static/svg/pennant/br.svg');
    expect(content(el).innerHTML).toContain('#229e45');
    // A per-element attribute wins over the tag default.
    const other = document.createElement('cdn-flag') as PennantElement;
    other.setAttribute('code', 'ar');
    other.setAttribute('base', '/mine');
    const otherLoaded = nextEvent(other, 'pennant-load');
    document.body.append(other);
    await otherLoaded;
    expect(fetchMock).toHaveBeenCalledWith('/mine/svg/pennant/ar.svg');
  });

  it('fires pennant-error for invalid responses', async () => {
    fetchMock.mockImplementation(async () => new Response('<html></html>'));
    const el = create({ code: 'ar', base: '/bad' });
    const failed = nextEvent<PennantErrorDetail>(el, 'pennant-error');
    document.body.append(el);
    expect((await failed).error).toBeInstanceOf(TypeError);
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('<pennant-flag shape>', () => {
  it('reflects shape, sets the aspect ratio rule and loads the matching art set', async () => {
    const el = create({ code: 'ar', shape: 'rect' });
    expect(el.shape).toBe('rect');
    const loaded = nextEvent(el, 'pennant-load');
    document.body.append(el);
    await loaded;
    expect(loadArt).toHaveBeenCalledWith('ar', { set: '4x3' });
    expect(content(el).querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 64 48');
    expect(PENNANT_ELEMENT_CSS).toContain(':host([shape=rect]){aspect-ratio:4/3}');
    expect(PENNANT_ELEMENT_CSS).toContain(
      ':host([shape=square]),:host([shape=circle]){aspect-ratio:1}',
    );
  });

  it('re-renders when the shape changes, reusing cached 1x1 art', async () => {
    const el = create({ code: 'ar' });
    document.body.append(el);
    await nextEvent(el, 'pennant-load');
    const loaded = nextEvent(el, 'pennant-load');
    el.shape = 'circle';
    expect(content(el).querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 48 48'); // cached art
    await loaded;
    expect(loadArt).toHaveBeenCalledTimes(1);
    expect(el.getAttribute('aria-label')).toBe('Argentina');
    el.shape = null;
    expect(el.hasAttribute('shape')).toBe(false);
    expect(content(el).querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 66 72');
  });

  it('fires pennant-error for unknown shapes', async () => {
    const el = create({ code: 'ar', shape: 'hex' });
    const failed = nextEvent<PennantErrorDetail>(el, 'pennant-error');
    document.body.append(el);
    expect((await failed).error).toBeInstanceOf(RangeError);
    expect(content(el).innerHTML).toBe('');
    expect(loadArt).not.toHaveBeenCalled();
  });

  it('fetches the shape folder in fetch mode', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(renderFlag(ar, { shape: 'square' })),
    );
    vi.stubGlobal('fetch', fetchMock);
    clearFetchCache();
    const el = create({ code: 'ar', shape: 'square', base: '/s' });
    const loaded = nextEvent(el, 'pennant-load');
    document.body.append(el);
    await loaded;
    expect(fetchMock).toHaveBeenCalledWith('/s/svg/square/ar.svg');
    vi.unstubAllGlobals();
  });
});
