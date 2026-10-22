import { computed, ref } from 'vue';
import { useData, withBase } from 'vitepress';
import { SHAPE_ART, SHAPE_SIZE, getPennantName, pennantUrl, type PennantShape } from 'pennants';

export type Lang = 'en' | 'es';

const messages = {
  en: {
    search: 'Search',
    searchPlaceholder: 'Code or name (ar, Japan, gb-eng)',
    size: 'Size',
    count: (shown: number, total: number) => `${shown} of ${total} flags`,
    copy: 'Copy',
    copied: 'Copied',
    close: 'Close',
    snippetsFor: 'Snippets',
    openDetails: (name: string, code: string) => `${name} (${code}): show snippets`,
    noResults: 'No pennant matches this search.',
    code: 'Code',
    name: 'Name',
    kind: 'Kind',
    emoji: 'Emoji',
    iso: 'ISO 3166-1',
    other: 'Region or organization',
    preview: 'Preview',
    format: 'Format',
    flag: 'Flag',
    light: 'Bar light',
    dark: 'Bar dark',
    presets: 'Presets',
    reset: 'Reset',
    shape: 'Shape',
  },
  es: {
    search: 'Buscar',
    searchPlaceholder: 'Código o nombre (ar, Japón, gb-eng)',
    size: 'Tamaño',
    count: (shown: number, total: number) => `${shown} de ${total} banderas`,
    copy: 'Copiar',
    copied: 'Copiado',
    close: 'Cerrar',
    snippetsFor: 'Fragmentos de código',
    openDetails: (name: string, code: string) => `${name} (${code}): ver fragmentos`,
    noResults: 'Ningún banderín coincide con la búsqueda.',
    code: 'Código',
    name: 'Nombre',
    kind: 'Tipo',
    emoji: 'Emoji',
    iso: 'ISO 3166-1',
    other: 'Región u organización',
    preview: 'Vista previa',
    format: 'Formato',
    flag: 'Bandera',
    light: 'Barra clara',
    dark: 'Barra oscura',
    presets: 'Ajustes',
    reset: 'Restablecer',
    shape: 'Forma',
  },
} as const;

export function useLang() {
  const { lang } = useData();
  const current = computed<Lang>(() => (lang.value.startsWith('es') ? 'es' : 'en'));
  return { lang: current, t: computed(() => messages[current.value]) };
}

/**
 * Spanish names for the flags that `Intl.DisplayNames` cannot name (or names
 * differently). Docs site only: the library ships English names for these.
 */
const spanishExtras: Record<string, string> = {
  arab: 'Liga Árabe',
  asean: 'Asociación de Naciones del Sudeste Asiático',
  cefta: 'Acuerdo Centroeuropeo de Libre Comercio',
  cp: 'Isla Clipperton',
  dg: 'Diego García',
  eac: 'Comunidad de África Oriental',
  'es-ct': 'Cataluña',
  'es-ga': 'Galicia',
  'es-pv': 'País Vasco',
  eu: 'Unión Europea',
  'gb-eng': 'Inglaterra',
  'gb-nir': 'Irlanda del Norte',
  'gb-sct': 'Escocia',
  'gb-wls': 'Gales',
  ic: 'Islas Canarias',
  pc: 'Comunidad del Pacífico',
  'sh-ac': 'Isla Ascensión',
  'sh-hl': 'Santa Elena',
  'sh-ta': 'Tristán de Acuña',
  un: 'Naciones Unidas',
  xk: 'Kosovo',
  xx: 'Desconocida',
};

/** Flag name for the docs UI: the library's name, plus Spanish names for non-ISO flags. */
export function siteName(code: string, lang: Lang): string {
  return (lang === 'es' ? spanishExtras[code] : undefined) ?? getPennantName(code, lang);
}

/** URL of an asset copied into docs/public by scripts/docs-assets.ts. */
export const asset = (path: string): string => withBase(`/${path}`);

/** Site URL of one flag's SVG in a shape (same layout as the npm package). */
export const flagAsset = (code: string, shape: PennantShape = 'pennant'): string =>
  asset(`svg/${shape}/${code}.svg`);

export const shapeLabels: Record<Lang, Record<PennantShape, string>> = {
  en: { pennant: 'Pennant', rect: 'Rectangle 4:3', square: 'Square', circle: 'Circle' },
  es: { pennant: 'Banderín', rect: 'Rectángulo 4:3', square: 'Cuadrado', circle: 'Círculo' },
};

