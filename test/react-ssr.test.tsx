// Runs in the default Node environment: no DOM globals.
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ar from '../src/generated/art/1x1/ar.ts';
import ar43 from '../src/generated/art/4x3/ar.ts';
import { SHAPES } from '../src/shapes.ts';
import us from '../src/generated/art/1x1/us.ts';
import { pennantUrl } from '../src/index.ts';
import { Pennant, PennantSvg } from '../src/react/index.ts';

describe('React SSR', () => {
  it('renders the inline pennant as a reserved, labelled box', () => {
    expect(typeof document).toBe('undefined');
    expect(renderToString(<Pennant code="ar" size={32} />)).toBe(
      '<span role="img" aria-label="Argentina" data-pennant="ar" data-shape="pennant"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 66 72" width="29.333" height="32" aria-hidden="true" focusable="false"></svg></span>',
    );
  });

  it('renders img mode and PennantSvg markup', () => {
    expect(renderToString(<Pennant code="ar" mode="img" />)).toContain(`src="${pennantUrl('ar')}"`);
    const html = renderToString(<PennantSvg art={ar} />);
    expect(html).toContain('<clipPath id="pn');
    expect(html).not.toContain('pn-ar-');
  });

  it('keeps ids distinct across separate roots (islands) with the same useId sequence', () => {
    const rootA = renderToString(<PennantSvg art={ar} />);
    const rootB = renderToString(<PennantSvg art={us} />);
    const idsOf = (html: string): string[] =>
      [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1] ?? '');
    const a = new Set(idsOf(rootA));
    const b = idsOf(rootB);
    expect(a.size).toBeGreaterThan(0);
    expect(b.some((id) => a.has(id))).toBe(false);
    // Every reference in root B points at an id root B defines itself.
    const refs = [...rootB.matchAll(/(?:url\(#|href="#)([^)"]+)/g)].map((m) => m[1] ?? '');
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) expect(b).toContain(ref);
  });

  it('emits no style attribute (CSP style-src without unsafe-inline)', () => {
    for (const shape of SHAPES) {
      for (const size of [undefined, 24, '2rem', 'calc(1em + 2px)', '50%']) {
        const art = shape === 'rect' ? ar43 : ar;
        const sized = size === undefined ? {} : { size };
        const html =
          renderToString(<PennantSvg art={art} shape={shape} {...sized} />) +
          renderToString(<Pennant code="ar" shape={shape} {...sized} />) +
          renderToString(<Pennant code="ar" shape={shape} {...sized} mode="fetch" />);
        expect(html).not.toContain('style=');
      }
      expect(
        renderToString(<Pennant code="ar" shape={shape} mode="img" size={24} />),
      ).not.toContain('style=');
    }
  });

  it('sizes the svg with presentation attributes', () => {
    const svgTag = (html: string): string => /<svg [^>]*>/.exec(html)?.[0] ?? '';
    expect(svgTag(renderToString(<PennantSvg art={ar} />))).toContain(
      'width="0.917em" height="1em"',
    );
    expect(svgTag(renderToString(<PennantSvg art={ar43} shape="rect" size="1.5rem" />))).toContain(
      'width="2rem" height="1.5rem"',
    );
    const calc = svgTag(renderToString(<PennantSvg art={ar} size="calc(1em + 2px)" />));
    expect(calc).toContain('height="calc(1em + 2px)"');
    expect(calc).not.toContain('width=');
    expect(svgTag(renderToString(<PennantSvg art={ar} shape="circle" size="50%" />))).not.toContain(
      'width=',
    );
  });

  it('keeps ids distinct for the same flag in different shapes across roots', () => {
    const idsOf = (html: string): string[] =>
      [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1] ?? '');
    const roots = SHAPES.map((shape) =>
      renderToString(<PennantSvg art={shape === 'rect' ? ar43 : ar} shape={shape} />),
    );
    const all = roots.flatMap(idsOf);
    expect(all.length).toBeGreaterThan(SHAPES.length);
    expect(new Set(all).size).toBe(all.length);
    for (const html of roots) {
      const own = idsOf(html);
      for (const [, ref] of html.matchAll(/(?:url\(#|href="#)([^)"]+)/g))
        expect(own).toContain(ref);
    }
  });
});
