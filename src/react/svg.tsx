import { forwardRef, useId, useMemo } from 'react';
import { getPennantName, isPennantCode } from '../internal/core.ts';
import { prepareSvg, svgCode } from '../internal/svg.ts';
import {
  a11yProps,
  frameStyle,
  type PennantHtmlAttributes,
  type PennantCommonProps,
} from './shared.ts';

export interface PennantSvgProps extends PennantHtmlAttributes, PennantCommonProps {
  /** Pennant markup, e.g. `import ar from 'pennants/flags/ar'`. Must be trusted. */
  svg: string;
}

/**
 * Synchronous pennant from statically imported markup:
 * `import ar from 'pennants/flags/ar'` then `<PennantSvg svg={ar} />`.
 * Uses only `useId`/`useMemo`, so it also renders in React Server Components.
 */
export const PennantSvg = /* @__PURE__ */ forwardRef<HTMLSpanElement, PennantSvgProps>(
  function PennantSvg({ svg, size, title, locale, style, ...rest }, ref) {
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
  },
);
