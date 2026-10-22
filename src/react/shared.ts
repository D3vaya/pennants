import type { CSSProperties, HTMLAttributes } from 'react';
import { PENNANT_HEIGHT, PENNANT_WIDTH } from '../internal/core.ts';

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
}

/** @internal */
export const round = (value: number): number => Math.round(value * 1000) / 1000;

/** CSS box of a pennant, as returned by {@link pennantBox}. */
export interface PennantBox {
  /** CSS width, derived from the height with the 66:72 ratio (`"29.333px"`, `"calc(2rem * 66 / 72)"`). */
  width: string;
  /** CSS height: `"<n>px"` for numbers, the given length for strings, `"1em"` by default. */
  height: string;
}

/**
 * Box size for a given `size` prop: explicit height, width derived from 66:72.
 * Handy to reserve space for a pennant outside the components.
 */
export function pennantBox(size?: PennantSize): PennantBox {
  if (typeof size === 'number') {
    return { width: `${round((size * PENNANT_WIDTH) / PENNANT_HEIGHT)}px`, height: `${size}px` };
  }
  const height = size ?? '1em';
  return { width: `calc(${height} * ${PENNANT_WIDTH} / ${PENNANT_HEIGHT})`, height };
}

/** @internal */
export function frameStyle(
  size: PennantSize | undefined,
  style: CSSProperties | undefined,
): CSSProperties {
  return { display: 'inline-block', ...pennantBox(size), ...style };
}

/** @internal */
export function a11yProps(label: string): HTMLAttributes<HTMLElement> {
  return label === '' ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label };
}
