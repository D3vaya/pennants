import { computed } from 'vue';
import { useData, withBase } from 'vitepress';
import { DEFAULT_CDN_BASE, getPennantName } from 'pennants';

export type Lang = 'en' | 'es';

const messages = {
  en: {
    search: 'Search',
    searchPlaceholder: 'Code or name (ar, Japan, gb-eng)',
    size: 'Size',
    count: (shown: number, total: number) => `${shown} of ${total} pennants`,
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
  },
  es: {
    search: 'Buscar',
    searchPlaceholder: 'Código o nombre (ar, Japón, gb-eng)',
    size: 'Tamaño',
    count: (shown: number, total: number) => `${shown} de ${total} banderines`,
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
  },
} as const;

export function useLang() {
  const { lang } = useData();
  const current = computed<Lang>(() => (lang.value.startsWith('es') ? 'es' : 'en'));
  return { lang: current, t: computed(() => messages[current.value]) };
}

/** URL of an asset copied into docs/public by scripts/docs-assets.ts. */
export const asset = (path: string): string => withBase(`/${path}`);

/** `gb-eng` -> `gbEng`, a valid identifier for import snippets. */
export const identifier = (code: string): string =>
  code.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

export interface Snippet {
  id: FormatId;
  label: string;
  code: string;
}

export type FormatId = 'css' | 'img' | 'png' | 'sprite' | 'module' | 'lazy' | 'react' | 'element';

export const formatLabels: Record<FormatId, string> = {
  css: 'CSS',
  img: 'SVG <img> / CDN',
  png: 'PNG',
  sprite: 'SVG sprite',
  module: 'JS module',
  lazy: 'loadPennant',
  react: 'React',
  element: 'Web Component',
};

/** Copy-ready usage for one pennant in every format. */
export function snippets(code: string, lang: Lang): Snippet[] {
  const name = getPennantName(code, lang);
  const id = identifier(code);
  const cdn = DEFAULT_CDN_BASE;
  const locale = lang === 'en' ? '' : ` locale="${lang}"`;
  const label = lang === 'en' ? '' : ` label="${name}"`;
  const all: Record<FormatId, string> = {
    css: `import 'pennants/css';\n\n<span class="pn pn-${code}" role="img" aria-label="${name}"></span>`,
    img: `<img src="${cdn}/svg/${code}.svg" width="33" height="36" alt="${name}" />`,
    png: `<img\n  src="${cdn}/png/1x/${code}.png"\n  srcset="${cdn}/png/2x/${code}.png 2x"\n  width="66" height="72" alt="${name}" />`,
    sprite: `<!-- copy node_modules/pennants/sprite/pennants.svg to /assets -->\n<svg width="33" height="36" role="img" aria-label="${name}">\n  <use href="/assets/pennants.svg#pn-${code}" />\n</svg>`,
    module: `import ${id} from 'pennants/flags/${code}';\n\nelement.innerHTML = ${id}; // trusted SVG markup`,
    lazy: `import { loadPennant } from 'pennants';\n\nelement.innerHTML = await loadPennant('${code}');`,
    react: `import { Pennant } from 'pennants/react';\n\n<Pennant code="${code}" size={32}${locale} />`,
    element: `import 'pennants/element/register';\n\n<pennant-flag code="${code}" size="32"${label}></pennant-flag>`,
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
