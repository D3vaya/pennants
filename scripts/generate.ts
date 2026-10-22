/**
 * Builds every pennant asset from the `flag-icons` source artwork.
 *
 *   svg/<code>.svg              standalone SVG files
 *   src/generated/flags/*.ts    one ES module per flag
 *   src/generated/codes.ts      code list + PennantCode type
 *   src/generated/names.ts      English names of non-ISO flags
 *   src/generated/loaders.ts    lazy import map
 *   css/pennants(.min).css      flag-icons-like stylesheet
 *   png/{1x,2x}/<code>.png      66x72 and 132x144 rasters
 *   sprite/pennants.svg         <symbol id="pn-<code>"> sprite
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { availableParallelism } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { loadFlagArtwork, readFlagSources } from './lib/flags.ts';
import { buildPennant } from './lib/pennant.ts';
import { codesModule, flagModule, loadersModule, namesModule } from './lib/modules.ts';
import { minifyCss, pennantsCss } from './lib/css.ts';
import { mapLimit, PNG_SCALES, renderPng } from './lib/png.ts';
import { buildSprite } from './lib/sprite.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = {
  svg: join(root, 'svg'),
  generated: join(root, 'src', 'generated'),
  flags: join(root, 'src', 'generated', 'flags'),
  css: join(root, 'css'),
  sprite: join(root, 'sprite'),
  ...Object.fromEntries(
    PNG_SCALES.map((scale) => [`png${scale}x`, join(root, 'png', `${scale}x`)]),
  ),
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

  const css = pennantsCss(pennants.map((p) => p.code));
  await Promise.all([
    writeFile(join(out.css, 'pennants.css'), css),
    writeFile(join(out.css, 'pennants.min.css'), minifyCss(css)),
    writeFile(join(out.sprite, 'pennants.svg'), buildSprite(pennants)),
  ]);

  // sharp already threads each pipeline internally; cap the pipelines in flight.
  const jobs = pennants.flatMap(({ code, svg }) =>
    PNG_SCALES.map((scale) => ({ code, svg, scale })),
  );
  await mapLimit(jobs, availableParallelism(), async ({ code, svg, scale }) =>
    writeFile(join(root, 'png', `${scale}x`, `${code}.png`), await renderPng(svg, scale)),
  );

  const ms = Math.round(performance.now() - started);
  console.info(`Generated ${pennants.length} pennants in ${ms} ms`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
