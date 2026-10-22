import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  flagIconsRoot,
  loadFlagArtwork,
  optimizeFlag,
  readFlagSources,
} from '../scripts/lib/flags.ts';

describe('readFlagSources', () => {
  it('reads and sorts the flag-icons catalogue', async () => {
    const sources = await readFlagSources();
    expect(sources.length).toBeGreaterThanOrEqual(249);
    expect(sources.filter((s) => s.iso)).toHaveLength(249);
    expect(sources.map((s) => s.code)).toEqual([...sources.map((s) => s.code)].sort());
    expect(sources).toContainEqual({ code: 'ar', name: 'Argentina', iso: true });
  });

  it('lowercases codes from a custom root', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pennants-'));
    await writeFile(
      join(root, 'country.json'),
      JSON.stringify([{ code: 'ZZ', name: 'Z', iso: false }]),
    );
    expect(await readFlagSources(root)).toEqual([{ code: 'zz', name: 'Z', iso: false }]);
  });
});

describe('optimizeFlag', () => {
  it('prefixes ids and converts xlink references', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 10 10" width="10">' +
      '<defs><path id="a" d="M0 0h5v5H0z"/></defs><use xlink:href="#a"/><use xlink:href="#a" x="5"/></svg>';
    const art = optimizeFlag('xx', svg);
    expect(art.viewBox).toBe('0 0 10 10');
    expect(art.content).not.toContain('xlink');
    expect(art.content).toContain('pn-xx-');
    expect(art.content).not.toMatch(/id="a"/);
  });

  it('rounds coordinates to integers to keep detailed flags small', () => {
    const art = optimizeFlag(
      'xx',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M1.26 2.74L7.51 8.49"/></svg>',
    );
    expect(art.content).toBe('<path d="m1 3 7 5"/>');
  });

  it('rejects invalid codes', () => {
    expect(() => optimizeFlag('../ar', '<svg viewBox="0 0 1 1"/>')).toThrow();
  });
});

describe('loadFlagArtwork', () => {
  it('loads the square artwork of a real flag', async () => {
    const art = await loadFlagArtwork('ar');
    expect(art).toMatchObject({ code: 'ar', viewBox: '0 0 512 512' });
    expect(art.content.length).toBeGreaterThan(100);
  });

  it('loads from a custom root', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pennants-'));
    await mkdir(join(root, 'flags', '1x1'), { recursive: true });
    await writeFile(
      join(root, 'flags', '1x1', 'zz.svg'),
      '<svg viewBox="0 0 2 2"><path d="M0 0h2v2H0z"/></svg>',
    );
    expect((await loadFlagArtwork('zz', root)).viewBox).toBe('0 0 2 2');
  });

  it('resolves the flag-icons package', () => {
    expect(flagIconsRoot()).toMatch(/flag-icons$/);
  });
});
