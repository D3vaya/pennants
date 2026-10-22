'use client';
import { forwardRef, useEffect, useId, useMemo, useSyncExternalStore, type Ref } from 'react';
import {
  DEFAULT_CDN_BASE,
  PENNANT_HEIGHT,
  PENNANT_WIDTH,
  getPennantName,
  pennantUrl,
  toPennantCode,
  type PennantCode,
} from '../internal/core.ts';
import { loadMarkup, peekMarkup, subscribeMarkup } from '../internal/cache.ts';
import { prepareSvg } from '../internal/svg.ts';
import {
  a11yProps,
  frameStyle,
  round,
  type PennantHtmlAttributes,
  type PennantCommonProps,
} from './shared.ts';

/** Props of {@link Pennant}. Other HTML attributes and `ref` are forwarded. */
export interface PennantProps extends PennantHtmlAttributes, PennantCommonProps {
  /**
   * Flag code, lowercase or uppercase (`"ar"`, `"AR"`, `"gb-eng"`, `"GB-ENG"`);
   * normalised with `toPennantCode`. Unknown codes throw a `RangeError`.
   */
  code: PennantCode | Uppercase<PennantCode>;
  /**
   * - `inline` (default): lazy-loads the flag's bundled chunk and inlines the SVG;
   * - `fetch`: fetches `<base>/svg/<code>.svg` at runtime and inlines it (no
   *   bundled flag data at all);
   * - `img`: renders an `<img>` pointing at `<base>/svg/<code>.svg`.
   */
  mode?: 'inline' | 'fetch' | 'img';
  /** `fetch`/`img` modes: where the package's `svg/` folder is served. Default: versioned jsDelivr CDN. */
  base?: string;
  /** `img` mode: native lazy loading. Default `lazy`. */
  loading?: 'lazy' | 'eager';
  /** `img` mode: image decoding hint. Default `async`. */
  decoding?: 'async' | 'sync' | 'auto';
}

const noop = (): void => {};
const serverSnapshot = (): undefined => undefined;

/**
 * Renders a pennant on the client. Inline/fetch modes keep the box reserved
 * while loading; img mode points at the static SVG asset.
 */
export const Pennant = /* @__PURE__ */ forwardRef<HTMLElement, PennantProps>(function Pennant(
  { code, mode = 'inline', base, size, title, locale, style, loading, decoding, ...rest },
  ref,
) {
  const normalized = toPennantCode(code);
  const label = title ?? getPennantName(normalized, locale);
  const inline = mode !== 'img';
  const source = mode === 'fetch' ? (base ?? DEFAULT_CDN_BASE) : undefined;
  const scope = useId();

  const svg = useSyncExternalStore(
    subscribeMarkup,
    () => (inline ? peekMarkup(normalized, source) : undefined),
    serverSnapshot,
  );

  useEffect(() => {
    // Stale results are harmless: they only fill the cache, while rendering
    // always reads the markup of the current `code`/source.
    if (inline) loadMarkup(normalized, source).catch(noop);
  }, [inline, normalized, source]);

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
