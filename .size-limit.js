// Flag chunks are loaded on demand via dynamic import(); exclude them so budgets measure the eager code.
const excludeFlagChunks = (config) => ({
  ...config,
  external: [...[config.external ?? []].flat(), /\/flags\//],
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
    limit: '3.5 kB',
    modifyRolldownConfig: excludeFlagChunks,
  },
  {
    name: 'element',
    path: 'dist/element/index.js',
    limit: '3.5 kB',
    modifyRolldownConfig: excludeFlagChunks,
  },
  {
    name: 'one flag (ar)',
    path: 'dist/flags/ar.js',
    rolldown: false,
    limit: '1.5 kB',
  },
  {
    name: 'css',
    path: 'css/pennants.min.css',
    rolldown: false,
    limit: '2 kB',
  },
];
