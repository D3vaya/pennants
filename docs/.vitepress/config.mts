import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type DefaultTheme } from 'vitepress';

const repo = 'https://github.com/d3vaya/pennants';
// GitHub Pages serves the project site under /pennants/. Override for other hosts.
const base = process.env.DOCS_BASE ?? '/pennants/';
const { version } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as { version: string };
const dist = (path: string): string =>
  fileURLToPath(new URL(`../../dist/${path}`, import.meta.url));

const frameworks = [
  ['html-cdn', 'HTML & CDN'],
  ['vite', 'Vite'],
  ['nextjs', 'Next.js'],
  ['vue', 'Vue'],
  ['svelte', 'Svelte'],
  ['angular', 'Angular'],
  ['astro', 'Astro'],
  ['tailwind', 'Tailwind CSS'],
] as const;

type Labels = {
  guide: string;
  frameworks: string;
  api: string;
  gallery: string;
  pages: [slug: string, text: string][];
};

const labels: Record<'en' | 'es', Labels> = {
  en: {
    guide: 'Guide',
    frameworks: 'Frameworks',
    api: 'API reference',
    gallery: 'Gallery',
    pages: [
      ['getting-started', 'Getting started'],
      ['formats', 'Which format should I use?'],
      ['shapes', 'Shapes'],
      ['performance', 'Performance & weight'],
      ['accessibility', 'Accessibility'],
      ['theming', 'Theming'],
      ['migration', 'Migrating from flag-icons'],
      ['comparison', 'Comparison'],
      ['codes', 'Codes'],
      ['faq', 'FAQ & troubleshooting'],
    ],
  },
  es: {
    guide: 'Guía',
    frameworks: 'Frameworks',
    api: 'Referencia de la API',
    gallery: 'Galería',
    pages: [
      ['getting-started', 'Primeros pasos'],
      ['formats', '¿Qué formato uso?'],
      ['shapes', 'Formas'],
      ['performance', 'Rendimiento y peso'],
      ['accessibility', 'Accesibilidad'],
      ['theming', 'Personalización'],
      ['migration', 'Migrar desde flag-icons'],
      ['comparison', 'Comparación'],
      ['codes', 'Códigos'],
      ['faq', 'Preguntas frecuentes'],
    ],
  },
};

function themeFor(locale: 'en' | 'es'): DefaultTheme.Config {
  const prefix = locale === 'en' ? '' : '/es';
  const t = labels[locale];
  const guide = (slug: string): string => `${prefix}/guide/${slug}`;
  const api = locale === 'en' ? '/api/' : '/es/api/';
  // The generated reference is English only; Spanish gets a summary page first.
  const apiItems: DefaultTheme.SidebarItem[] = [
    ...(locale === 'es' ? [{ text: 'Resumen', link: '/es/api/' }] : []),
    { text: 'pennants', link: '/api/' },
    { text: 'pennants/fetch', link: '/api/fetch' },
    { text: 'pennants/react', link: '/api/react' },
    { text: 'pennants/react/static', link: '/api/react/static' },
    { text: 'pennants/element', link: '/api/element' },
  ];
  return {
    nav: [
      { text: t.guide, link: guide('getting-started'), activeMatch: `${prefix}/guide/` },
      { text: t.gallery, link: `${prefix}/gallery` },
      { text: 'API', link: api, activeMatch: `${prefix}/api/` },
      {
        text: `v${version}`,
        items: [
          { text: 'Changelog', link: `${repo}/blob/main/CHANGELOG.md` },
          { text: 'npm', link: 'https://www.npmjs.com/package/pennants' },
        ],
      },
    ],
    sidebar: {
      [`${prefix}/guide/`]: [
        { text: t.guide, items: t.pages.map(([slug, text]) => ({ text, link: guide(slug) })) },
        {
          // Pages written by the examples workstream.
          text: t.frameworks,
          collapsed: false,
          items: frameworks.map(([slug, text]) => ({ text, link: guide(`frameworks/${slug}`) })),
        },
        {
          text: t.api,
          items: apiItems,
        },
      ],
      [`${prefix}/api/`]: [
        {
          text: t.api,
          items: apiItems,
        },
      ],
    },
    editLink: {
      pattern: `${repo}/edit/main/docs/:path`,
      text: locale === 'en' ? 'Edit this page on GitHub' : 'Editar esta página en GitHub',
    },
    footer: {
      message:
        locale === 'en'
          ? 'MIT licensed. Flag artwork from flag-icons (MIT).'
          : 'Licencia MIT. Banderas de flag-icons (MIT).',
    },
    ...(locale === 'es'
      ? {
          outline: { label: 'En esta página' },
          docFooter: { prev: 'Anterior', next: 'Siguiente' },
          returnToTopLabel: 'Volver arriba',
          sidebarMenuLabel: 'Menú',
          darkModeSwitchLabel: 'Tema',
          lightModeSwitchTitle: 'Cambiar a tema claro',
          darkModeSwitchTitle: 'Cambiar a tema oscuro',
          langMenuLabel: 'Idioma',
          notFound: {
            title: 'PÁGINA NO ENCONTRADA',
            quote: 'Este banderín no está en el mástil.',
            linkText: 'Ir al inicio',
          },
        }
      : {}),
  };
}

export default defineConfig({
  title: 'pennants',
  description: 'Country flags in pennant style: SVG, PNG, CSS, sprite, JS, React, Web Component.',
  base,
  cleanUrls: true,
  // English sources live in docs/en/ but are served from the site root.
  rewrites: { 'en/:rest*': ':rest*' },
  srcExclude: ['**/README.md'],
  sitemap: { hostname: 'https://d3vaya.github.io/pennants/' },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}svg/pennant/ar.svg` }],
    // All four stylesheets: base classes (pn, pn-rect, pn-square, pn-circle) compose on one page.
    ...['pennant', 'rect', 'square', 'circle'].map((shape): [string, Record<string, string>] => [
      'link',
      { rel: 'stylesheet', href: `${base}css/${shape}.min.css` },
    ]),
    ['meta', { name: 'theme-color', content: '#8e713f' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: `https://d3vaya.github.io${base}preview.png` }],
  ],
  locales: {
    root: { label: 'English', lang: 'en-US', themeConfig: themeFor('en') },
    es: {
      label: 'Español',
      lang: 'es-ES',
      link: '/es/',
      description:
        'Banderas de países con forma de banderín: SVG, PNG, CSS, sprite, JS, React y Web Component.',
      themeConfig: themeFor('es'),
    },
  },
  themeConfig: {
    logo: { src: '/svg/pennant/ar.svg', alt: '' },
    socialLinks: [
      { icon: 'github', link: repo },
      { icon: 'npm', link: 'https://www.npmjs.com/package/pennants' },
    ],
    search: {
      provider: 'local',
      options: {
        locales: {
          es: {
            translations: {
              button: { buttonText: 'Buscar', buttonAriaLabel: 'Buscar' },
              modal: {
                noResultsText: 'Sin resultados para',
                resetButtonTitle: 'Borrar búsqueda',
                footer: { selectText: 'seleccionar', navigateText: 'navegar', closeText: 'cerrar' },
              },
            },
          },
        },
      },
    },
  },
  vue: {
    template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('pennant-') } },
  },
  vite: {
    // The site consumes the built package, exactly like a user would.
    resolve: {
      alias: [
        { find: /^pennants$/, replacement: dist('index.js') },
        { find: /^pennants\/element$/, replacement: dist('element/index.js') },
      ],
    },
  },
});
