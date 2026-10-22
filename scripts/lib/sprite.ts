/**
 * SVG sprite: every pennant as a `<symbol id="pn-<code>">`.
 *
 *   <svg><use href="pennants.svg#pn-ar"/></svg>
 */
import { assertValidCode, unwrapSvg } from './pennant.ts';

export interface SpriteEntry {
  code: string;
  /** Standalone pennant SVG as produced by `buildPennant`. */
  svg: string;
}

export function spriteSymbol({ code, svg }: SpriteEntry): string {
  assertValidCode(code);
  const { viewBox, content } = unwrapSvg(svg);
  return `<symbol id="pn-${code}" viewBox="${viewBox}">${content}</symbol>`;
}

/** Every `id="…"` value in `markup`, in document order. */
export function collectIds(markup: string): string[] {
  return Array.from(markup.matchAll(/\sid="([^"]+)"/g), (match) => match[1] as string);
}

/**
 * Concatenates the symbols into one document. Inner ids are already
 * namespaced per flag (`pn-<code>-*`), but a symbol id such as `pn-gb-eng`
 * could still collide with an inner id of `gb`, so uniqueness is checked.
 */
export function buildSprite(entries: readonly SpriteEntry[]): string {
  const symbols = entries.map(spriteSymbol).join('');
  const seen = new Set<string>();
  for (const id of collectIds(symbols)) {
    if (seen.has(id)) {
      throw new Error(`Duplicate id "${id}" in sprite`);
    }
    seen.add(id);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg">${symbols}</svg>\n`;
}
