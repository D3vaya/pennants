import { describe, expect, it } from 'vitest';
import ar from '../src/generated/flags/ar.ts';
import gbEng from '../src/generated/flags/gb-eng.ts';
import us from '../src/generated/flags/us.ts';
import { prepareSvg, svgCode, scopedIdPrefix } from '../src/internal/svg.ts';

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

describe('scopedIdPrefix', () => {
  it.each([
    [':r1:', 'ar', 'pnr1-ar-'],
    ['«r1»', 'ar', 'pnr1-ar-'],
    ['_R_abc_', 'gb-eng', 'pn_R_abc_-gb-eng-'],
    ['a-b "c', 'us', 'pnabc-us-'],
  ])('scopes %j + %j to %j', (scope, code, prefix) =>
    expect(scopedIdPrefix(scope, code)).toBe(prefix),
  );

  it('keeps the code, so equal scopes of different flags never collide', () => {
    expect(scopedIdPrefix(':r0:', 'ar')).not.toBe(scopedIdPrefix(':r0:', 'us'));
    // Dashes are stripped from the scope, so the first "-" always ends it.
    expect(scopedIdPrefix('a-gb', 'eng')).not.toBe(scopedIdPrefix('a', 'gb-eng'));
  });
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
    const out = prepareSvg(ar, ':r7:');
    expect(out).not.toContain('pn-ar-');
    expect(ids(out)).toEqual(ids(ar).map((id) => id.replace('pn-ar-', 'pnr7-ar-')));
    expect(out).toContain('clip-path="url(#pnr7-ar-clip)"');
    expect(out).toContain('href="#pnr7-ar-a"');
    expect(out).toContain('url(#pnr7-ar-bar)');
  });

  it('handles multi-part codes', () => {
    const out = prepareSvg(gbEng, 'x');
    expect(out).not.toContain('pn-gb-eng-');
    expect(out).toContain('id="pnx-gb-eng-clip"');
  });

  it('gives distinct scopes disjoint id sets', () => {
    const a = new Set(ids(prepareSvg(ar, ':r1:')));
    const b = ids(prepareSvg(ar, ':r2:'));
    expect(b.some((id) => a.has(id))).toBe(false);
  });

  it('gives different flags with the same scope disjoint id sets', () => {
    const a = new Set(ids(prepareSvg(ar, ':r0:')));
    const b = ids(prepareSvg(us, ':r0:'));
    expect(b.length).toBeGreaterThan(0);
    expect(b.some((id) => a.has(id))).toBe(false);
  });

  it('ignores the prefix for foreign markup', () => {
    expect(prepareSvg('<svg><g id="a"/></svg>', 'p-')).toContain('id="a"');
  });
});
