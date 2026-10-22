'use client';
import { forwardRef, useEffect, useId, useMemo, useSyncExternalStore, type Ref } from 'react';
import { SHAPE_SIZE } from '../shapes.ts';
import {
  DEFAULT_CDN_BASE,
  getPennantName,
  pennantUrl,
  toPennantCode,
  toShape,
  type PennantCode,
} from '../internal/core.ts';
import { loadCachedFlag, peekFlag, subscribeFlags } from '../internal/cache.ts';
import { inlineParts, type SvgParts } from '../internal/svg.ts';
import { renderFrame } from './frame.tsx';
import { imgStyle, round, type PennantHtmlAttributes, type PennantCommonProps } from './shared.ts';

/** Props of {@link Pennant}. Other HTML attributes and `ref` are forwarded. */
export interface PennantProps extends PennantHtmlAttributes, PennantCommonProps {
  /**
   * Flag code, lowercase or uppercase (`"ar"`, `"AR"`, `"gb-eng"`, `"GB-ENG"`);
   * normalised with `toPennantCode`. Unknown codes throw a `RangeError`.
   */
  code: PennantCode | Uppercase<PennantCode>;
  /**
   * - `inline` (default): lazy-loads the flag's bundled artwork chunk and inlines the SVG;
   * - `fetch`: fetches `<base>/svg/<shape>/<code>.svg` at runtime and inlines it
   *   (no bundled flag data at all);
   * - `img`: renders an `<img>` pointing at `<base>/svg/<shape>/<code>.svg`.
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
 * Renders a flag (any shape) on the client. Unknown codes or shapes throw a
 * `RangeError`. Inline/fetch modes keep the box reserved
 * while loading; img mode points at the static SVG asset.
 */
export const Pennant = /* @__PURE__ */ forwardRef<HTMLElement, PennantProps>(function Pennant(
  {
    code,
    shape = 'pennant',
    mode = 'inline',
    base,
    size,
    title,
    locale,
    style,
    loading,
    decoding,
    ...rest
  },
  ref,
) {
  const normalized = toPennantCode(code);
  const validShape = toShape(shape);
  const label = title ?? getPennantName(normalized, locale);
  const inline = mode !== 'img';
  const source = mode === 'fetch' ? (base ?? DEFAULT_CDN_BASE) : undefined;
  const scope = useId();

  const flag = useSyncExternalStore(
    subscribeFlags,
    () => (inline ? peekFlag(normalized, validShape, source) : undefined),
    serverSnapshot,
  );

  useEffect(() => {
    // Stale results are harmless: they only fill the cache, while rendering
    // always reads the flag of the current code/shape/source.
    if (inline) loadCachedFlag(normalized, validShape, source).catch(noop);
  }, [inline, normalized, validShape, source]);

  const parts = useMemo((): SvgParts => {
    if (flag !== undefined) return inlineParts(flag, validShape, scope);
    // Empty placeholder with the final viewBox: reserves the box while loading.
    const { width, height } = SHAPE_SIZE[validShape];
    return { viewBox: `0 0 ${width} ${height}`, inner: '' };
  }, [flag, validShape, scope]);

  if (!inline) {
    const { width, height } = SHAPE_SIZE[validShape];
    const intrinsic = typeof size === 'number' ? size / height : 1;
    return (
      <img
        ref={ref as Ref<HTMLImageElement>}
        {...rest}
        src={pennantUrl(
          normalized,
          base === undefined ? { shape: validShape } : { base, shape: validShape },
        )}
        alt={label}
        width={round(width * intrinsic)}
        height={round(height * intrinsic)}
        loading={loading ?? 'lazy'}
        decoding={decoding ?? 'async'}
        style={imgStyle(size, validShape, style)}
      />
    );
  }

  return renderFrame({
    frameRef: ref as Ref<HTMLSpanElement>,
    rest,
    label,
    code: normalized,
    shape: validShape,
    size,
    style,
    parts,
  });
});
