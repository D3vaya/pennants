import { describe, expect, it, vi } from 'vitest';

// The docs theme reads the page language through VitePress; only `snippets` is tested here.
vi.mock('vitepress', () => ({ useData: () => ({}), withBase: (path: string) => path }));

const { snippets } = await import('../docs/.vitepress/theme/shared.ts');
const { SHAPES } = await import('../src/shapes.ts');

describe('docs snippets', () => {
  it.each(SHAPES.flatMap((shape) => (['en', 'es'] as const).map((lang) => [shape, lang] as const)))(
    'renders every format for %s (%s)',
    (shape, lang) => {
      const all = snippets('cl', lang, shape);
      expect(all.map((s) => s.id)).toContain('png');
      for (const { code } of all) expect(code).not.toMatch(/undefined|pennants\/sprite/);
    },
  );

  it('points non-pennant PNGs and sprites at the release assets', () => {
    const byId = Object.fromEntries(snippets('cl', 'en', 'circle').map((s) => [s.id, s.code]));
    expect(byId.png).toContain('png/circle/1x/cl.png from pennants-assets-vX.Y.Z.zip');
    expect(byId.sprite).toContain('sprite/circle.svg from pennants-assets-vX.Y.Z.zip');
  });
});
