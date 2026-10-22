// Copies the HTML pages and the self-hosted pennants assets into dist/.
import { cp, mkdir } from 'node:fs/promises';

const pkg = 'node_modules/pennants';
await mkdir('dist', { recursive: true });
await cp('index.html', 'dist/index.html');
await cp('local.html', 'dist/local.html');
for (const dir of ['css', 'svg', 'sprite', 'dist']) {
  await cp(`${pkg}/${dir}`, `dist/pennants/${dir}`, { recursive: true });
}
