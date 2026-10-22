import { getPennantName, isPennantCode, type PennantCode } from '../index.ts';
import { loadMarkup, peekMarkup } from '../internal/cache.ts';
import { prepareSvg } from '../internal/svg.ts';

export interface PennantLoadDetail {
  code: PennantCode;
}

export interface PennantErrorDetail {
  /** The `code` attribute value that failed. */
  code: string;
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

const STYLE =
  ':host{display:inline-block;height:var(--pennant-size,1em);aspect-ratio:66/72}' +
  ':host([hidden]){display:none}' +
  'span,svg{display:block;width:100%;height:100%}';

const PROPS = ['code', 'size', 'label'] as const;

// Import-safe outside the browser (Node/SSR): there is no HTMLElement at
// module load there, and the class is simply never constructed.
const Base = (typeof HTMLElement === 'undefined' ? Object : HTMLElement) as typeof HTMLElement;

const normalize = (value: string | null): PennantCode | undefined => {
  const code = value?.trim().toLowerCase();
  return isPennantCode(code) ? code : undefined;
};

/**
 * `<pennant-flag code="ar" size="32" label="Argentina">` — lazily loads the
 * flag into its shadow root. Fires `pennant-load` / `pennant-error`.
 */
export class PennantElement extends Base {
  static readonly observedAttributes: readonly string[] = PROPS;

  readonly #content: HTMLSpanElement;
  #token = 0;
  #shown: string | undefined;
  #ownSize: string | undefined;
  #userSize = '';
  #failed = false;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = STYLE;
    this.#content = document.createElement('span');
    this.#content.setAttribute('part', 'svg');
    root.append(style, this.#content);
  }

  /** Flag code (any casing). Reflects the `code` attribute. */
  get code(): string | null {
    return this.getAttribute('code');
  }
  set code(value: string | null) {
    this.#reflect('code', value);
  }

  /** Height: a number of px or any CSS length. Reflects the `size` attribute. */
  get size(): string | null {
    return this.getAttribute('size');
  }
  set size(value: string | number | null) {
    this.#reflect('size', value);
  }

  /** Accessible name; defaults to the English flag name, `""` = decorative. */
  get label(): string | null {
    return this.getAttribute('label');
  }
  set label(value: string | null) {
    this.#reflect('label', value);
  }

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
    if (this.#shown === undefined || this.#shown !== normalize(this.code)) this.#load();
  }

  disconnectedCallback(): void {
    this.#token++; // ignore loads that finish while detached
  }

  attributeChangedCallback(name: string, previous: string | null, value: string | null): void {
    if (previous === value) return;
    if (name === 'size') {
      this.#applySize();
      return;
    }
    this.#applyA11y();
    if (name === 'code' && this.isConnected) this.#load();
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
    const key = raw.trim().toLowerCase();
    const cached = peekMarkup(key);
    if (cached !== undefined) this.#show(key, cached);
    loadMarkup(key).then(
      (svg) => {
        if (token !== this.#token) return;
        this.#show(key, svg);
        this.dispatchEvent(
          new CustomEvent<PennantLoadDetail>('pennant-load', {
            detail: { code: key as PennantCode },
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
 * already-registered constructor if the tag exists. No-op (returns
 * `undefined`) where `customElements` is unavailable, e.g. during SSR.
 */
export function definePennantElement(tagName = 'pennant-flag'): typeof PennantElement | undefined {
  if (typeof customElements === 'undefined') return undefined;
  const existing = customElements.get(tagName);
  if (existing) return existing as typeof PennantElement;
  // A constructor can only be registered once, so extra tag names get a subclass.
  const ctor = primaryDefined ? class extends PennantElement {} : PennantElement;
  customElements.define(tagName, ctor);
  primaryDefined = true;
  return ctor;
}
