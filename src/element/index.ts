import { getPennantName, isPennantCode, type PennantCode } from '../internal/core.ts';
import { loadMarkup, peekMarkup } from '../internal/cache.ts';
import { prepareSvg } from '../internal/svg.ts';

/** `detail` of the `pennant-load` event, fired once the flag is rendered. */
export interface PennantLoadDetail {
  /** Normalised code of the flag that was loaded. */
  code: PennantCode;
}

/** `detail` of the `pennant-error` event (unknown code, failed download or invalid fetched markup). */
export interface PennantErrorDetail {
  /** The `code` attribute value that failed. */
  code: string;
  /** The rejection reason: a `RangeError` for unknown codes, otherwise the load/fetch error. */
  error: unknown;
}

declare global {
  interface HTMLElementTagNameMap {
    'pennant-flag': PennantElement;
  }
  interface HTMLElementEventMap {
    'pennant-load': CustomEvent<PennantLoadDetail>;
    'pennant-error': CustomEvent<PennantErrorDetail>;
  }
}

/**
 * Shadow styles. Includes the bar theming rule: document styles don't reach
 * the shadow root, but custom properties inherit, so `--pennant-bar-light` /
 * `--pennant-bar-dark` on any ancestor recolour the bar.
 */
export const PENNANT_ELEMENT_CSS =
  ':host{display:inline-block;height:var(--pennant-size,1em);aspect-ratio:66/72}' +
  ':host([hidden]){display:none}' +
  'span,svg{display:block;width:100%;height:100%}' +
  '.pn-bar-l{stop-color:var(--pennant-bar-light,#d5b97a)}' +
  '.pn-bar-d{stop-color:var(--pennant-bar-dark,#8e713f)}';

let sharedSheet: CSSStyleSheet | undefined;

/**
 * CSP-safe styling: one constructable stylesheet shared by every instance
 * (allowed without `style-src 'unsafe-inline'`), falling back to a `<style>`
 * element only where `adoptedStyleSheets` is unsupported.
 */
function applyStyles(root: ShadowRoot): void {
  if ('adoptedStyleSheets' in ShadowRoot.prototype && 'replaceSync' in CSSStyleSheet.prototype) {
    if (!sharedSheet) {
      sharedSheet = new CSSStyleSheet();
      sharedSheet.replaceSync(PENNANT_ELEMENT_CSS);
    }
    root.adoptedStyleSheets = [sharedSheet];
    return;
  }
  const style = document.createElement('style');
  style.textContent = PENNANT_ELEMENT_CSS;
  root.prepend(style);
}

const PROPS = ['code', 'size', 'label', 'base'] as const;

// Import-safe outside the browser (Node/SSR): there is no HTMLElement at
// module load there, and the class is simply never constructed.
const Base = (typeof HTMLElement === 'undefined' ? Object : HTMLElement) as typeof HTMLElement;

const normalize = (value: string | null): PennantCode | undefined => {
  const code = value?.trim().toLowerCase();
  return isPennantCode(code) ? code : undefined;
};

/** Options of {@link definePennantElement}. */
export interface DefinePennantElementOptions {
  /**
   * Fetch mode for every instance of this tag: load `<base>/svg/<code>.svg`
   * with `fetchPennant` instead of the bundled flag chunks. A per-element
   * `base` attribute takes precedence.
   */
  base?: string;
}

/**
 * `<pennant-flag code="ar" size="32" label="Argentina">` — lazily loads the
 * flag into its shadow root. Fires `pennant-load` / `pennant-error`. With a
 * `base` attribute (or `definePennantElement(tag, { base })`) the flag is
 * fetched from `<base>/svg/<code>.svg` instead of the bundled chunks.
 */
export class PennantElement extends Base {
  /** Attributes the element reacts to: `code`, `size`, `label`, `base`. */
  static readonly observedAttributes: readonly string[] = PROPS;
  /** Fetch base used when the element has no `base` attribute (set by `definePennantElement`). */
  static defaultBase: string | undefined;

  readonly #content: HTMLSpanElement;
  #token = 0;
  #shown: string | undefined;
  #ownSize: string | undefined;
  #userSize = '';
  #failed = false;

  /** Prefer `document.createElement('pennant-flag')` or the tag in HTML after `definePennantElement()`. */
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    this.#content = document.createElement('span');
    this.#content.setAttribute('part', 'svg');
    root.append(this.#content);
    applyStyles(root);
  }

  /** Flag code (any casing). Reflects the `code` attribute. */
  get code(): string | null {
    return this.getAttribute('code');
  }
  /** Sets (or with `null` removes) the `code` attribute. */
  set code(value: string | null) {
    this.#reflect('code', value);
  }

  /** Height: a number of px or any CSS length. Reflects the `size` attribute. */
  get size(): string | null {
    return this.getAttribute('size');
  }
  /** Sets the `size` attribute; numbers are pixels. `null` removes it. */
  set size(value: string | number | null) {
    this.#reflect('size', value);
  }

  /** Accessible name; defaults to the English flag name, `""` = decorative. */
  get label(): string | null {
    return this.getAttribute('label');
  }
  /** Sets the `label` attribute; `""` marks it decorative, `null` restores the default name. */
  set label(value: string | null) {
    this.#reflect('label', value);
  }

