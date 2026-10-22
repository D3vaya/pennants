/**
 * Renders docs/public/preview.png (README and social preview): two strings of
 * pennants hanging like bunting, on a transparent background.
 *
 *   node scripts/docs-preview.ts      (requires the generated svg/ folder)
 *
 * The PNG is committed so the README can reference it from GitHub.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const rows = [
  ['ar', 'br', 'mx', 'es', 'us', 'ca', 'gb', 'fr', 'de', 'it', 'pt', 'nl', 'se'],
  ['jp', 'kr', 'in', 'za', 'ng', 'ke', 'eg', 'ma', 'tr', 'au', 'nz', 'gb-sct', 'eu'],
];

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

async function pennant(code: string): Promise<string> {
  const svg = await readFile(join(root, 'svg', `${code}.svg`), 'utf8');
  // Drop the outer width/height so the nested <svg> scales to its placement box.
  return svg.replace(/^<svg([^>]*?) width="\d+" height="\d+"/, '<svg$1');
}

const parts: string[] = [];
for (const [index, codes] of rows.entries()) {
  const top = margin + index * rowHeight;
  const step = (width - 2 * margin) / codes.length;
  parts.push(
    `<path d="M${margin} ${top} Q${width / 2} ${top + 2 * sag} ${width - margin} ${top}" fill="none" stroke="#8e713f" stroke-width="3" stroke-linecap="round"/>`,
  );
  for (const [i, code] of codes.entries()) {
    const cx = margin + step * (i + 0.5);
    const y = stringY(cx, top) - 2;
    const t = (cx - margin) / (width - 2 * margin);
    const angle = (0.5 - t) * -14; // follow the string's slope a little
    const markup = (await pennant(code)).replace(
      '<svg',
      `<svg x="${-flagWidth / 2}" y="0" width="${flagWidth}" height="${flagHeight}"`,
    );
    parts.push(`<g transform="translate(${cx} ${y}) rotate(${angle.toFixed(2)})">${markup}</g>`);
  }
}

const height = margin + rows.length * rowHeight + 10;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
const png = await sharp(Buffer.from(svg), { density: 144 })
  .resize({ width: width * 2 })
  .png({ compressionLevel: 9, palette: true, quality: 90 })
  .toBuffer();
await writeFile(join(root, 'docs', 'public', 'preview.png'), png);
console.info(`Wrote docs/public/preview.png (${Math.round(png.length / 1024)} KiB)`);
