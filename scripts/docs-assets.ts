/**
 * Copies the generated package assets into the docs site's public folder so the
 * site serves the real files (same relative layout as the npm package):
 *
 *   docs/public/{svg,png,css,sprite}/   from the build output (gitignored)
 *   docs/public/flag-icons/             a few flag-icons 4x3 flags for the migration page
 *
 * Requires `npm run build` (or at least `npm run generate`) first.
 */
import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const publicDir = join(root, 'docs', 'public');
const folders = ['svg', 'png', 'css', 'sprite'] as const;
const flagIconsSamples = ['ar', 'br', 'jp', 'gb-eng', 'eu', 'za'];

const missing = folders.filter((folder) => !existsSync(join(root, folder)));
if (missing.length > 0 || !existsSync(join(root, 'dist', 'index.js'))) {
  console.error(
    `Missing build output (${[...missing, 'dist'].join(', ')}). Run \`npm run build\` first.`,
  );
  process.exit(1);
}

await Promise.all(
  folders.map(async (folder) => {
    const target = join(publicDir, folder);
    await rm(target, { recursive: true, force: true });
    await cp(join(root, folder), target, { recursive: true });
  }),
);

const flagIconsTarget = join(publicDir, 'flag-icons');
await rm(flagIconsTarget, { recursive: true, force: true });
await mkdir(flagIconsTarget, { recursive: true });
await Promise.all(
  flagIconsSamples.map((code) =>
    cp(
      join(root, 'node_modules', 'flag-icons', 'flags', '4x3', `${code}.svg`),
      join(flagIconsTarget, `${code}.svg`),
    ),
  ),
);

console.info(`Copied ${folders.join(', ')} and flag-icons samples to docs/public`);
