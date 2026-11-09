# pennants README check

Installs `pennants` from npm and follows its README step by step, as a new user would.

```sh
npm install
npx playwright install chromium   # first time only
npm test
```

- `tests/node.test.mjs`: API in Node, React SSR (as documented in the FAQ), `require()`,
  shipped SVG/PNG files, the CDN URL, the release zip and every README link.
- `src/types-check.tsx`: the public types (`PennantCode`, shapes, `<Pennant code>`), via `tsc`.
- `src/main.jsx` + `index.html`: every README snippet, built with Vite.
- `tests/browser.spec.js`: opens the build in Chromium and checks each snippet draws a flag,
  with no console errors or failed requests. Screenshot: `test-results/readme-check.png`.

To test another version: `npm install pennants@X.Y.Z && npm test`. CI runs this against
npm after every release (`release.yml`, job "README works from npm").
