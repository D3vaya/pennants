// The README says "Typed": check the public types from a user's point of view.
import { renderFlag, loadFlag, getPennantName, type PennantCode } from 'pennants';
import cl from 'pennants/art/1x1/cl';
import { Pennant } from 'pennants/react';

const code: PennantCode = 'cl';
// @ts-expect-error: not a flag code
const bad: PennantCode = 'zz';

const markup: string = renderFlag(cl, { shape: 'circle' });
const lazy: Promise<string> = loadFlag('cl', { shape: 'rect' });
const name: string | undefined = getPennantName('de', 'es');

// @ts-expect-error: unknown shape
renderFlag(cl, { shape: 'hexagon' });

export const element = <Pennant code={code} size={32} />;
// @ts-expect-error: unknown code in the React component
export const wrong = <Pennant code="zz" />;
export { markup, lazy, name, bad };
