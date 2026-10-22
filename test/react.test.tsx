// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { StrictMode, createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ar from '../src/generated/flags/ar.ts';
import br from '../src/generated/flags/br.ts';
import * as core from '../src/index.ts';
import * as load from '../src/internal/load.ts';
import type * as Load from '../src/internal/load.ts';
import { clearMarkupCache, loadMarkup } from '../src/internal/cache.ts';
import { clearFetchCache } from '../src/internal/fetch.ts';
import { Pennant, PennantSvg, pennantBox } from '../src/react/index.ts';

vi.mock('../src/internal/load.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof Load>();
  return { ...actual, loadPennant: vi.fn(actual.loadPennant) };
});

const loadPennant = vi.mocked(load.loadPennant);

function deferred(): {
  promise: Promise<string>;
  resolve: (v: string) => void;
  reject: (e: unknown) => void;
} {
  let resolve!: (v: string) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<string>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const ids = (root: Element): string[] => [...root.querySelectorAll('[id]')].map((el) => el.id);

beforeEach(() => {
  clearMarkupCache();
  loadPennant.mockReset();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('pennantBox', () => {
  it('derives width from a pixel height', () => {
    expect(pennantBox(72)).toEqual({ width: '66px', height: '72px' });
    expect(pennantBox(32)).toEqual({ width: '29.333px', height: '32px' });
  });

  it('uses calc() for CSS lengths and defaults to 1em', () => {
    expect(pennantBox('2rem')).toEqual({ width: 'calc(2rem * 66 / 72)', height: '2rem' });
    expect(pennantBox()).toEqual({ width: 'calc(1em * 66 / 72)', height: '1em' });
  });
});

describe('<Pennant> inline mode', () => {
  it('reserves the box while loading, then inlines the svg', async () => {
    render(<Pennant code="ar" size={32} data-testid="p" />);
    const el = screen.getByTestId('p');
    expect(el.tagName).toBe('SPAN');
    expect(el.innerHTML).toBe('');
    expect(el.style.display).toBe('inline-block');
    expect(el.style.height).toBe('32px');
    expect(el.style.width).toBe('29.333px');
    await waitFor(() => expect(el.querySelector('svg')).not.toBeNull());
    const svg = el.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('100%');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(loadPennant).toHaveBeenCalledWith('ar');
  });

  it('exposes role="img" and the default localised name', () => {
    render(<Pennant code="ar" />);
    expect(screen.getByRole('img', { name: 'Argentina' })).toBeDefined();
  });

  it('accepts any casing and localises the default name', () => {
    render(<Pennant code="AR" locale="es" data-testid="p" />);
    expect(screen.getByTestId('p').getAttribute('aria-label')).toBe('Argentina');
    expect(screen.getByTestId('p').dataset.pennant).toBe('ar');
    cleanup();
    render(<Pennant code="de" locale="es" />);
    expect(screen.getByRole('img', { name: 'Alemania' })).toBeDefined();
  });

  it('uses an explicit title', () => {
    render(<Pennant code="ar" title="Home team" />);
    expect(screen.getByRole('img', { name: 'Home team' })).toBeDefined();
  });

  it('marks title="" as decorative', () => {
    render(<Pennant code="ar" title="" data-testid="p" />);
    const el = screen.getByTestId('p');
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-label')).toBe(false);
  });

  it('forwards attributes, merges style and forwards the ref', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Pennant
        ref={ref}
        code="ar"
        size="3rem"
        className="flag"
        id="main"
        style={{ verticalAlign: 'middle', display: 'block' }}
        onClick={() => {}}
      />,
    );
    const el = ref.current;
    expect(el?.id).toBe('main');
    expect(el?.className).toBe('flag');
    expect(el?.style.verticalAlign).toBe('middle');
    expect(el?.style.display).toBe('block');
    expect(el?.style.height).toBe('3rem');
  });

  it('renders synchronously (no flash) once a flag is cached', async () => {
    const first = render(<Pennant code="ar" data-testid="p" />);
    await waitFor(() => expect(screen.getByTestId('p').querySelector('svg')).not.toBeNull());
    first.unmount();
    render(<Pennant code="ar" data-testid="p" />);
    expect(screen.getByTestId('p').querySelector('svg')).not.toBeNull();
    expect(loadPennant).toHaveBeenCalledTimes(1);
  });

  it('de-duplicates concurrent loads of the same flag', async () => {
    render(
      <>
        <Pennant code="ar" data-testid="a" />
        <Pennant code="ar" data-testid="b" />
      </>,
    );
    await waitFor(() => expect(screen.getByTestId('b').querySelector('svg')).not.toBeNull());
    expect(loadPennant).toHaveBeenCalledTimes(1);
  });

  it('gives each instance a unique id namespace', async () => {
    render(
      <>
        <Pennant code="ar" data-testid="a" />
        <Pennant code="ar" data-testid="b" style={{ display: 'none' }} />
      </>,
    );
    const a = screen.getByTestId('a');
    const b = screen.getByTestId('b');
    await waitFor(() => expect(b.querySelector('svg')).not.toBeNull());
    const idsA = ids(a);
    const idsB = ids(b);
    expect(idsA.length).toBeGreaterThan(2);
    expect(idsA.some((id) => idsB.includes(id))).toBe(false);
    expect(a.innerHTML).not.toContain('pn-ar-');
    const clipId = a.querySelector('clipPath')?.id;
    expect(a.querySelector('g[clip-path]')?.getAttribute('clip-path')).toBe(`url(#${clipId})`);
  });

  it('ignores a stale load that resolves after the code changed', async () => {
    const slow = deferred();
    const fast = deferred();
    loadPennant.mockImplementation((code) => (code === 'ar' ? slow.promise : fast.promise));
    const { rerender } = render(<Pennant code="ar" data-testid="p" />);
    rerender(<Pennant code="br" data-testid="p" />);
    const el = screen.getByTestId('p');
    expect(el.getAttribute('aria-label')).toBe('Brazil');
    await waitFor(() => expect(loadPennant).toHaveBeenCalledTimes(2));
    await act(async () => fast.resolve(br));
    await waitFor(() => expect(el.querySelector('clipPath')?.id).toMatch(/clip$/));
    expect(el.innerHTML).toContain('#229e45'); // Brazil green
    await act(async () => slow.resolve(ar));
    await act(async () => {});
    expect(el.innerHTML).toContain('#229e45');
    expect(el.innerHTML).not.toContain('#74acdf'); // Argentina blue
  });

  it('clears the previous flag when the code changes to an unloaded one', async () => {
    const { rerender } = render(<Pennant code="ar" data-testid="p" />);
    const el = screen.getByTestId('p');
    await waitFor(() => expect(el.querySelector('svg')).not.toBeNull());
    const pending = deferred();
    loadPennant.mockImplementation(() => pending.promise);
    rerender(<Pennant code="br" data-testid="p" />);
    expect(el.innerHTML).toBe('');
    await act(async () => pending.resolve(br));
    await waitFor(() => expect(el.innerHTML).toContain('#229e45'));
  });

  it('does not update after unmount', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const pending = deferred();
    loadPennant.mockImplementation(() => pending.promise);
    const { unmount } = render(<Pennant code="ar" />);
    unmount();
    await act(async () => pending.resolve(ar));
    expect(error).not.toHaveBeenCalled();
  });

  it('keeps an empty reserved box when loading fails, and retries later', async () => {
    loadPennant.mockImplementationOnce(() => Promise.reject(new Error('offline')));
    const first = render(<Pennant code="ar" data-testid="p" />);
    await act(async () => {});
    expect(screen.getByTestId('p').innerHTML).toBe('');
    first.unmount();
    render(<Pennant code="ar" data-testid="p" />);
    await waitFor(() => expect(screen.getByTestId('p').querySelector('svg')).not.toBeNull());
    expect(loadPennant).toHaveBeenCalledTimes(2);
  });

  it('works under StrictMode', async () => {
    render(
      <StrictMode>
        <Pennant code="ar" data-testid="p" />
      </StrictMode>,
    );
    await waitFor(() => expect(screen.getByTestId('p').querySelector('svg')).not.toBeNull());
  });

  it('accepts uppercase multi-part codes', () => {
    render(<Pennant code="GB-ENG" mode="img" />);
    expect(screen.getByRole('img', { name: 'England' }).getAttribute('src')).toBe(
      core.pennantUrl('gb-eng'),
    );
  });

  it('throws a RangeError for unknown codes', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Pennant code={'zz' as 'ar'} />)).toThrow(RangeError);
  });

  it('hydrates server markup without mismatch, then loads', async () => {
    const html = renderToString(<Pennant code="ar" data-testid="p" />);
    // Even with the flag cached on the client, hydration uses the server snapshot.
    await loadMarkup('ar');
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(container, <Pennant code="ar" data-testid="p" />);
    });
    await waitFor(() => expect(container.querySelector('svg')).not.toBeNull());
    expect(error).not.toHaveBeenCalled();
    act(() => root?.unmount());
    container.remove();
  });
});

