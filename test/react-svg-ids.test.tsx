import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { prepareSvg, svgCode, toIdPrefix } from '../src/internal/svg.ts';

const ar = readFileSync(new URL('../svg/ar.svg', import.meta.url), 'utf8');
const gbEng = readFileSync(new URL('../svg/gb-eng.svg', import.meta.url), 'utf8');

const ids = (svg: string): string[] => [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1] ?? '');

describe('svgCode', () => {
  it('detects the pn-<code>- namespace, including multi-part codes', () => {
    expect(svgCode(ar)).toBe('ar');
    expect(svgCode(gbEng)).toBe('gb-eng');
  });

  it('returns undefined for foreign markup', () => {
    expect(svgCode('<svg><path id="x"/></svg>')).toBeUndefined();
  });
});

describe('toIdPrefix', () => {
  it.each([
    [':r1:', 'pnr1-'],
    ['«r1»', 'pnr1-'],
    ['_R_abc_', 'pn_R_abc_-'],
    ['a b"c', 'pnabc-'],
  ])('sanitises %j to %j', (token, prefix) => expect(toIdPrefix(token)).toBe(prefix));
});

describe('prepareSvg', () => {
  it('makes the root svg fluid and hidden from assistive tech', () => {
    const out = prepareSvg(ar);
    expect(out).toMatch(
      /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 66 72" width="100%" height="100%" aria-hidden="true" focusable="false">/,
    );
    // Nested svg keeps its own geometry.
    expect(out).toContain('<svg x="0" y="9" width="66" height="63"');
    expect(out.match(/aria-hidden/g)).toHaveLength(1);
  });

  it('replaces pre-existing a11y/size attributes instead of duplicating them', () => {
    const out = prepareSvg(
      '  <svg width="1" aria-hidden="false" focusable="true" height="2" class="x"></svg>',
    );
    expect(out).toBe(
      '  <svg class="x" width="100%" height="100%" aria-hidden="true" focusable="false"></svg>',
    );
  });

  it('leaves ids untouched without a prefix', () => {
    expect(ids(prepareSvg(ar))).toEqual(ids(ar));
  });

  it('rewrites every id and reference of the namespace', () => {
    const out = prepareSvg(ar, 'pnr7-');
    expect(out).not.toContain('pn-ar-');
    expect(ids(out)).toEqual(ids(ar).map((id) => id.replace('pn-ar-', 'pnr7-')));
    expect(out).toContain('clip-path="url(#pnr7-clip)"');
    expect(out).toContain('href="#pnr7-a"');
    expect(out).toContain('url(#pnr7-bar)');
  });

  it('handles multi-part codes', () => {
    const out = prepareSvg(gbEng, 'pnx-');
    expect(out).not.toContain('pn-gb-eng-');
    expect(out).toContain('id="pnx-clip"');
  });

  it('gives distinct prefixes disjoint id sets', () => {
    const a = new Set(ids(prepareSvg(ar, toIdPrefix(':r1:'))));
    const b = ids(prepareSvg(ar, toIdPrefix(':r2:')));
    expect(b.some((id) => a.has(id))).toBe(false);
  });

  it('ignores the prefix for foreign markup', () => {
    expect(prepareSvg('<svg><g id="a"/></svg>', 'p-')).toContain('id="a"');
  });
});
