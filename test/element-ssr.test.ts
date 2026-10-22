// Runs in the default Node environment: no DOM globals.
import { describe, expect, it } from 'vitest';

describe('element SSR import safety', () => {
  it('has no DOM globals here', () => {
    expect(typeof HTMLElement).toBe('undefined');
    expect(typeof customElements).toBe('undefined');
  });

  it('imports the element entry points without a DOM', async () => {
    const mod = await import('../src/element/index.ts');
    expect(typeof mod.PennantElement).toBe('function');
    expect(mod.definePennantElement()).toBeUndefined();
    const register = await import('../src/element/register.ts');
    expect(register.definePennantElement).toBe(mod.definePennantElement);
  });
});
