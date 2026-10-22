// Runs in the default Node environment: no DOM globals.
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ar from '../src/generated/flags/ar.ts';
import { Pennant, PennantSvg } from '../src/react/index.tsx';

describe('React SSR', () => {
  it('renders the inline pennant as a reserved, labelled box', () => {
    expect(typeof document).toBe('undefined');
    expect(renderToString(<Pennant code="ar" size={32} />)).toBe(
      '<span role="img" aria-label="Argentina" data-pennant="ar" style="display:inline-block;width:29.333px;height:32px"></span>',
    );
  });

  it('renders img mode and PennantSvg markup', () => {
    expect(renderToString(<Pennant code="ar" mode="img" />)).toContain(
      'src="https://cdn.jsdelivr.net/npm/pennants/svg/ar.svg"',
    );
    const html = renderToString(<PennantSvg svg={ar} />);
    expect(html).toContain('<clipPath id="pn');
    expect(html).not.toContain('pn-ar-');
  });
});
