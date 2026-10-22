import { describe, expect, it } from 'vitest';
import {
  BODY_PATH,
  PENNANT,
  assertValidCode,
  buildPennant,
  unwrapSvg,
} from '../scripts/lib/pennant.ts';

describe('unwrapSvg', () => {
  it('splits viewBox and inner markup', () => {
    expect(
      unwrapSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><path d="M0 0"/></svg>'),
    ).toEqual({
      viewBox: '0 0 8 8',
      content: '<path d="M0 0"/>',
    });
  });

  it('tolerates an XML prolog and surrounding whitespace', () => {
    const svg = '<?xml version="1.0"?>\n<svg viewBox="0 0 1 1">\n<g/>\n</svg>\n';
    expect(unwrapSvg(svg)).toEqual({ viewBox: '0 0 1 1', content: '<g/>' });
  });

  it('rejects documents without viewBox', () => {
    expect(() => unwrapSvg('<svg width="1"></svg>')).toThrow('no viewBox');
  });

  it('rejects non-svg input', () => {
    expect(() => unwrapSvg('<div></div>')).toThrow('not a single <svg>');
  });
});

describe('assertValidCode', () => {
  it.each(['ar', 'gb-eng', 'es-ct', 'asean', 'un'])('accepts %s', (code) => {
    expect(() => assertValidCode(code)).not.toThrow();
  });

  it.each(['', 'A', 'AR', 'a"r', 'ar/../x', 'ar-'])('rejects %j', (code) => {
    expect(() => assertValidCode(code)).toThrow('Invalid flag code');
  });
});

describe('buildPennant', () => {
  const svg = buildPennant({
    code: 'ar',
    viewBox: '0 0 512 512',
    content: '<path d="M0 0h512v512H0z"/>',
  });

  it('uses the reference 66x72 canvas', () => {
    expect(svg).toMatch(
      /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 66 72" width="66" height="72">/,
    );
    expect(svg.endsWith('</svg>')).toBe(true);
  });

  it('describes the body as a rectangle ending in a centred point', () => {
    expect(BODY_PATH).toBe('M0 9H66V50L33 72L0 50Z');
  });

  it('namespaces ids with the flag code', () => {
    expect(svg).toContain('id="pn-ar-clip"');
    expect(svg).toContain('clip-path="url(#pn-ar-clip)"');
    expect(svg).toContain('id="pn-ar-bar"');
    expect(svg).toContain('fill="url(#pn-ar-bar)"');
  });

  it('fills the body with the flag in cover mode', () => {
    expect(svg).toContain(
      `<svg x="0" y="${PENNANT.barHeight}" width="66" height="63" viewBox="0 0 512 512" preserveAspectRatio="xMidYMid slice"><path d="M0 0h512v512H0z"/></svg>`,
    );
  });

  it('draws a 3px darkening inner border', () => {
    expect(svg).toContain('stroke="#000" stroke-opacity="0.3" stroke-width="6"');
  });

  it('colours the bar with CSP-safe attributes and themable classes', () => {
    expect(svg).toContain('<stop offset="0" class="pn-bar-l" stop-color="#d5b97a"/>');
    expect(svg).toContain('<stop offset="1" class="pn-bar-d" stop-color="#8e713f"/>');
    expect(svg).not.toContain('style=');
  });

  it('refuses unsafe codes before interpolating them', () => {
    expect(() => buildPennant({ code: '"><script>', viewBox: '0 0 1 1', content: '' })).toThrow();
  });
});
