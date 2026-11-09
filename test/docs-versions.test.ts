import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('..', import.meta.url);
const read = (path: string): string => readFileSync(new URL(path, root), 'utf8');
const { version } = JSON.parse(read('package.json')) as { version: string };

// Copy-paste snippets pin the CDN URL to a version. They must follow package.json,
// or users of a new release copy URLs to the previous one. (The changelog pages
// mention old versions on purpose and are left out.)
const files = [
  'README.md',
  'docs/en/guide/getting-started.md',
  'docs/es/guide/getting-started.md',
  'docs/en/guide/frameworks/html-cdn.md',
  'docs/es/guide/frameworks/html-cdn.md',
  'examples/html-cdn/index.html',
];

describe('pinned CDN versions in docs', () => {
  it.each(files)('%s pins jsDelivr to the package.json version', (file) => {
    const pinned = [...read(file).matchAll(/cdn\.jsdelivr\.net\/npm\/pennants@([^/'"`\s]+)/g)].map(
      (m) => m[1],
    );
    expect(pinned.length).toBeGreaterThan(0);
    expect(new Set(pinned)).toEqual(new Set([version]));
  });
});
