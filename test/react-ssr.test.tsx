// Runs in the default Node environment: no DOM globals.
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ar from '../src/generated/flags/ar.ts';
import us from '../src/generated/flags/us.ts';
import { pennantUrl } from '../src/index.ts';
import { Pennant, PennantSvg } from '../src/react/index.tsx';

describe('React SSR', () => {
  it('renders the inline pennant as a reserved, labelled box', () => {
    expect(typeof document).toBe('undefined');
    expect(renderToString(<Pennant code="ar" size={32} />)).toBe(
      '<span role="img" aria-label="Argentina" data-pennant="ar" style="display:inline-block;width:29.333px;height:32px"></span>',
    );
  });

  it('renders img mode and PennantSvg markup', () => {
    expect(renderToString(<Pennant code="ar" mode="img" />)).toContain(`src="${pennantUrl('ar')}"`);
    const html = renderToString(<PennantSvg svg={ar} />);
    expect(html).toContain('<clipPath id="pn');
    expect(html).not.toContain('pn-ar-');
  });

  it('keeps ids distinct across separate roots (islands) with the same useId sequence', () => {
    const rootA = renderToString(<PennantSvg svg={ar} />);
    const rootB = renderToString(<PennantSvg svg={us} />);
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
});
