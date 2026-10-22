import { forwardRef, useId, useMemo } from 'react';
import { getPennantName, isPennantCode, toShape } from '../internal/core.ts';
import { inlineParts } from '../internal/svg.ts';
import { renderFrame } from './frame.tsx';
import type { FlagArt } from '../shapes.ts';
import type { PennantCommonProps, PennantHtmlAttributes } from './shared.ts';

/** Props of {@link PennantSvg}: shared props plus statically imported artwork. */
export interface PennantSvgProps extends PennantHtmlAttributes, PennantCommonProps {
  /**
   * Flag artwork, e.g. `import ar from 'pennants/art/1x1/ar'`. Use the `4x3`
   * set for `shape="rect"` and `1x1` for the other shapes. Must be trusted.
   */
  art: FlagArt;
}

/**
 * Synchronous flag from statically imported artwork:
 * `import ar from 'pennants/art/1x1/ar'` then `<PennantSvg art={ar} shape="circle" />`.
 * Uses only `useId`/`useMemo`, so it also renders in React Server Components.
 * Throws a `RangeError` for unknown shapes.
 */
export const PennantSvg = /* @__PURE__ */ forwardRef<HTMLSpanElement, PennantSvgProps>(
  function PennantSvg({ art, shape = 'pennant', size, title, locale, style, ...rest }, ref) {
    const scope = useId();
    const validShape = toShape(shape);
    const known = isPennantCode(art.code) ? art.code : undefined;
    const label = title ?? (known === undefined ? '' : getPennantName(known, locale));
    const parts = useMemo(() => inlineParts(art, validShape, scope), [art, validShape, scope]);
    return renderFrame({
      frameRef: ref,
      rest,
      label,
      code: known,
      shape: validShape,
      size,
      style,
      parts,
    });
  },
);
