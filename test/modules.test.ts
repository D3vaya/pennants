import { describe, expect, it } from 'vitest';
import {
  artLoadersModule,
  artModule,
  codesModule,
  flagModule,
  loadersModule,
  namesModule,
} from '../scripts/lib/modules.ts';

const sources = [
  { code: 'ar', name: 'Argentina', iso: true },
  { code: 'gb-eng', name: 'England\'s "flag"', iso: false },
];

describe('generated modules', () => {
  it('flagModule exports the SVG as an escaped string', () => {
    const src = flagModule('<svg a="1">\'</svg>');
    expect(src).toContain('const svg: string = "<svg a=\\"1\\">\'</svg>";');
    expect(src).toContain('export default svg;');
  });

  it('codesModule lists all codes and only ISO ones in isoCodes', () => {
    const src = codesModule(sources);
    expect(src).toContain('export const codes = ["ar", "gb-eng"] as const;');
    expect(src).toContain('export const isoCodes: readonly PennantCode[] = ["ar"];');
  });

  it('codesModule documents its exports for TypeDoc', () => {
    const src = codesModule(sources);
    for (const decl of ['export const codes', 'export type PennantCode', 'export const isoCodes']) {
      expect(src).toMatch(new RegExp(`\\*/\\n${decl}`));
    }
  });

  it('namesModule bundles only non-ISO names, escaped', () => {
    const src = namesModule(sources);
    expect(src).toContain('"gb-eng": "England\'s \\"flag\\"",');
    expect(src).not.toContain('"ar"');
  });

  it('loadersModule creates one dynamic import per flag', () => {
    const src = loadersModule(sources);
    expect(src).toContain('"ar": () => import("./flags/ar.ts"),');
    expect(src).toContain('"gb-eng": () => import("./flags/gb-eng.ts"),');
  });
});

describe('art modules', () => {
  it('artModule exports the artwork with a self-contained type', () => {
    const src = artModule({ code: 'ar', viewBox: '0 0 4 3', content: '<path d="M0 0"/>' });
    expect(src).not.toContain('import');
    expect(src).toContain(
      'const art: { code: string; viewBox: string; content: string } = {"code":"ar","viewBox":"0 0 4 3","content":"<path d=\\"M0 0\\"/>"};',
    );
    expect(src).toContain('export default art;');
  });

  it('artLoadersModule maps each code to its art chunk of the set', () => {
    const src = artLoadersModule(sources, '4x3');
    expect(src).toContain('"ar": () => import("./art/4x3/ar.ts"),');
    expect(src).toContain('"gb-eng": () => import("./art/4x3/gb-eng.ts"),');
    expect(src).toContain('Promise<{ default: FlagArt }>');
  });
});