describe('<Pennant mode="img">', () => {
  it('renders a lazy <img> from the CDN by default', () => {
    render(<Pennant code="ar" mode="img" />);
    const img = screen.getByRole('img', { name: 'Argentina' }) as HTMLImageElement;
    expect(img.tagName).toBe('IMG');
    expect(img.getAttribute('src')).toBe(core.pennantUrl('ar'));
    expect(img.getAttribute('alt')).toBe('Argentina');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('decoding')).toBe('async');
    expect(img.getAttribute('width')).toBe('66');
    expect(img.getAttribute('height')).toBe('72');
    expect(img.style.height).toBe('1em');
    expect(loadPennant).not.toHaveBeenCalled();
  });

  it('honours base, size, loading/decoding overrides and the ref', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Pennant
        ref={ref}
        code="gb-eng"
        mode="img"
        base="/assets/pennants/"
        size={36}
        loading="eager"
        decoding="sync"
        className="f"
      />,
    );
    const img = ref.current as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('/assets/pennants/svg/gb-eng.svg');
    expect(img.getAttribute('width')).toBe('33');
    expect(img.getAttribute('height')).toBe('36');
    expect(img.style.width).toBe('33px');
    expect(img.getAttribute('loading')).toBe('eager');
    expect(img.getAttribute('decoding')).toBe('sync');
    expect(img.className).toBe('f');
  });

  it('uses an empty alt when decorative', () => {
    const { container } = render(<Pennant code="ar" mode="img" title="" />);
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('');
  });
});

