import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useSyncExternalStore,
  type CSSProperties,
  type HTMLAttributes,
  type Ref,
} from 'react';
import {
  PENNANT_HEIGHT,
  PENNANT_WIDTH,
  getPennantName,
  isPennantCode,
  pennantUrl,
  toPennantCode,
  type PennantCode,
} from '../index.ts';
import { loadMarkup, peekMarkup, subscribeMarkup } from '../internal/cache.ts';
import { prepareSvg, svgCode } from '../internal/svg.ts';

/** Pennant height: a number of CSS pixels or any CSS length (`"2rem"`). */
export type PennantSize = number | string;

type BaseAttributes = Omit<
  HTMLAttributes<HTMLElement>,
  'title' | 'children' | 'dangerouslySetInnerHTML'
>;

interface SharedProps {
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

export interface PennantProps extends BaseAttributes, SharedProps {
  /**
   * Flag code, lowercase or uppercase (`"ar"`, `"AR"`, `"gb-eng"`, `"GB-ENG"`);
   * normalised with `toPennantCode`. Unknown codes throw a `RangeError`.
   */
  code: PennantCode | Uppercase<PennantCode>;
  /** `inline` (default) lazy-loads and inlines the SVG; `img` renders an `<img>` tag. */
  mode?: 'inline' | 'img';
  /** `img` mode: base URL where the package's `svg/` folder is served (see `pennantUrl`). */
  base?: string;
  /** `img` mode: native lazy loading. Default `lazy`. */
  loading?: 'lazy' | 'eager';
  /** `img` mode: image decoding hint. Default `async`. */
  decoding?: 'async' | 'sync' | 'auto';
}

export interface PennantSvgProps extends BaseAttributes, SharedProps {
  /** Pennant markup, e.g. `import ar from 'pennants/flags/ar'`. Must be trusted. */
  svg: string;
}

const round = (value: number): number => Math.round(value * 1000) / 1000;

/** Box size for a given `size` prop: explicit height, width derived from 66:72. */
export function pennantBox(size?: PennantSize): { width: string; height: string } {
  if (typeof size === 'number') {
    return { width: `${round((size * PENNANT_WIDTH) / PENNANT_HEIGHT)}px`, height: `${size}px` };
  }
  const height = size ?? '1em';
  return { width: `calc(${height} * ${PENNANT_WIDTH} / ${PENNANT_HEIGHT})`, height };
}

function frameStyle(
  size: PennantSize | undefined,
  style: CSSProperties | undefined,
): CSSProperties {
  return { display: 'inline-block', ...pennantBox(size), ...style };
}

function a11yProps(label: string): HTMLAttributes<HTMLElement> {
  return label === '' ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label };
}

const noop = (): void => {};
const serverSnapshot = (): undefined => undefined;

/**
 * Renders a pennant. Inline mode loads the flag's chunk on demand and keeps
 * the box reserved while loading; img mode points at the static SVG asset.
 */
export const Pennant = forwardRef<HTMLElement, PennantProps>(function Pennant(
  { code, mode = 'inline', base, size, title, locale, style, loading, decoding, ...rest },
  ref,
) {
  const normalized = toPennantCode(code);
  const label = title ?? getPennantName(normalized, locale);
  const inline = mode !== 'img';
  const scope = useId();

  const svg = useSyncExternalStore(
    subscribeMarkup,
    () => (inline ? peekMarkup(normalized) : undefined),
    serverSnapshot,
  );

  useEffect(() => {
    // Stale results are harmless: they only fill the cache, while rendering
    // always reads the markup of the current `code`.
    if (inline) loadMarkup(normalized).catch(noop);
  }, [inline, normalized]);

  const html = useMemo(() => (svg === undefined ? '' : prepareSvg(svg, scope)), [svg, scope]);

  if (!inline) {
    const intrinsic = typeof size === 'number' ? size / PENNANT_HEIGHT : 1;
    return (
      <img
        ref={ref as Ref<HTMLImageElement>}
        {...rest}
        src={pennantUrl(normalized, base === undefined ? {} : { base })}
        alt={label}
        width={round(PENNANT_WIDTH * intrinsic)}
        height={round(PENNANT_HEIGHT * intrinsic)}
        loading={loading ?? 'lazy'}
        decoding={decoding ?? 'async'}
        style={frameStyle(size, style)}
      />
    );
  }

  return (
    <span
      ref={ref as Ref<HTMLSpanElement>}
      {...rest}
      {...a11yProps(label)}
      data-pennant={normalized}
      style={frameStyle(size, style)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

/**
 * Synchronous (SSR-friendly) pennant from statically imported markup:
 * `import ar from 'pennants/flags/ar'` then `<PennantSvg svg={ar} />`.
 */
export const PennantSvg = forwardRef<HTMLSpanElement, PennantSvgProps>(function PennantSvg(
  { svg, size, title, locale, style, ...rest },
  ref,
) {
  const scope = useId();
  const code = svgCode(svg);
  const known = code !== undefined && isPennantCode(code) ? code : undefined;
  const label = title ?? (known === undefined ? '' : getPennantName(known, locale));
  const html = useMemo(() => prepareSvg(svg, scope), [svg, scope]);
  return (
    <span
      ref={ref}
      {...rest}
      {...a11yProps(label)}
      data-pennant={known}
      style={frameStyle(size, style)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});
