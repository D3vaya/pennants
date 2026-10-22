import { forwardRef, useId, useMemo } from 'react';
import { getPennantName, isPennantCode, toShape } from '../internal/core.ts';
import { inlineFlag } from '../internal/svg.ts';
import type { FlagArt } from '../shapes.ts';
import {
  a11yProps,
  frameStyle,
  type PennantCommonProps,
  type PennantHtmlAttributes,
} from './shared.ts';

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
    const html = useMemo(() => inlineFlag(art, validShape, scope), [art, validShape, scope]);
    return (
      <span
        ref={ref}
        {...rest}
        {...a11yProps(label)}
        data-pennant={known}
        data-shape={validShape}
        style={frameStyle(size, validShape, style)}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  },
);
