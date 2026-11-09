// Node side of the README: the API, the shipped files, SSR and every link.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { renderFlag, loadFlag, getPennantName } from 'pennants';
import cl from 'pennants/art/1x1/cl';
import { Pennant, PennantSvg } from 'pennants/react';

const VERSION = JSON.parse(
  readFileSync(fileURLToPath(import.meta.resolve('pennants/package.json')), 'utf8'),
).version;
const isSvg = (s) =>
  typeof s === 'string' && s.trimStart().startsWith('<svg') && s.includes('</svg>');

test('renderFlag(cl, { shape: "circle" }) returns SVG markup', () => {
  const svg = renderFlag(cl, { shape: 'circle' });
  assert.ok(isSvg(svg), svg.slice(0, 80));
});

test('loadFlag("cl") and loadFlag("cl", { shape: "rect" }) return SVG', async () => {
  const pennant = await loadFlag('cl');
  const rect = await loadFlag('cl', { shape: 'rect' });
  assert.ok(isSvg(pennant));
  assert.ok(isSvg(rect));
  assert.notEqual(pennant, rect);
});

test("getPennantName('de', 'es') is 'Alemania'", () => {
  assert.equal(getPennantName('de', 'es'), 'Alemania');
});

// SSR, as documented in the FAQ ("SSR and hydration").
test('React <Pennant> on the server: accessible, sized, empty until hydration', () => {
  const html = renderToString(createElement(Pennant, { code: 'cl', size: 32 }));
  assert.match(html, /role="img" aria-label="Chile"/);
  assert.match(html, /<svg[^>]*height="32"[^>]*><\/svg>/);
});

test('React <Pennant mode="img"> puts the flag in the server HTML', () => {
  const html = renderToString(createElement(Pennant, { code: 'cl', size: 32, mode: 'img' }));
  assert.match(html, /<img[^>]+src="[^"]+cl[^"]*"/);
  assert.match(html, /Chile/);
});

test('React <PennantSvg art={cl}> puts the artwork in the server HTML', () => {
  const html = renderToString(createElement(PennantSvg, { art: cl, size: 32 }));
  assert.match(html, /<svg[^>]*>.*<path/s);
});

test('require() of the ESM package works (Node 20.19+)', () => {
  const require = createRequire(import.meta.url);
  const pkg = require('pennants');
  assert.equal(typeof pkg.renderFlag, 'function');
});

test('pennants/svg/<shape>/<code>.svg exists for every shape', () => {
  for (const shape of ['pennant', 'rect', 'square', 'circle']) {
    const file = fileURLToPath(import.meta.resolve(`pennants/svg/${shape}/cl.svg`));
    assert.ok(existsSync(file), file);
  }
});

test('pennants/png/pennant/{1x,2x}/<code>.png exists', () => {
  for (const scale of ['1x', '2x']) {
    const file = fileURLToPath(import.meta.resolve(`pennants/png/pennant/${scale}/cl.png`));
    assert.ok(existsSync(file), file);
  }
});

const README = readFileSync(
  fileURLToPath(import.meta.resolve('pennants/package.json')).replace('package.json', 'README.md'),
  'utf8',
);

test('the CDN URL in the README is pinned to this version and serves the SVG', async () => {
  const pinned = [...README.matchAll(/cdn\.jsdelivr\.net\/npm\/pennants@([^/]+)\//g)].map(
    (m) => m[1],
  );
  assert.ok(pinned.length > 0);
  assert.deepEqual([...new Set(pinned)], [VERSION]);
  const res = await fetch(`https://cdn.jsdelivr.net/npm/pennants@${VERSION}/svg/pennant/cl.svg`);
  assert.equal(res.status, 200);
  assert.ok(isSvg(await res.text()));
});

test('pennants-assets-vX.Y.Z.zip is on the GitHub release', async () => {
  const res = await fetch(
    `https://github.com/D3vaya/pennants/releases/download/v${VERSION}/pennants-assets-v${VERSION}.zip`,
    { method: 'HEAD', redirect: 'follow' },
  );
  assert.equal(res.status, 200);
});

test('every link and image in the README resolves', async () => {
  const urls = [...new Set([...README.matchAll(/\]\((https:[^)\s]+)\)/g)].map((m) => m[1]))];
  assert.ok(urls.length > 10);
  const broken = [];
  await Promise.all(
    urls.map(async (url) => {
      // npmjs.com answers 403 to scripts (bot protection); ask the registry instead.
      if (url.startsWith('https://www.npmjs.com/package/')) {
        url = url.replace('https://www.npmjs.com/package/', 'https://registry.npmjs.org/');
      }
      const res = await fetch(url, { redirect: 'follow' }).catch((e) => ({ status: String(e) }));
      if (res.status !== 200) broken.push(`${res.status} ${url}`);
      else if (url.includes('#')) {
        // Check the anchor exists on the page (VitePress heading ids).
        const id = url.split('#')[1];
        const html = await res.text();
        if (!html.includes(`id="${id}"`)) broken.push(`missing #${id} in ${url}`);
      }
    }),
  );
  assert.deepEqual(broken, []);
});