describe('<PennantSvg>', () => {
  it('renders statically imported markup synchronously', () => {
    render(<PennantSvg svg={ar} size={48} data-testid="p" />);
    const el = screen.getByTestId('p');
    expect(el.querySelector('svg')).not.toBeNull();
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Argentina');
    expect(el.dataset.pennant).toBe('ar');
    expect(el.style.height).toBe('48px');
  });

  it('server-renders with scoped ids', () => {
    const html = renderToString(
      <>
        <PennantSvg svg={ar} />
        <PennantSvg svg={ar} title="" />
      </>,
    );
    expect(html).not.toContain('pn-ar-');
    expect(html).toContain('aria-label="Argentina"');
    expect(html).toContain('aria-hidden="true"');
    const clipIds = [...html.matchAll(/<clipPath id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(clipIds).size).toBe(2);
  });

  it('is decorative by default for foreign markup and forwards the ref', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<PennantSvg ref={ref} svg='<svg viewBox="0 0 1 1"></svg>' />);
    expect(ref.current?.getAttribute('aria-hidden')).toBe('true');
    expect(ref.current?.hasAttribute('data-pennant')).toBe(false);
  });

  it('uses an explicit title and locale', () => {
    render(<PennantSvg svg={ar} locale="fr" />);
    expect(screen.getByRole('img', { name: 'Argentine' })).toBeDefined();
    cleanup();
    render(<PennantSvg svg={ar} title="Flag" />);
    expect(screen.getByRole('img', { name: 'Flag' })).toBeDefined();
  });
});

describe('<Pennant mode="fetch">', () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => {
    clearFetchCache();
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => new Response(ar));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches from base, inlines with scoped ids and skips the bundled loaders', async () => {
    render(
      <>
        <Pennant code="ar" mode="fetch" base="/assets/" data-testid="a" size={20} />
        <Pennant code="ar" mode="fetch" base="/assets/" data-testid="b" />
      </>,
    );
    const a = screen.getByTestId('a');
    expect(a.innerHTML).toBe('');
    expect(a.style.height).toBe('20px');
    expect(a.getAttribute('aria-label')).toBe('Argentina');
    await waitFor(() => expect(screen.getByTestId('b').querySelector('svg')).not.toBeNull());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/assets/svg/ar.svg');
    expect(loadPennant).not.toHaveBeenCalled();
    expect(a.innerHTML).not.toContain('pn-ar-');
    const idsA = ids(a);
    expect(idsA.some((id) => ids(screen.getByTestId('b')).includes(id))).toBe(false);
  });

  it('defaults to the versioned CDN', async () => {
    render(<Pennant code="ar" mode="fetch" data-testid="p" />);
    await waitFor(() => expect(screen.getByTestId('p').querySelector('svg')).not.toBeNull());
    expect(fetchMock).toHaveBeenCalledWith(`${core.DEFAULT_CDN_BASE}/svg/ar.svg`);
  });

  it('keeps fetch and bundled caches apart', async () => {
    await loadMarkup('ar');
    render(<Pennant code="ar" mode="fetch" base="/x" data-testid="p" />);
    expect(screen.getByTestId('p').innerHTML).toBe('');
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/x/svg/ar.svg'));
  });

  it('refetches when base changes', async () => {
    const { rerender } = render(<Pennant code="ar" mode="fetch" base="/one" />);
    rerender(<Pennant code="ar" mode="fetch" base="/two" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/two/svg/ar.svg'));
    expect(fetchMock).toHaveBeenCalledWith('/one/svg/ar.svg');
  });

  it('leaves the reserved box empty when the response is not a pennant', async () => {
    fetchMock.mockImplementation(async () => new Response('<html>oops</html>'));
    render(<Pennant code="ar" mode="fetch" base="/bad" data-testid="p" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await act(async () => {});
    expect(screen.getByTestId('p').innerHTML).toBe('');
  });
});
