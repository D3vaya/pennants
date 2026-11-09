/**
 * Renders two images from the generated flags (requires the svg/ folder):
 *
 * - docs/public/preview.png (README): a string of pennants hanging like
 *   bunting, then a row of the other shapes, on a transparent background.
 * - docs/public/social-preview.png (GitHub's Settings → Social preview,
 *   1280 × 640): the same scene with the name and tagline, on a solid background.
 *
 *   node scripts/docs-preview.ts
 *
 * Both PNGs are committed: the README references the first one from GitHub, and
 * the second one is uploaded by hand in the repository settings.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const bunting = ['cl', 'br', 'mx', 'es', 'us', 'ca', 'gb', 'fr', 'de', 'it', 'pt', 'nl', 'se'];
const others = ['jp', 'kr', 'in', 'za', 'ng', 'ke', 'eg', 'ma', 'tr', 'au', 'nz', 'eu'];
const otherShapes = ['rect', 'square', 'circle'] as const;
const otherHeight = 60; // rendered height of the rect/square/circle row

const width = 1280;
const scale = 1.25; // pennant size relative to its 66 × 72 viewBox
const flagWidth = 66 * scale;
const flagHeight = 72 * scale;
const rowHeight = 150;
const margin = 40;
const sag = 26; // how much each string droops in the middle

/** Point on a parabolic string from (margin, y) to (width - margin, y). */
function stringY(x: number, top: number): number {
  const t = (x - margin) / (width - 2 * margin);
  return top + 4 * sag * t * (1 - t);
}

async function flag(code: string, shape = 'pennant'): Promise<string> {
  const svg = await readFile(join(root, 'svg', shape, `${code}.svg`), 'utf8');
  // Drop the outer width/height so the nested <svg> scales to its placement box.
  return svg.replace(/^<svg([^>]*?) width="\d+" height="\d+"/, '<svg$1');
}

/** A string of pennants hanging from (margin, top) to (width - margin, top). */
async function buntingAt(top: number): Promise<string> {
  const step = (width - 2 * margin) / bunting.length;
  const parts = [
    `<path d="M${margin} ${top} Q${width / 2} ${top + 2 * sag} ${width - margin} ${top}" fill="none" stroke="#8e713f" stroke-width="3" stroke-linecap="round"/>`,
  ];
  for (const [i, code] of bunting.entries()) {
    const cx = margin + step * (i + 0.5);
    const y = stringY(cx, top) - 2;
    const t = (cx - margin) / (width - 2 * margin);
    const angle = (0.5 - t) * -14; // follow the string's slope a little
    const markup = (await flag(code)).replace(
      '<svg',
      `<svg x="${-flagWidth / 2}" y="0" width="${flagWidth}" height="${flagHeight}"`,
    );
    parts.push(`<g transform="translate(${cx} ${y}) rotate(${angle.toFixed(2)})">${markup}</g>`);
  }
  return parts.join('');
}

/** A row of rect, square and circle flags whose top edge is at `top`. */
async function shapesAt(top: number): Promise<string> {
  const step = (width - 2 * margin) / others.length;
  const parts: string[] = [];
  for (const [i, code] of others.entries()) {
    const shape = otherShapes[i % otherShapes.length] ?? 'rect';
    const w = shape === 'rect' ? (otherHeight * 4) / 3 : otherHeight;
    const cx = margin + step * (i + 0.5);
    parts.push(
      (await flag(code, shape)).replace(
        '<svg',
        `<svg x="${cx - w / 2}" y="${top}" width="${w}" height="${otherHeight}"`,
      ),
    );
  }
  return parts.join('');
}

async function write(name: string, svg: string, outWidth: number): Promise<void> {
  const png = await sharp(Buffer.from(svg), { density: 144 })
    .resize({ width: outWidth })
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toBuffer();
  await writeFile(join(root, 'docs', 'public', name), png);
  console.info(`Wrote docs/public/${name} (${Math.round(png.length / 1024)} KiB)`);
}

const svgDoc = (h: number, content: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${h}" viewBox="0 0 ${width} ${h}">${content}</svg>`;

// README image: transparent, at 2x.
const height = margin + rowHeight + 10 + otherHeight + margin;
await write(
  'preview.png',
  svgDoc(height, (await buntingAt(margin)) + (await shapesAt(margin + rowHeight + 10))),
  width * 2,
);

// Social preview: 1280 × 640, GitHub's recommended size.
const socialHeight = 640;
const sans = `font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"`;
const mono = 'font-family="ui-monospace, Menlo, Consolas, monospace"';
await write(
  'social-preview.png',
  svgDoc(
    socialHeight,
    `<rect width="${width}" height="${socialHeight}" fill="#fbf7ee"/>` +
      (await buntingAt(margin)) +
      `<text x="${width / 2}" y="350" text-anchor="middle" ${sans} font-size="112" font-weight="800" fill="#2b2418" letter-spacing="-2">pennants</text>` +
      `<text x="${width / 2}" y="410" text-anchor="middle" ${sans} font-size="34" fill="#6b5a3a">Every flag, every shape, one API</text>` +
      (await shapesAt(458)) +
      `<text x="${width / 2}" y="${socialHeight - 44}" text-anchor="middle" ${mono} font-size="26" fill="#8e713f">npm install pennants</text>`,
  ),
  width,
);