  /** Fetch-mode base URL (see `pennantUrl`). Reflects the `base` attribute. */
  get base(): string | null {
    return this.getAttribute('base');
  }
  /** Sets the `base` attribute (fetch mode); `null` returns to the tag default. */
  set base(value: string | null) {
    this.#reflect('base', value);
  }

  /** @internal Custom element lifecycle. */
  connectedCallback(): void {
    // Properties set before the element was upgraded shadow the accessors.
    for (const prop of PROPS) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        const value = (this as Record<string, unknown>)[prop] as string | null;
        Reflect.deleteProperty(this, prop);
        this[prop] = value;
      }
    }
    this.#applySize();
    this.#applyA11y();
    if (this.#shown === undefined || this.#shown !== this.#key(normalize(this.code))) this.#load();
  }

  /** @internal Custom element lifecycle. */
  disconnectedCallback(): void {
    this.#token++; // ignore loads that finish while detached
  }

  /** @internal Custom element lifecycle. */
  attributeChangedCallback(name: string, previous: string | null, value: string | null): void {
    if (previous === value) return;
    if (name === 'size') {
      this.#applySize();
      return;
    }
    if (name !== 'base') this.#applyA11y();
    if ((name === 'code' || name === 'base') && this.isConnected) this.#load();
  }

  #reflect(name: string, value: string | number | null): void {
    if (value === null || value === undefined) this.removeAttribute(name);
    else this.setAttribute(name, String(value));
  }

  #applySize(): void {
    const size = this.size?.trim();
    const current = this.style.getPropertyValue('--pennant-size');
    if (size) {
      if (this.#ownSize === undefined || current !== this.#ownSize) this.#userSize = current;
      this.#ownSize = /^\d*\.?\d+$/.test(size) ? `${size}px` : size;
      this.style.setProperty('--pennant-size', this.#ownSize);
      return;
    }
    // Only undo what this element set, restoring a user's own inline
    // `style="--pennant-size:…"`, which must survive a missing/removed `size`.
    if (this.#ownSize !== undefined && current === this.#ownSize) {
      if (this.#userSize) this.style.setProperty('--pennant-size', this.#userSize);
      else this.style.removeProperty('--pennant-size');
    }
    this.#ownSize = undefined;
    this.#userSize = '';
  }

  #applyA11y(): void {
    const { label } = this;
    const code = normalize(this.code);
    const fallback = code === undefined || this.#failed ? null : getPennantName(code);
    const name = label === '' ? null : (label ?? fallback);
    if (name === null) {
      // No accessible name (decorative, missing/unknown code or failed load
      // without a label): hide it rather than expose an unnamed role="img".
      this.removeAttribute('role');
      this.removeAttribute('aria-label');
      this.setAttribute('aria-hidden', 'true');
      return;
    }
    this.removeAttribute('aria-hidden');
    this.setAttribute('role', 'img');
    this.setAttribute('aria-label', name);
  }

  #source(): string | undefined {
    return this.base ?? (this.constructor as typeof PennantElement).defaultBase;
  }

  /** Identity of what is displayed: source + normalised code. */
  #key(code: string | undefined): string | undefined {
    return code === undefined ? undefined : `${this.#source() ?? ''}\n${code}`;
  }

  #show(code: string | undefined, svg?: string): void {
    if (code !== undefined && code === this.#shown) return;
    this.#content.innerHTML = svg === undefined ? '' : prepareSvg(svg);
    this.#shown = code;
  }

  #load(): void {
    const token = ++this.#token;
    if (this.#failed) {
      this.#failed = false;
      this.#applyA11y();
    }
    const raw = this.code;
    if (raw === null) {
      this.#show(undefined);
      return;
    }
    const code = raw.trim().toLowerCase();
    const source = this.#source();
    const key = this.#key(code);
    const cached = peekMarkup(code, source);
    if (cached !== undefined) this.#show(key, cached);
    loadMarkup(code, source).then(
      (svg) => {
        if (token !== this.#token) return;
        this.#show(key, svg);
        this.dispatchEvent(
          new CustomEvent<PennantLoadDetail>('pennant-load', {
            detail: { code: code as PennantCode },
            bubbles: true,
          }),
        );
      },
      (error: unknown) => {
        if (token !== this.#token) return;
        this.#show(undefined);
        this.#failed = true;
        this.#applyA11y();
        this.dispatchEvent(
          new CustomEvent<PennantErrorDetail>('pennant-error', {
            detail: { code: raw, error },
            bubbles: true,
          }),
        );
      },
    );
  }
}

let primaryDefined = false;

/**
 * Registers the element (default tag `pennant-flag`). Idempotent: returns the
 * already-registered constructor if the tag exists (options are then
 * ignored). No-op (returns `undefined`) where `customElements` is
 * unavailable, e.g. during SSR. `{ base }` switches the tag to fetch mode.
 */
export function definePennantElement(
  tagName = 'pennant-flag',
  options: DefinePennantElementOptions = {},
): typeof PennantElement | undefined {
  if (typeof customElements === 'undefined') return undefined;
  const existing = customElements.get(tagName);
  if (existing) return existing as typeof PennantElement;
  // A constructor can only be registered once, so extra tag names (and
  // fetch-mode tags) get a subclass.
  let ctor = PennantElement;
  if (primaryDefined || options.base !== undefined) {
    ctor = class extends PennantElement {};
    ctor.defaultBase = options.base;
  }
  customElements.define(tagName, ctor);
  if (ctor === PennantElement) primaryDefined = true;
  return ctor;
}
