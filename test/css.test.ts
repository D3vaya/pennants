import { describe, expect, it } from 'vitest';
import {
  baseRule,
  cdnSvgPath,
  cssDeclaration,
  flagRule,
  minifyCss,
  pennantsCss,
  sizeRules,
  SHAPE_CLASS,
  themeCss,
  SIZES,
} from '../scripts/lib/css.ts';
import { BAR_CLASS } from '../src/shapes.ts';

describe('baseRule', () => {
  it('is 1em tall and keeps the 66:72 pennant ratio', () => {
    const css = baseRule();
    expect(css).toMatch(/^\.pn \{/);
    expect(css).toContain('height: 1em;');
    expect(css).toContain('width: calc(66/72*1em);');
    expect(css).toContain('display: inline-block;');
    expect(css).toContain('vertical-align: middle;');
    expect(css).toContain('position: relative;');
  });

  it('centres the image without repeating or cropping it', () => {
    const css = baseRule();
    expect(css).toContain('background-size: contain;');
    expect(css).toContain('background-position: center;');
    expect(css).toContain('background-repeat: no-repeat;');
  });
});

describe('sizeRules', () => {
  it('emits one font-size helper per size', () => {
    const css = sizeRules();
    expect(css).toContain('.pn-lg {\n  font-size: 1.3333em;\n}');
    expect(css).toContain('.pn-4x {\n  font-size: 4em;\n}');
    expect(css.match(/\{/g)).toHaveLength(Object.keys(SIZES).length);
  });
});

describe('flagRule', () => {
  it('points at the flag SVG', () => {
    expect(flagRule('gb-eng')).toBe(
      '.pn.pn-gb-eng {\n  background-image: url(../svg/pennant/gb-eng.svg);\n}\n',
    );
  });

  it('accepts a custom svg path', () => {
    expect(flagRule('ar', 'https://cdn.example/svg')).toContain(
      'url(https://cdn.example/svg/ar.svg)',
    );
  });

  it('refuses unsafe codes', () => {
    expect(() => flagRule('ar){}')).toThrow('Invalid flag code');
  });
});

describe('pennantsCss', () => {
  const css = pennantsCss(['ar', 'us']);

  it('starts with a preserved licence banner and the base rule', () => {
    expect(css).toMatch(/^\/\*! pennants[^\n]*\*\/\n\.pn \{/);
  });

  it('contains size helpers and one rule per code, in order', () => {
    expect(css).toContain('.pn-2x {');
    expect(css.indexOf('.pn.pn-ar {')).toBeLessThan(css.indexOf('.pn.pn-us {'));
  });

  it('forwards svgPath', () => {
    expect(pennantsCss(['ar'], { svgPath: '/flags' })).toContain('url(/flags/ar.svg)');
  });
});

describe('minifyCss', () => {
  it('removes whitespace and trailing semicolons', () => {
    expect(minifyCss('.a {\n  color: red;\n  margin: 0 auto;\n}\n\n.b, .c {\n  top: 0;\n}\n')).toBe(
      '.a{color:red;margin:0 auto}.b,.c{top:0}\n',
    );
  });

  it('drops regular comments but keeps /*! banners on their own line', () => {
    expect(minifyCss('/*! keep */\n/* drop */\n.a { top: 0; }')).toBe('/*! keep */\n.a{top:0}\n');
  });

  it('keeps spaces that calc() operators need', () => {
    expect(minifyCss('.a { width: calc(1em + 2px); }')).toBe('.a{width:calc(1em + 2px)}\n');
  });

  it('minifies the real stylesheet losslessly', () => {
    const min = minifyCss(pennantsCss(['ar']));
    expect(min).toContain(
      '.pn{display:inline-block;position:relative;width:calc(66/72*1em);height:1em;',
    );
    expect(min).toContain('.pn.pn-ar{background-image:url(../svg/pennant/ar.svg)}');
    expect(min.split('\n')).toHaveLength(3);
  });
});

describe('cdnSvgPath', () => {
  it('pins the jsDelivr URL to the package version', () => {
    expect(cdnSvgPath('0.1.0')).toBe('https://cdn.jsdelivr.net/npm/pennants@0.1.0/svg/pennant');
    expect(cdnSvgPath('1.2.3-beta.1')).toBe(
      'https://cdn.jsdelivr.net/npm/pennants@1.2.3-beta.1/svg/pennant',
    );
  });

  it.each(['', 'latest', '1.2', '1.2.3)', '../1.2.3'])('rejects %j', (version) => {
    expect(() => cdnSvgPath(version)).toThrow('Invalid package version');
  });

  it('produces absolute flag URLs in the CDN stylesheet', () => {
    const min = minifyCss(pennantsCss(['ar'], { svgPath: cdnSvgPath('0.1.0') }));
    expect(min).toContain(
      '.pn.pn-ar{background-image:url(https://cdn.jsdelivr.net/npm/pennants@0.1.0/svg/pennant/ar.svg)}',
    );
  });
});

describe('cssDeclaration', () => {
  it('is an empty ES module', () => {
    expect(cssDeclaration()).toMatch(/^\/\/[^\n]*\nexport \{\};\n$/);
  });
});

describe('themeCss', () => {
  it('maps the bar stop classes to custom properties with gold fallbacks', () => {
    expect(minifyCss(themeCss())).toBe(
      '.pn-bar-l{stop-color:var(--pennant-bar-light,#d5b97a)}' +
        '.pn-bar-d{stop-color:var(--pennant-bar-dark,#8e713f)}\n',
    );
  });

  it('is part of the full stylesheet', () => {
    expect(pennantsCss([])).toContain(themeCss());
  });
});

describe('per-shape stylesheets', () => {
  it('sizes .pn by the shape aspect ratio', () => {
    expect(baseRule('rect')).toContain('width: calc(64/48*1em);');
    expect(baseRule('square')).toContain('width: 1em;');
    expect(baseRule('circle')).toContain('width: 1em;');
  });

  it('points at the shape folder and keeps theming for the pennant only', () => {
    const circle = pennantsCss(['ar'], { shape: 'circle' });
    expect(circle).toContain('url(../svg/circle/ar.svg)');
    expect(circle).not.toContain('pn-bar-l');
    expect(pennantsCss(['ar'])).toContain('pn-bar-l');
  });

  it('builds CDN URLs per shape', () => {
    expect(cdnSvgPath('0.1.0', 'circle')).toBe(
      'https://cdn.jsdelivr.net/npm/pennants@0.1.0/svg/circle',
    );
  });
});

describe('composable shape stylesheets', () => {
  it('gives every shape its own base class', () => {
    expect(SHAPE_CLASS).toEqual({
      pennant: 'pn',
      rect: 'pn-rect',
      square: 'pn-square',
      circle: 'pn-circle',
    });
    expect(baseRule('circle')).toMatch(/^\.pn-circle \{/);
  });

  it('scopes flag rules to the base so stylesheets can be mixed', () => {
    expect(minifyCss(pennantsCss(['ar'], { shape: 'circle' }))).toContain(
      '.pn-circle.pn-ar{background-image:url(../svg/circle/ar.svg)}',
    );
    const all = (['pennant', 'rect', 'square', 'circle'] as const)
      .map((shape) => minifyCss(pennantsCss(['ar'], { shape })))
      .join('');
    const selectors = all.match(/\.[\w-]+\.pn-ar\{/g);
    expect(selectors).toEqual([
      '.pn.pn-ar{',
      '.pn-rect.pn-ar{',
      '.pn-square.pn-ar{',
      '.pn-circle.pn-ar{',
    ]);
  });

  it('never collides with a flag code', async () => {
    const { codes } = await import('../src/generated/codes.ts');
    const reserved = [
      ...Object.values(SHAPE_CLASS).map((c) => c.replace(/^pn-?/, '')),
      ...Object.keys(SIZES),
      ...Object.values(BAR_CLASS).map((c) => c.slice(3)),
    ];
    expect(reserved.filter((name) => (codes as readonly string[]).includes(name))).toEqual([]);
  });
});
