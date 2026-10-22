import type { CSSProperties, HTMLAttributes } from 'react';
import { PENNANT_HEIGHT, PENNANT_WIDTH } from '../internal/core.ts';

/** Pennant height: a number of CSS pixels or any CSS length (`"2rem"`). */
export type PennantSize = number | string;

export type PennantHtmlAttributes = Omit<
  HTMLAttributes<HTMLElement>,
  'title' | 'children' | 'dangerouslySetInnerHTML'
>;

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

export const round = (value: number): number => Math.round(value * 1000) / 1000;

/** Box size for a given `size` prop: explicit height, width derived from 66:72. */
export function pennantBox(size?: PennantSize): { width: string; height: string } {
  if (typeof size === 'number') {
    return { width: `${round((size * PENNANT_WIDTH) / PENNANT_HEIGHT)}px`, height: `${size}px` };
  }
  const height = size ?? '1em';
  return { width: `calc(${height} * ${PENNANT_WIDTH} / ${PENNANT_HEIGHT})`, height };
}

export function frameStyle(
  size: PennantSize | undefined,
  style: CSSProperties | undefined,
): CSSProperties {
  return { display: 'inline-block', ...pennantBox(size), ...style };
}

export function a11yProps(label: string): HTMLAttributes<HTMLElement> {
  return label === '' ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label };
}
