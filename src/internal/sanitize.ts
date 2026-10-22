/**
 * Allowlist sanitizer for fetched flag SVG. Fetched markup is inlined into the
 * document, so it is parsed as XML, checked element by element and attribute
 * by attribute, and re-serialised. Anything outside the allowlist rejects the
 * whole document (a real flag never needs it), rather than being stripped.
 *
 * Requires `DOMParser`/`XMLSerializer` (browsers, jsdom). Without them (plain
 * Node/SSR) fetched markup is rejected: render on the server with
 * `loadFlag`/`renderFlag`, which use the bundled, trusted artwork.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

/**
 * Elements allowed in a flag. `title`/`desc` are left out on purpose: they are
 * HTML integration points once the markup is re-parsed by the HTML parser.
 */
const ELEMENTS: ReadonlySet<string> = /* @__PURE__ */ new Set([
  'svg',
  'g',
  'path',
  'rect',
  'circle',
  'ellipse',
  'polygon',
  'polyline',
  'line',
  'defs',
  'clipPath',
  'mask',
  'marker',
  'linearGradient',
  'radialGradient',
  'stop',
  'use',
  'symbol',
  'pattern',
  'text',
  'tspan',
]);

/** Geometry and presentation attributes; no event handlers, no `style`. */
const ATTRIBUTES: ReadonlySet<string> = /* @__PURE__ */ new Set([
  'xmlns',
  'xmlns:xlink',
  'xml:space',
  'id',
  'class',
  'viewBox',
  'preserveAspectRatio',
  'version',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'fx',
  'fy',
  'dx',
  'dy',
  'width',
  'height',
  'd',
  'points',
  'transform',
  'offset',
  'href',
  'xlink:href',
  'fill',
  'fill-rule',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-opacity',
  'opacity',
  'color',
  'overflow',
  'visibility',
  'display',
  'clip-path',
  'clip-rule',
  'clipPathUnits',
  'mask',
  'maskUnits',
  'maskContentUnits',
  'stop-color',
  'stop-opacity',
  'gradientUnits',
  'gradientTransform',
  'spreadMethod',
  'patternUnits',
  'patternContentUnits',
  'patternTransform',
  'markerWidth',
  'markerHeight',
  'markerUnits',
  'refX',
  'refY',
  'orient',
  'marker-start',
  'marker-mid',
  'marker-end',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'text-anchor',
  'letter-spacing',
  'word-spacing',
  'dominant-baseline',
  'vector-effect',
  'paint-order',
  'aria-label',
  'aria-hidden',
  'focusable',
  'role',
]);

/** `#local` fragment references only. */
const LOCAL_REF = /^#[\w.:-]+$/;
/** Any `url(...)` in a value must be `url(#local)`. */
const URL_REF = /url\(\s*(['"]?)([^)'"]*)\1\s*\)/gi;
/** Characters/patterns that never appear in a flag attribute value. */
const SUSPICIOUS = /[<>]|&|\\|expression\s*\(|javascript|data:/i;

function unsafeAttribute(attribute: Attr): boolean {
  const { name, value, namespaceURI } = attribute;
  if (!ATTRIBUTES.has(name)) return true;
  if (namespaceURI !== null && namespaceURI !== XLINK_NS && !name.startsWith('xml')) return true;
  if (name === 'href' || name === 'xlink:href') return !LOCAL_REF.test(value);
  if (SUSPICIOUS.test(value)) return true;
  for (const match of value.matchAll(URL_REF)) {
    if (!LOCAL_REF.test(String(match[2]))) return true;
  }
  return false;
}

/**
 * Parses, validates and re-serialises flag SVG markup. Returns `undefined`
 * when the markup is not a single, well-formed, allowlisted `<svg>` document
 * or when no XML parser is available.
 */
export function sanitizeSvg(markup: string): string | undefined {
  if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') return undefined;
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  const root = doc.documentElement;
  if (root.localName !== 'svg' || root.namespaceURI !== SVG_NS) return undefined;
  if (doc.getElementsByTagName('parsererror').length > 0) return undefined;
  for (const element of [root, ...root.querySelectorAll('*')]) {
    if (element.namespaceURI !== SVG_NS || !ELEMENTS.has(element.localName)) return undefined;
    for (const attribute of element.attributes) {
      if (unsafeAttribute(attribute)) return undefined;
    }
  }
  return new XMLSerializer().serializeToString(root);
}
