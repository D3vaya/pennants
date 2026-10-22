import type { CSSProperties, HTMLAttributes } from 'react';
import { SHAPE_SIZE, type PennantShape } from '../shapes.ts';

/** Pennant height: a number of CSS pixels or any CSS length (`"2rem"`). */
export type PennantSize = number | string;

/** HTML attributes forwarded to the rendered element (`title`/`children`/inner HTML are managed). */
export type PennantHtmlAttributes = Omit<
  HTMLAttributes<HTMLElement>,
  'title' | 'children' | 'dangerouslySetInnerHTML'
>;

/** Props shared by `Pennant` and `PennantSvg`. */
export interface PennantCommonProps {
  /** Height (px number or CSS length). Width follows the 66:72 ratio. Default `1em`. */
  size?: PennantSize;
  /**
   * Accessible name. Defaults to the localised flag name. Pass `""` to mark
   * the pennant as decorative (`aria-hidden`, empty `alt`).
   */
  title?: string;
  /** Locale used for the default `title` (via `Intl.DisplayNames`). Default `en`. */
  locale?: string;
  /** Flag shape: `pennant` (default), `rect` (4:3), `square` or `circle`. */
  shape?: PennantShape;
}

/** @internal */
export const round = (value: number): number => Math.round(value * 1000) / 1000;

/** CSS box of a pennant, as returned by {@link pennantBox}. */
export interface PennantBox {
  /** CSS width, derived from the height with the shape's ratio (`"29.333px"`, `"calc(2rem * 66 / 72)"`). */
  width: string;
  /** CSS height: `"<n>px"` for numbers, the given length for strings, `"1em"` by default. */
  height: string;
}

/**
 * Box size for a given `size` prop: explicit height, width derived from the
 * shape's aspect ratio (66:72 pennant, 4:3 rect, 1:1 square/circle).
 * Handy to reserve space for a flag outside the components.
 */
export function pennantBox(size?: PennantSize, shape: PennantShape = 'pennant'): PennantBox {
  const { width, height } = SHAPE_SIZE[shape];
  if (typeof size === 'number') {
    return { width: `${round((size * width) / height)}px`, height: `${size}px` };
  }
  const css = size ?? '1em';
  return { width: width === height ? css : `calc(${css} * ${width} / ${height})`, height: css };
}

/**
 * @internal Width/height presentation attributes for the inner `<svg>`:
 * CSP-safe sizing (no `style` attribute). Numbers are pixels; simple CSS
 * lengths (`2rem`, `1.5em`) get a derived width; other values (`calc()`,
 * `%`) set the height only and let the `viewBox` ratio derive the width.
 */
export function svgSize(
  size: PennantSize | undefined,
  shape: PennantShape,
): { width?: string; height: string } {
  const { width, height } = SHAPE_SIZE[shape];
  if (typeof size === 'number') {
    return { width: String(round((size * width) / height)), height: String(size) };
  }
  const css = size ?? '1em';
  const length = /^(\d*\.?\d+)([a-z]*)$/i.exec(css.trim());
  return length
    ? { width: `${round((Number(length[1]) * width) / height)}${String(length[2])}`, height: css }
    : { height: css };
}

/** @internal `style` for `<img>` sizes that HTML attributes cannot express (non-numeric). */
export function imgStyle(
  size: PennantSize | undefined,
  shape: PennantShape,
  style: CSSProperties | undefined,
): CSSProperties | undefined {
  if (typeof size === 'number') return style;
  return { ...pennantBox(size, shape), ...style };
}

/** @internal */
export function a11yProps(label: string): HTMLAttributes<HTMLElement> {
  return label === '' ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label };
}
