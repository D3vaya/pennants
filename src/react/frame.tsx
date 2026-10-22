import type { CSSProperties, Ref } from 'react';
import type { SvgParts } from '../internal/svg.ts';
import type { PennantShape } from '../shapes.ts';
import { a11yProps, svgSize, type PennantHtmlAttributes, type PennantSize } from './shared.ts';

/** @internal Props of the shared inline frame. */
export interface FrameProps {
  frameRef: Ref<HTMLSpanElement>;
  rest: PennantHtmlAttributes;
  label: string;
  code: string | undefined;
  shape: PennantShape;
  size: PennantSize | undefined;
  style: CSSProperties | undefined;
  parts: SvgParts;
}

/**
 * @internal Inline flag markup shared by `Pennant` and `PennantSvg`: a
 * labelled `<span>` around an `<svg>` sized with presentation attributes, so
 * server-rendered output contains no `style` attribute (CSP-safe without
 * `'unsafe-inline'`) and the box is reserved even while the flag loads.
 */
export function renderFrame({
  frameRef,
  rest,
  label,
  code,
  shape,
  size,
  style,
  parts,
}: FrameProps) {
  return (
    <span
      ref={frameRef}
      {...rest}
      {...a11yProps(label)}
      data-pennant={code}
      data-shape={shape}
      style={style}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={parts.viewBox}
        {...svgSize(size, shape)}
        aria-hidden="true"
        focusable="false"
        dangerouslySetInnerHTML={{ __html: parts.inner }}
      />
    </span>
  );
}
