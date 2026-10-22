/**
 * Builds every asset from the `flag-icons` source artwork.
 *
 *   src/generated/art/<set>/<code>.ts  artwork modules ({ code, viewBox, content }), set = 1x1 | 4x3
 *   src/generated/loaders-<set>.ts     lazy artwork import map per set
 *   src/generated/codes.ts             code list + PennantCode type
 *   src/generated/names.ts             English names of non-ISO flags
 *   src/generated/flags/*.ts, loaders.ts  framed pennant strings (legacy, until runtime moves to art)
 *   svg/<shape>/<code>.svg             standalone SVG files
 *   png/<shape>/{1x,2x}/<code>.png     rasters
 *   sprite/<shape>.svg                 <symbol id="pn-<code>"> sprites
 *   css/<shape>(.min|.cdn.min).css     flag-icons-like stylesheets (cdn: version-pinned jsDelivr URLs)
 *   css/theme.css                      pennant bar theming rules only (for inlined SVGs)
 *   css/pennants.d.ts                  types for side-effect CSS imports
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { availableParallelism } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import sharp from 'sharp';
import {
  composeFlag,
  SHAPE_ART,
  SHAPES,
  type ArtSet,
  type FlagArt,
  type PennantShape,
} from '../src/shapes.ts';
import { readFlagSources } from './lib/flags.ts';
import { ART_SETS } from './lib/art.ts';
import {
  artLoadersModule,
  artModule,
  codesModule,
  flagModule,
  loadersModule,
  namesModule,
} from './lib/modules.ts';
import { cdnSvgPath, cssDeclaration, minifyCss, pennantsCss, themeCss } from './lib/css.ts';
import { mapLimit, pngScales, renderPng } from './lib/png.ts';
import { buildSprite } from './lib/sprite.ts';

const limit = availableParallelism();

// One libvips thread per pipeline: many small images parallelise far better
// across images than within one (~3x faster than sharp's defaults).
sharp.concurrency(1);

const root = fileURLToPath(new URL('..', import.meta.url));
const generated = join(root, 'src', 'generated');

async function write(path: string, data: string | Buffer): Promise<void> {
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, data);
}

/**
 * Optimises both art sets on one worker thread per core (svgo is synchronous
 * and dominates the build). Jobs are dealt round-robin so heavy flags spread.
 */
async function buildAllArt(codes: readonly string[]): Promise<Record<ArtSet, FlagArt[]>> {
  const jobs = ART_SETS.flatMap((set) => codes.map((code) => ({ code, set })));
  const chunks = Array.from({ length: limit }, (_, i) => jobs.filter((_, j) => j % limit === i));
  const results = await Promise.all(
    chunks.map(
      (chunk) =>
        new Promise<{ set: ArtSet; art: FlagArt }[]>((resolve, reject) => {
          const worker = new Worker(new URL('./art-worker.ts', import.meta.url), {
            workerData: chunk,
          });
          worker.once('message', resolve);
          worker.once('error', reject);
        }),
    ),
  );
  const order = new Map(codes.map((code, i) => [code, i]));
  const byCode = (a: FlagArt, b: FlagArt): number =>
    (order.get(a.code) ?? 0) - (order.get(b.code) ?? 0);
  const flat = results.flat();
  return Object.fromEntries(
    ART_SETS.map((set) => [
      set,
      flat
        .filter((r) => r.set === set)
        .map((r) => r.art)
        .sort(byCode),
    ]),
  ) as Record<ArtSet, FlagArt[]>;
}

async function main(): Promise<void> {
  const started = performance.now();
  const outputs = ['svg', 'png', 'css', 'sprite', join('src', 'generated')];
  await Promise.all(outputs.map((dir) => rm(join(root, dir), { recursive: true, force: true })));

  const sources = await readFlagSources();
  const codes = sources.map((s) => s.code);
  const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')) as {
    version: string;
  };

  const art = await buildAllArt(codes);

  const pennants = art['1x1'].map((a) => ({ code: a.code, svg: composeFlag(a, 'pennant') }));
  await Promise.all([
    write(join(generated, 'codes.ts'), codesModule(sources)),
    write(join(generated, 'names.ts'), namesModule(sources)),
    write(join(generated, 'loaders.ts'), loadersModule(sources)),
    ...pennants.map(({ code, svg }) =>
      write(join(generated, 'flags', `${code}.ts`), flagModule(svg)),
    ),
    ...ART_SETS.flatMap((set) => [
      write(join(generated, `loaders-${set}.ts`), artLoadersModule(sources, set)),
      ...art[set].map((a) => write(join(generated, 'art', set, `${a.code}.ts`), artModule(a))),
    ]),
    write(join(root, 'css', 'theme.css'), minifyCss(themeCss())),
    write(join(root, 'css', 'pennants.d.ts'), cssDeclaration()),
  ]);

  const pngJobs: { shape: PennantShape; code: string; svg: string; scale: number }[] = [];
  for (const shape of SHAPES) {
    const flags = art[SHAPE_ART[shape]].map((a) => ({ code: a.code, svg: composeFlag(a, shape) }));
    const css = pennantsCss(codes, { shape });
    const cdn = pennantsCss(codes, { shape, svgPath: cdnSvgPath(version, shape) });
    await Promise.all([
      ...flags.map(({ code, svg }) => write(join(root, 'svg', shape, `${code}.svg`), svg)),
      write(join(root, 'sprite', `${shape}.svg`), buildSprite(flags)),
      write(join(root, 'css', `${shape}.css`), css),
      write(join(root, 'css', `${shape}.min.css`), minifyCss(css)),
      write(join(root, 'css', `${shape}.cdn.min.css`), minifyCss(cdn)),
    ]);
    for (const flag of flags) {
      for (const scale of pngScales(shape)) pngJobs.push({ shape, ...flag, scale });
    }
  }

  // sharp already threads each pipeline internally; cap the pipelines in flight.
  await mapLimit(pngJobs, limit, async ({ shape, code, svg, scale }) =>
    write(join(root, 'png', shape, `${scale}x`, `${code}.png`), await renderPng(svg, scale, shape)),
  );

  const ms = Math.round(performance.now() - started);
  console.info(`Generated ${codes.length} flags x ${SHAPES.length} shapes in ${ms} ms`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
