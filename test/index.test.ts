import { describe, expect, it } from 'vitest';
import {
  PENNANT_ASPECT_RATIO,
  codes,
  getPennantName,
  isoCodes,
  isPennantCode,
  loadPennant,
  pennantUrl,
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

describe('loadPennant', () => {
  it('loads the SVG of a single flag lazily', async () => {
    const svg = await loadPennant('AR');
    expect(svg).toMatch(/^<svg /);
    expect(svg).toContain('pn-ar-clip');
  });

  it('rejects unknown codes', async () => {
    await expect(loadPennant('zz')).rejects.toThrow(RangeError);
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

  it('falls back when the locale is invalid', () => {
    expect(getPennantName('ar', '!!')).toBe('Argentina');
  });
});

describe('toDataUri', () => {
  it('URI-encodes the markup', () => {
    expect(toDataUri('<svg a="#"/>')).toBe('data:image/svg+xml,%3Csvg%20a%3D%22%23%22%2F%3E');
  });
});

describe('pennantUrl', () => {
  it('defaults to the jsDelivr SVG', () => {
    expect(pennantUrl('AR')).toBe('https://cdn.jsdelivr.net/npm/pennants@0.0.0-test/svg/ar.svg');
  });

  it('supports custom bases and PNG densities', () => {
    expect(pennantUrl('ar', { base: '/assets/', format: 'png', scale: 2 })).toBe(
      '/assets/png/2x/ar.png',
    );
    expect(pennantUrl('ar', { format: 'png' })).toBe(
      'https://cdn.jsdelivr.net/npm/pennants@0.0.0-test/png/1x/ar.png',
    );
  });

  it('validates the code', () => {
    expect(() => pennantUrl('../../etc')).toThrow(RangeError);
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
