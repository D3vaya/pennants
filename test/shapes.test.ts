import { describe, expect, it } from 'vitest';
import {
  BAR_CLASS,
  circlePath,
  composeFlag,
  isShape,
  PENNANT_PATH,
  roundedRectPath,
  SHAPE_ART,
  SHAPE_PATH,
  SHAPE_SIZE,
  SHAPES,
  type FlagArt,
} from '../src/shapes.ts';

const art: FlagArt = {
  code: 'ar',
  viewBox: '0 0 8 8',
  content: '<path id="pn-ar-a" d="M0 0h8v8H0z"/><use href="#pn-ar-a"/>',
};

describe('shape tables', () => {
  it('lists pennant first (the default) and covers every shape', () => {
    expect(SHAPES).toEqual(['pennant', 'rect', 'square', 'circle']);
    for (const shape of SHAPES) {
      expect(SHAPE_SIZE[shape]).toBeDefined();
      expect(SHAPE_ART[shape]).toMatch(/^(1x1|4x3)$/);
      expect(SHAPE_PATH[shape]).toMatch(/^M.*Z$/);
    }
  });

  it('uses 4:3 art only for rect', () => {
    expect(SHAPES.filter((s) => SHAPE_ART[s] === '4x3')).toEqual(['rect']);
    expect(SHAPE_SIZE.rect.width / SHAPE_SIZE.rect.height).toBe(4 / 3);
  });

  it('isShape accepts only shape names', () => {
    expect(SHAPES.every(isShape)).toBe(true);
    expect([undefined, 'Pennant', 'oval', 1].some(isShape)).toBe(false);
  });
});

describe('paths', () => {
  it('pennant: rectangle under the bar ending in a centred point', () => {
    expect(PENNANT_PATH).toBe('M0 9H66V50L33 72L0 50Z');
  });

  it('roundedRectPath draws four corner arcs', () => {
    expect(roundedRectPath(10, 6, 2)).toBe(
      'M2 0H8A2 2 0 0 1 10 2V4A2 2 0 0 1 8 6H2A2 2 0 0 1 0 4V2A2 2 0 0 1 2 0Z',
    );
  });

  it('circlePath draws two half circles', () => {
    expect(circlePath(48)).toBe('M0 24A24 24 0 1 1 48 24A24 24 0 1 1 0 24Z');
  });
});

describe('composeFlag', () => {
  it.each(SHAPES)('%s: sized canvas, clipped art, 3px 30%% border', (shape) => {
    const { width, height } = SHAPE_SIZE[shape];
    const svg = composeFlag(art, shape);
    expect(svg).toMatch(
      new RegExp(
        `^<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
      ),
    );
    expect(svg).toContain(`<clipPath id="pn-ar-clip"><path d="${SHAPE_PATH[shape]}"/></clipPath>`);
    expect(svg).toContain(
      `<path d="${SHAPE_PATH[shape]}" fill="none" stroke="#000" stroke-opacity="0.3" stroke-width="6"/>`,
    );
    expect(svg).toContain('preserveAspectRatio="xMidYMid slice"><path id="pn-ar-a"');
    expect(svg).not.toContain('style=');
    expect(svg.endsWith('</svg>')).toBe(true);
  });

  it('defaults to the pennant with its CSP-safe themable bar', () => {
    const svg = composeFlag(art);
    expect(svg).toBe(composeFlag(art, 'pennant'));
    expect(svg).toContain('<svg x="0" y="9" width="66" height="63" viewBox="0 0 8 8"');
    expect(svg).toContain(`<stop offset="0" class="${BAR_CLASS.light}" stop-color="#d5b97a"/>`);
    expect(svg).toContain(`<stop offset="1" class="${BAR_CLASS.dark}" stop-color="#8e713f"/>`);
    expect(svg).toMatch(/<\/g><rect width="66" height="9" fill="url\(#pn-ar-bar\)"\/><\/svg>$/);
  });

  it.each(['rect', 'square', 'circle'] as const)('%s has no bar and fills the canvas', (shape) => {
    const svg = composeFlag(art, shape);
    const { width, height } = SHAPE_SIZE[shape];
    expect(svg).not.toContain('linearGradient');
    expect(svg).not.toContain('<rect');
    expect(svg).toContain(`<svg x="0" y="0" width="${width}" height="${height}"`);
  });

  it('rewrites every id and reference with a custom prefix', () => {
    const svg = composeFlag(art, 'pennant', 'pnr1-ar-');
    expect(svg).not.toContain('pn-ar-');
    expect(svg).toContain('id="pnr1-ar-clip"');
    expect(svg).toContain('url(#pnr1-ar-clip)');
    expect(svg).toContain('url(#pnr1-ar-bar)');
    expect(svg).toContain('id="pnr1-ar-a"');
    expect(svg).toContain('href="#pnr1-ar-a"');
  });

  it.each([
    [{ ...art, code: '"><x' }, 'pennant', undefined, 'Invalid flag code'],
    [art, 'oval', undefined, 'Invalid shape'],
    [art, 'circle', '1"x', 'Invalid id prefix'],
  ])('rejects unsafe input %#', (input, shape, prefix, message) => {
    expect(() => composeFlag(input, shape as 'pennant', prefix)).toThrow(message);
  });
});
