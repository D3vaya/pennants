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

  it('namesModule escapes names', () => {
    expect(namesModule(sources)).toContain('"gb-eng": "England\'s \\"flag\\"",');
  });

  it('loadersModule creates one dynamic import per flag', () => {
    const src = loadersModule(sources);
    expect(src).toContain('"ar": () => import("./flags/ar.ts"),');
    expect(src).toContain('"gb-eng": () => import("./flags/gb-eng.ts"),');
  });
});
