// Regression tests for CodeQL js/polynomial-redos: inputs that used to make a
// regular expression backtrack quadratically must stay fast and correct.
import { describe, expect, it } from 'vitest';
import { pennantUrl } from '../src/index.ts';
import { svgSize } from '../src/react/shared.ts';

const fast = (fn: () => unknown): void => {
  const start = performance.now();
  fn();
  expect(performance.now() - start).toBeLessThan(100);
};

describe('pennantUrl base', () => {
  it('trims every trailing slash', () => {
    expect(pennantUrl('ar', { base: '/assets///' })).toBe('/assets/svg/pennant/ar.svg');
    expect(pennantUrl('ar', { base: '///' })).toBe('/svg/pennant/ar.svg');
  });

  it('stays linear on many slashes', () => {
    fast(() => pennantUrl('ar', { base: `${'/'.repeat(50_000)}x` }));
  });
});

describe('svgSize', () => {
  it('derives the width of simple CSS lengths', () => {
    expect(svgSize('2rem', 'square')).toEqual({ width: '2rem', height: '2rem' });
    expect(svgSize('.5em', 'square')).toEqual({ width: '0.5em', height: '.5em' });
    expect(svgSize('1.5em', 'rect').height).toBe('1.5em');
    expect(svgSize('calc(1em + 2px)', 'square')).toEqual({ height: 'calc(1em + 2px)' });
    expect(svgSize('1.', 'square')).toEqual({ height: '1.' });
  });

  it('stays linear on many digits', () => {
    fast(() => svgSize(`${'9'.repeat(50_000)}!`, 'pennant'));
  });
});
