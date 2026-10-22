import { describe, expect, it } from 'vitest';
import { buildPennant } from '../scripts/lib/pennant.ts';
import { buildSprite, collectIds, spriteSymbol } from '../scripts/lib/sprite.ts';

const pennant = (code: string, content = '<path d="M0 0h8v8H0z"/>') => ({
  code,
  svg: buildPennant({ code, viewBox: '0 0 8 8', content }),
});

describe('spriteSymbol', () => {
  it('turns a pennant into a <symbol> with its viewBox', () => {
    const symbol = spriteSymbol(pennant('ar'));
    expect(symbol).toMatch(/^<symbol id="pn-ar" viewBox="0 0 66 72"><defs>/);
    expect(symbol).toMatch(/<\/g><rect [^>]*\/><\/symbol>$/);
    expect(symbol).not.toContain('xmlns');
  });

  it('refuses unsafe codes', () => {
    expect(() => spriteSymbol({ code: 'a"', svg: pennant('ar').svg })).toThrow('Invalid flag code');
  });
});

describe('collectIds', () => {
  it('lists id attributes in order', () => {
    expect(collectIds('<a id="x"><b data-id="no" id="y"/></a>')).toEqual(['x', 'y']);
  });
});

describe('buildSprite', () => {
  it('wraps all symbols in one svg document', () => {
    const sprite = buildSprite([pennant('ar'), pennant('gb-eng')]);
    expect(sprite).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"><symbol id="pn-ar"/);
    expect(sprite).toContain('<symbol id="pn-gb-eng" viewBox="0 0 66 72">');
    expect(sprite.endsWith('</svg>\n')).toBe(true);
    const ids = collectIds(sprite);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('rejects colliding ids', () => {
    const clash = pennant('gb', '<path id="pn-gb-eng" d="M0 0"/>');
    expect(() => buildSprite([clash, pennant('gb-eng')])).toThrow('Duplicate id "pn-gb-eng"');
  });
});
