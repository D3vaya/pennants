import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import ar43 from '../src/generated/art/4x3/ar.ts';
import ar from '../src/generated/art/1x1/ar.ts';
import { composeFlag } from '../src/shapes.ts';
import {
  PENNANT_ASPECT_RATIO,
  codes,
  getPennantName,
  isoCodes,
  isPennantCode,
  SHAPES,
  SHAPE_ART,
  SHAPE_SIZE,
  isShape,
  loadArt,
  loadFlag,
  loadPennant,
  pennantUrl,
  renderFlag,
  toShape,
  toDataUri,
  toEmoji,
  toPennantCode,
} from '../src/index.ts';

describe('codes', () => {
  it('covers every ISO 3166-1 country plus extras', () => {
    expect(isoCodes).toHaveLength(249);
    expect(codes).toEqual(expect.arrayContaining(['ar', 'us', 'eu', 'gb-eng']));
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('exposes the 66:72 aspect ratio', () => {
    expect(PENNANT_ASPECT_RATIO).toBeCloseTo(0.9167, 4);
  });
});

describe('isPennantCode / toPennantCode', () => {
  it.each(['ar', 'gb-eng', 'eu'])('accepts %s', (v) => expect(isPennantCode(v)).toBe(true));
  it.each(['zz', '', 42, null, undefined, ' ar', 'AR', 'Gb-Eng'])('rejects %j', (v) =>
    expect(isPennantCode(v)).toBe(false),
  );

  it('normalises casing and whitespace', () => {
    expect(toPennantCode('  AR ')).toBe('ar');
  });

  it('throws RangeError on unknown codes', () => {
    expect(() => toPennantCode('zz')).toThrow(RangeError);
  });
});

describe('loadPennant / loadFlag / loadArt / renderFlag', () => {
  it('loads the SVG of a single flag lazily', async () => {
    const svg = await loadPennant('AR');
    expect(svg).toMatch(/^<svg /);
    expect(svg).toContain('pn-ar-clip');
    expect(svg).toBe(composeFlag(ar, 'pennant'));
  });

  it('loads each shape from its art set', async () => {
    expect(await loadFlag('ar')).toBe(await loadPennant('ar'));
    expect(await loadFlag('ar', { shape: 'rect' })).toBe(composeFlag(ar43, 'rect'));
    for (const shape of ['square', 'circle'] as const) {
      expect(await loadFlag('ar', { shape })).toBe(composeFlag(ar, shape));
    }
  });

  it('loads raw artwork per set', async () => {
    await expect(loadArt('ar')).resolves.toEqual(ar);
    await expect(loadArt('AR', { set: '4x3' })).resolves.toEqual(ar43);
    await expect(loadArt('zz', { set: '4x3' })).rejects.toThrow(RangeError);
  });

  it('accepts a custom id prefix', async () => {
    const custom = renderFlag(ar, { shape: 'circle', idPrefix: 'hero-' });
    expect(custom).toContain('id="hero-clip"');
    expect(custom).not.toContain('pn-ar-');
    expect(await loadFlag('ar', { idPrefix: 'x-' })).toContain('url(#x-clip)');
    expect(() => renderFlag(ar, { idPrefix: '"><script>' })).toThrow();
  });

  it('namespaces ids per shape by default', () => {
    const ids = (svg: string): string[] =>
      [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1] ?? '');
    const all = [
      ...ids(renderFlag(ar)),
      ...ids(renderFlag(ar, { shape: 'square' })),
      ...ids(renderFlag(ar, { shape: 'circle' })),
      ...ids(renderFlag(ar43, { shape: 'rect' })),
    ];
    expect(new Set(all).size).toBe(all.length);
  });

  it('renders static art synchronously', () => {
    expect(renderFlag(ar)).toBe(composeFlag(ar, 'pennant'));
    expect(renderFlag(ar43, { shape: 'rect' })).toBe(composeFlag(ar43, 'rect'));
    expect(() => renderFlag(ar, { shape: 'hex' as 'rect' })).toThrow(RangeError);
  });

  it('rejects unknown codes and shapes', async () => {
    await expect(loadPennant('zz')).rejects.toThrow(RangeError);
    await expect(loadFlag('ar', { shape: 'hex' as 'rect' })).rejects.toThrow(RangeError);
  });

  it('re-exports the shape metadata', () => {
    expect(SHAPES).toEqual(['pennant', 'rect', 'square', 'circle']);
    expect(SHAPE_ART.rect).toBe('4x3');
    expect(SHAPE_SIZE.circle).toEqual({ width: 48, height: 48 });
    expect(isShape('circle')).toBe(true);
    expect(toShape('square')).toBe('square');
    expect(() => toShape('hex')).toThrow(RangeError);
  });
});

describe('getPennantName', () => {
  it('localises ISO countries through Intl', () => {
    expect(getPennantName('de')).toBe('Germany');
    expect(getPennantName('de', 'es')).toBe('Alemania');
  });

  it('falls back to bundled English names for non-ISO codes', () => {
    expect(getPennantName('gb-eng', 'es')).toBe('England');
  });

  it('falls back to English when the locale is invalid', () => {
    expect(getPennantName('ar', '!!')).toBe('Argentina');
  });

  it('uses the bundled name for two-letter codes unknown to Intl', () => {
    expect(getPennantName('xx')).toBe('Unknown');
  });

  it('falls back to the uppercase code when Intl is unavailable', () => {
    const original = Object.getOwnPropertyDescriptor(Intl, 'DisplayNames') ?? {};
    Object.defineProperty(Intl, 'DisplayNames', { ...original, value: undefined });
    try {
      expect(getPennantName('ar')).toBe('AR');
      expect(getPennantName('gb-eng')).toBe('England');
    } finally {
      Object.defineProperty(Intl, 'DisplayNames', original);
    }
  });
});

describe('toDataUri', () => {
  it('URI-encodes the markup', () => {
    expect(toDataUri('<svg a="#"/>')).toBe('data:image/svg+xml,%3Csvg%20a%3D%22%23%22%2F%3E');
  });
});

describe('pennantUrl', () => {
  it('defaults to the jsDelivr SVG', () => {
    expect(pennantUrl('AR')).toBe(
      'https://cdn.jsdelivr.net/npm/pennants@0.0.0-test/svg/pennant/ar.svg',
    );
  });

  it('supports custom bases and PNG densities', () => {
    expect(pennantUrl('ar', { base: '/assets/', format: 'png', scale: 2 })).toBe(
      '/assets/png/pennant/2x/ar.png',
    );
    expect(pennantUrl('ar', { format: 'png' })).toBe(
      'https://cdn.jsdelivr.net/npm/pennants@0.0.0-test/png/pennant/1x/ar.png',
    );
  });

  it('selects the shape folder', () => {
    expect(pennantUrl('ar', { shape: 'circle', base: '' })).toBe('/svg/circle/ar.svg');
    expect(pennantUrl('gb-eng', { shape: 'rect', format: 'png', base: '/a' })).toBe(
      '/a/png/rect/1x/gb-eng.png',
    );
  });

  it('only builds URLs of files that ship in the package', () => {
    const root = new URL('../', import.meta.url);
    const { files } = JSON.parse(readFileSync(new URL('package.json', root), 'utf8')) as {
      files: string[];
    };
    expect(files).toEqual(expect.arrayContaining(['svg', 'png']));
    const missing: string[] = [];
    for (const shape of SHAPES) {
      const variants = [
        { format: 'svg' as const },
        { format: 'png' as const, scale: 1 as const },
        ...(shape === 'pennant' ? [{ format: 'png' as const, scale: 2 as const }] : []),
      ];
      for (const code of codes) {
        for (const variant of variants) {
          const url = pennantUrl(code, { base: '', shape, ...variant });
          if (!existsSync(new URL(url.slice(1), root))) missing.push(url);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('rejects PNG densities that are not shipped', () => {
    expect(() => pennantUrl('ar', { shape: 'rect', format: 'png', scale: 2 })).toThrow(RangeError);
    expect(() => pennantUrl('ar', { format: 'png', scale: 3 as 2 })).toThrow(RangeError);
    expect(pennantUrl('ar', { shape: 'rect', scale: 2 })).toMatch(/svg\/rect\/ar\.svg$/); // svg ignores scale
  });

  it('validates the code and shape', () => {
    expect(() => pennantUrl('../../etc')).toThrow(RangeError);
    expect(() => pennantUrl('ar', { shape: '../x' as 'rect' })).toThrow(RangeError);
    expect(() => pennantUrl('ar', { format: 'gif' as 'png' })).toThrow(RangeError);
  });
});

describe('toEmoji', () => {
  it('maps alpha-2 codes to regional indicators', () => {
    expect(toEmoji('ar')).toBe('🇦🇷');
  });

  it('supports the EU and UN emoji', () => {
    expect(toEmoji('EU')).toBe('🇪🇺');
    expect(toEmoji('un')).toBe('🇺🇳');
  });

  it.each(['gb-eng', 'xx', 'asean'])('returns empty string for %s', (code) => {
    expect(toEmoji(code)).toBe('');
  });
});
