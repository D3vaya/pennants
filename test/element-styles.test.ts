// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BAR_CLASS } from '../src/shapes.ts';

// jsdom implements CSSStyleSheet#replaceSync but not ShadowRoot#adoptedStyleSheets:
// emulate a supporting browser by defining the accessor.
const adopted = new WeakMap<ShadowRoot, CSSStyleSheet[]>();

beforeEach(() => {
  vi.resetModules();
  Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', {
    configurable: true,
    get(this: ShadowRoot) {
      return adopted.get(this) ?? [];
    },
    set(this: ShadowRoot, sheets: CSSStyleSheet[]) {
      adopted.set(this, sheets);
    },
  });
});
afterEach(() => {
  Reflect.deleteProperty(ShadowRoot.prototype, 'adoptedStyleSheets');
});

describe('<pennant-flag> CSP-safe styles', () => {
  it('adopts one shared constructable stylesheet instead of a <style> element', async () => {
    const { definePennantElement, PENNANT_ELEMENT_CSS } = await import('../src/element/index.ts');
    definePennantElement('csp-flag');
    const a = document.createElement('csp-flag');
    const b = document.createElement('csp-flag');
    expect(a.shadowRoot?.querySelector('style')).toBeNull();
    const [sheet] = a.shadowRoot?.adoptedStyleSheets ?? [];
    expect(sheet).toBeInstanceOf(CSSStyleSheet);
    expect(b.shadowRoot?.adoptedStyleSheets).toEqual([sheet]); // shared instance
    const rules = [...(sheet?.cssRules ?? [])].map((rule) => rule.cssText.replace(/\s+/g, ''));
    // Every rule of the source text was parsed (serialisation may quote attribute values).
    expect(rules).toHaveLength(PENNANT_ELEMENT_CSS.split('}').length - 1);
    expect(rules.join('').replace(/"/g, '')).toContain(':host([shape=rect]){aspect-ratio:4/3;}');
    expect(rules.join('')).toContain('.pn-bar-l{stop-color:var(--pennant-bar-light,#d5b97a);}');
  });

  it('includes the bar theming rule so ancestor --pennant-bar-* vars recolour the bar', async () => {
    const { PENNANT_ELEMENT_CSS } = await import('../src/element/index.ts');
    expect(PENNANT_ELEMENT_CSS).toContain(
      `.${BAR_CLASS.light}{stop-color:var(--pennant-bar-light,#d5b97a)}`,
    );
    expect(PENNANT_ELEMENT_CSS).toContain(
      `.${BAR_CLASS.dark}{stop-color:var(--pennant-bar-dark,#8e713f)}`,
    );
  });
});
