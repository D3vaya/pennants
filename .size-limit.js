// Flag art chunks, the per-set loader maps and the fetch sanitizer load on demand via import(); exclude them so these
// budgets measure eager code only. Real-bundler totals (incl. lazy maps) are gated by bundle:budget.
const excludeFlagChunks = (config) => ({
  ...config,
  external: [...[config.external ?? []].flat(), /\/(flags|art)\/|\/(load-(1x1|4x3)|sanitize)-/],
});

export default [
  {
    name: 'core: isPennantCode',
    path: 'dist/index.js',
    import: '{ isPennantCode }',
    limit: '1 kB',
  },
  {
    name: 'core: loadPennant (flag chunks excluded)',
    path: 'dist/index.js',
    limit: '2 kB',
    import: '{ loadPennant }',
    modifyRolldownConfig: excludeFlagChunks,
  },
  {
    name: 'react',
    path: 'dist/react/index.js',
    ignore: ['react', 'react-dom', 'react/jsx-runtime'],
    limit: '3.75 kB',
    modifyRolldownConfig: excludeFlagChunks,
  },
  {
    name: 'element',
    path: 'dist/element/index.js',
    limit: '4 kB',
    modifyRolldownConfig: excludeFlagChunks,
  },
  {
    name: 'one flag art (1x1/ar)',
    path: 'dist/art/1x1/ar.js',
    rolldown: false,
    limit: '1.5 kB',
  },
  {
    name: 'css',
    path: 'css/pennant.min.css',
    rolldown: false,
    limit: '2 kB',
  },
];
