import { describe, expect, it } from 'vitest';
import { codesModule, flagModule, loadersModule, namesModule } from '../scripts/lib/modules.ts';

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
