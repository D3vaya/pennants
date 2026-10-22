import { describe, expect, it } from 'vitest';
import {
  BAR_CLASS,
  BORDER_WIDTH,
  CORNER_RADIUS,
  PENNANT,
  circlePath,
  composeFlag,
  defaultIdPrefix,
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

  it('scales the border: 3px on the pennant, 2px on the smaller shapes', () => {
    expect(BORDER_WIDTH).toEqual({ pennant: 3, rect: 2, square: 2, circle: 2 });
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
    const { barHeight: bar, width: w, height: h, shoulderY: s } = PENNANT;
    expect(PENNANT_PATH).toBe(`M0 ${bar}H${w}V${s}L${w / 2} ${h}L0 ${s}Z`);
  });

  it('literal shape paths match SHAPE_SIZE and CORNER_RADIUS', () => {
    for (const shape of ['rect', 'square'] as const) {
      const { width, height } = SHAPE_SIZE[shape];
      expect(SHAPE_PATH[shape]).toBe(roundedRectPath(width, height, CORNER_RADIUS));
    }
    expect(SHAPE_PATH.circle).toBe(circlePath(SHAPE_SIZE.circle.width));
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
  it.each(SHAPES)('%s: sized canvas, clipped art, 30%% inner border', (shape) => {
    const { width, height } = SHAPE_SIZE[shape];
    const svg = composeFlag(art, shape);
    expect(svg).toMatch(
      new RegExp(
        `^<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
      ),
    );
    const prefix = defaultIdPrefix('ar', shape);
    expect(svg).toContain(
      `<clipPath id="${prefix}clip"><path d="${SHAPE_PATH[shape]}"/></clipPath>`,
    );
    expect(svg).toContain(
      `<path d="${SHAPE_PATH[shape]}" fill="none" stroke="#000" stroke-opacity="0.3" stroke-width="${BORDER_WIDTH[shape] * 2}"/>`,
    );
    expect(svg).toContain(`preserveAspectRatio="xMidYMid slice"><path id="${prefix}a"`);
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

  it('namespaces ids per shape so one flag in two shapes never clashes', () => {
    expect(SHAPES.map((shape) => defaultIdPrefix('ar', shape))).toEqual([
      'pn-ar-',
      'pn-ar-rect-',
      'pn-ar-square-',
      'pn-ar-circle-',
    ]);
    expect(defaultIdPrefix('gb-eng')).toBe('pn-gb-eng-');
    const ids = SHAPES.flatMap((shape) =>
      [...composeFlag(art, shape).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]),
    );
    expect(new Set(ids).size).toBe(ids.length);
    const circle = composeFlag(art, 'circle');
    expect(circle).toContain('clip-path="url(#pn-ar-circle-clip)"');
    expect(circle).toContain('href="#pn-ar-circle-a"');
    expect(circle).not.toMatch(/pn-ar-(?!circle-)/);
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
