/**
 * Worker for scripts/generate.ts: svgo is synchronous and dominates the
 * build, so artwork is optimised on one thread per core.
 */
import { parentPort, workerData } from 'node:worker_threads';
import sharp from 'sharp';
import type { ArtSet } from '../src/shapes.ts';
import { buildFlagArt } from './lib/art.ts';

sharp.concurrency(1);
const jobs = workerData as { code: string; set: ArtSet }[];
const results = [];
for (const { code, set } of jobs) {
  results.push({ set, art: await buildFlagArt(code, set) });
}
parentPort?.postMessage(results);
