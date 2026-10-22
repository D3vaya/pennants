/**
 * Builds every pennant asset from the `flag-icons` source artwork.
 *
 *   svg/<code>.svg              standalone SVG files
 *   src/generated/flags/*.ts    one ES module per flag
 *   src/generated/codes.ts      code list + PennantCode type
 *   src/generated/names.ts      English names
 *   src/generated/loaders.ts    lazy import map
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { loadFlagArtwork, readFlagSources } from './lib/flags.ts';
import { buildPennant } from './lib/pennant.ts';
import { codesModule, flagModule, loadersModule, namesModule } from './lib/modules.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = {
  svg: join(root, 'svg'),
  generated: join(root, 'src', 'generated'),
  flags: join(root, 'src', 'generated', 'flags'),
};

async function main(): Promise<void> {
  const started = performance.now();
  await Promise.all(Object.values(out).map((dir) => rm(dir, { recursive: true, force: true })));
  await Promise.all(Object.values(out).map((dir) => mkdir(dir, { recursive: true })));

  const sources = await readFlagSources();
  const pennants = await Promise.all(
    sources.map(async ({ code }) => ({ code, svg: buildPennant(await loadFlagArtwork(code)) })),
  );

  await Promise.all(
    pennants.flatMap(({ code, svg }) => [
      writeFile(join(out.svg, `${code}.svg`), svg),
      writeFile(join(out.flags, `${code}.ts`), flagModule(svg)),
    ]),
  );
  await Promise.all([
    writeFile(join(out.generated, 'codes.ts'), codesModule(sources)),
    writeFile(join(out.generated, 'names.ts'), namesModule(sources)),
    writeFile(join(out.generated, 'loaders.ts'), loadersModule(sources)),
  ]);

  const ms = Math.round(performance.now() - started);
  console.info(`Generated ${pennants.length} pennants in ${ms} ms`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
