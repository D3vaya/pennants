/**
 * Post-processes the TypeDoc markdown in docs/en/api so it reads well in VitePress:
 * per-module titles, and the 271-member code unions collapsed to `PennantCode`.
 *
 * Run after `typedoc --options docs/typedoc.json` (see the `docs:api` script).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const apiDir = fileURLToPath(new URL('../docs/en/api/', import.meta.url));

const pages: Record<string, { title: string; intro: string }> = {
  'index.md': {
    title: 'pennants',
    intro: "Core API. `import { loadPennant, getPennantName } from 'pennants'`.",
  },
  'react.md': {
    title: 'pennants/react',
    intro: "React components. `import { Pennant, PennantSvg } from 'pennants/react'`.",
  },
  'element.md': {
    title: 'pennants/element',
    intro:
      "Web Component. `import { definePennantElement } from 'pennants/element'`, or `import 'pennants/element/register'` for `<pennant-flag>`.",
  },
};

const codeLink = (file: string): string =>
  file === 'index.md' ? '[`PennantCode`](#pennantcode)' : '[`PennantCode`](./index.md#pennantcode)';

/**
 * Collapses long unions of quoted codes, whether rendered inline, one per
 * line, inside code blocks or in markdown tables.
 */
function collapseUnions(markdown: string, file: string): string {
  const token = String.raw`\x60?"[a-zA-Z-]{2,6}"\x60?`;
  const separator = String.raw`\s*\\?\|\s*`;
  const union = new RegExp(String.raw`(?:${separator})?${token}(?:${separator}${token}){20,}`, 'g');
  return markdown
    .replace(union, (match) => {
      const upper = /"[A-Z]/.test(match);
      const markdownContext = match.includes('\x60') || match.includes('\\|');
      const leading = /^\s*/.exec(match)?.[0] ?? '';
      // A leading "|" means a one-per-line union: keep line breaks, drop the pipe.
      const hasLeadingPipe = /^\s*\\?\|/.test(match);
      const prefix = hasLeadingPipe
        ? markdownContext && leading.includes('\n')
          ? leading.replace(/[ \t]+$/, '')
          : ' '
        : leading;
      const type = markdownContext
        ? `${codeLink(file)}${upper ? ' \\| `Uppercase<PennantCode>`' : ''}`
        : `PennantCode${upper ? ' | Uppercase<PennantCode>' : ''}`;
      return prefix + type;
    })
    .replace(/const codes: readonly \[[^\]]+\];/, 'const codes: readonly PennantCode[];');
}

for (const [file, { title, intro }] of Object.entries(pages)) {
  const path = join(apiDir, file);
  const source = await readFile(path, 'utf8');
  const body = source.replace(/^# .*\n/, '');
  const output = `---\ntitle: ${title}\noutline: [2, 3]\n---\n\n# ${title}\n\n${intro}\n${collapseUnions(body, file)}`;
  await writeFile(path, output);
}

console.info(`Post-processed ${Object.keys(pages).length} API pages`);