/** Shape picked in the gallery, hero and format picker; shared across components. */
export const currentShape = ref<PennantShape>('pennant');

/** Display box for a shape at a given height, in px. */
export function shapeBox(shape: PennantShape, height: number): { width: number; height: number } {
  const size = SHAPE_SIZE[shape];
  return { width: Math.round((height * size.width) / size.height), height };
}

/** Bytes as the docs print them: `933 B`, `5.1 kB` (`5,1 kB` in Spanish). */
export function formatBytes(bytes: number, lang: Lang): string {
  if (Math.abs(bytes) < 1000) return `${bytes} B`;
  const kb = (bytes / 1000).toFixed(1);
  return `${lang === 'es' ? kb.replace('.', ',') : kb} kB`;
}

/** `gb-eng` -> `gbEng`, a valid identifier for import snippets. */
export const identifier = (code: string): string =>
  code.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

export interface Snippet {
  id: FormatId;
  label: string;
  code: string;
}

export type FormatId =
  'css' | 'img' | 'png' | 'sprite' | 'module' | 'lazy' | 'fetch' | 'react' | 'element';

export const formatLabels: Record<FormatId, string> = {
  css: 'CSS',
  img: 'SVG <img> / CDN',
  png: 'PNG',
  sprite: 'SVG sprite',
  module: 'JS module',
  lazy: 'loadFlag',
  fetch: 'fetchPennant',
  react: 'React',
  element: 'Web Component',
};

/** Copy-ready usage for one flag in one shape, in every format. */
export function snippets(code: string, lang: Lang, shape: PennantShape = 'pennant'): Snippet[] {
  const name = siteName(code, lang);
  const id = identifier(code);
  const isPennant = shape === 'pennant';
  const css = isPennant ? 'pennants/css' : `pennants/css/${shape}`;
  const { width, height } = shapeBox(shape, 36);
  const png1 = pennantUrl(code, { shape, format: 'png' });
  const opt = isPennant ? '' : `, { shape: '${shape}' }`;
  const attr = isPennant ? '' : ` shape="${shape}"`;
  const locale = lang === 'en' ? '' : ` locale="${lang}"`;
  const label = lang === 'en' ? '' : ` label="${name}"`;
  const sprite = isPennant
    ? `<!-- copy node_modules/pennants/sprite/pennant.svg to /assets -->`
    : lang === 'es'
      ? `<!-- sprite/${shape}.svg no se publica en npm: genéralo con npm run generate (ver Formas) -->`
      : `<!-- sprite/${shape}.svg is not published to npm: build it with npm run generate (see Shapes) -->`;
  const all: Record<FormatId, string> = {
    css: `import '${css}';\n\n<span class="pn pn-${code}" role="img" aria-label="${name}"></span>`,
    img: `<img src="${pennantUrl(code, { shape })}" width="${width}" height="${height}" alt="${name}" />`,
    png: isPennant
      ? `<img\n  src="${png1}"\n  srcset="${pennantUrl(code, { shape, format: 'png', scale: 2 })} 2x"\n  width="${width}" height="${height}" alt="${name}" />`
      : `<img src="${png1}" width="${width}" height="${height}" alt="${name}" />`,
    sprite: `${sprite}\n<svg width="${width}" height="${height}" role="img" aria-label="${name}">\n  <use href="/assets/${shape}.svg#pn-${code}" />\n</svg>`,
    module: `import { renderFlag } from 'pennants';\nimport ${id} from 'pennants/art/${SHAPE_ART[shape]}/${code}';\n\nelement.innerHTML = renderFlag(${id}${opt}); // trusted SVG markup`,
    lazy: `import { loadFlag } from 'pennants';\n\nelement.innerHTML = await loadFlag('${code}'${opt});`,
    fetch: `import { fetchPennant } from 'pennants/fetch';\n\nelement.innerHTML = await fetchPennant('${code}'${opt});`,
    react: `import { Pennant } from 'pennants/react';\n\n<Pennant code="${code}"${attr} size={32}${locale} />`,
    element: `import 'pennants/element/register';\n\n<pennant-flag code="${code}"${attr} size="32"${label}></pennant-flag>`,
  };
  return (Object.keys(all) as FormatId[]).map((key) => ({
    id: key,
    label: formatLabels[key],
    code: all[key],
  }));
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
