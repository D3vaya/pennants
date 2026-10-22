// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ar from '../src/generated/flags/ar.ts';
import br from '../src/generated/flags/br.ts';
import * as core from '../src/index.ts';
import type * as Core from '../src/index.ts';
import { clearMarkupCache } from '../src/internal/cache.ts';
import { PennantElement, definePennantElement } from '../src/element/index.ts';
import type { PennantErrorDetail, PennantLoadDetail } from '../src/element/index.ts';

vi.mock('../src/index.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof Core>();
  return { ...actual, loadPennant: vi.fn(actual.loadPennant) };
});

const loadPennant = vi.mocked(core.loadPennant);

function deferred(): { promise: Promise<string>; resolve: (v: string) => void } {
  let resolve!: (v: string) => void;
  const promise = new Promise<string>((res) => {
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
  clearMarkupCache();
  loadPennant.mockReset();
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
  it('uses an open shadow root with sizing styles', () => {
    const el = create();
    const style = el.shadowRoot?.querySelector('style')?.textContent ?? '';
    expect(style).toContain(
      ':host{display:inline-block;height:var(--pennant-size,1em);aspect-ratio:66/72}',
    );
    expect(content(el).getAttribute('part')).toBe('svg');
  });

  it('lazy-loads on connect and fires pennant-load', async () => {
    const el = create({ code: 'AR' });
    await flush();
    expect(loadPennant).not.toHaveBeenCalled(); // not connected yet
    const loaded = nextEvent<PennantLoadDetail>(el, 'pennant-load');
    document.body.append(el);
    expect(await loaded).toEqual({ code: 'ar' });
    expect(loadPennant).toHaveBeenCalledWith('ar');
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

  it('has no aria-label without a valid code or label', () => {
    const el = create({ code: 'zz' });
    document.body.append(el);
    expect(el.getAttribute('role')).toBe('img');
    expect(el.hasAttribute('aria-label')).toBe(false);
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
    loadPennant.mockImplementation((code) => (code === 'ar' ? slow.promise : fast.promise));
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
    loadPennant.mockImplementation(() => pending.promise);
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
    expect(loadPennant).toHaveBeenCalledTimes(1);
  });

  it('ignores loads that finish while detached and resumes on reconnect', async () => {
    const pending = deferred();
    loadPennant.mockImplementationOnce(() => pending.promise);
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

  it('fires pennant-error when the chunk fails to load', async () => {
    loadPennant.mockImplementationOnce(() => Promise.reject(new Error('offline')));
    const el = create({ code: 'ar' });
    const failed = nextEvent<PennantErrorDetail>(el, 'pennant-error');
    document.body.append(el);
    expect((await failed).error).toEqual(new Error('offline'));
  });

  it('ignores errors of stale loads', async () => {
    let reject!: (e: unknown) => void;
    loadPennant.mockImplementationOnce(
      () => new Promise<string>((_resolve, rej) => (reject = rej)),
    );
    const el = create({ code: 'ar' });
    const listener = vi.fn();
    el.addEventListener('pennant-error', listener);
    document.body.append(el);
    el.code = 'br';
    reject(new Error('late'));
    await nextEvent(el, 'pennant-load');
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
    loadPennant.mockClear();
    el.setAttribute('code', 'ar');
    expect(loadPennant).not.toHaveBeenCalled();
  });

  it('renders nothing without a code', () => {
    const el = create();
    document.body.append(el);
    expect(content(el).innerHTML).toBe('');
  });
});
