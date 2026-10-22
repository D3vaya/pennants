# Next.js

App Router, Next.js 16. Works with Turbopack (default) and `next build --webpack`.

[Full example](https://github.com/D3vaya/pennants/tree/main/examples/nextjs)

```sh
npm install pennants
```

## Stylesheet

Import the stylesheet of each shape you use once, in the root layout:

```tsx [app/layout.tsx]
import 'pennants/css'; // className="pn pn-ar"
import 'pennants/css/circle'; // className="pn-circle pn-ar"
```

`pennants/css/rect` and `pennants/css/square` work the same way, with the `pn-rect` and
`pn-square` base classes.

Next.js emits the 271 flag SVGs as separate files under `/_next/static/media/`. Each flag image
is downloaded only when it is used.

## Server Components: `PennantSvg`

Import a flag's artwork statically and render it with `PennantSvg` in any shape. The SVG goes
straight into the HTML, and this adds no client-side JavaScript. `pennants/react` is safe to
import from Server Components.

```tsx [app/page.tsx]
import Image from 'next/image';
import { PennantSvg } from 'pennants/react';
import ar from 'pennants/art/1x1/ar'; // pennant, square, circle
import ar4x3 from 'pennants/art/4x3/ar'; // rect
import jpUrl from 'pennants/svg/circle/jp.svg';

export default function Page() {
  return (
    <main>
      <PennantSvg art={ar} size={48} />
      <PennantSvg art={ar4x3} shape="rect" size={48} />
      <PennantSvg art={ar} shape="square" size={48} />
      <PennantSvg art={ar} shape="circle" size={48} />

      <span className="pn pn-de pn-2x" role="img" aria-label="Germany" />
      <Image src={jpUrl} alt="Japan" height={48} width={48} />
    </main>
  );
}
```

`next/image` serves SVG imports as-is (no optimization). They are vector images, so they stay
sharp at any size.

## Client Components: `Pennant`

Use `<Pennant>` when the code or shape is only known at runtime. It needs `'use client'`.

```tsx [app/flag-picker.tsx]
'use client';

import { useState } from 'react';
import { Pennant } from 'pennants/react';
import { SHAPES, type PennantCode, type PennantShape } from 'pennants';

export function FlagPicker() {
  const [code, setCode] = useState<PennantCode>('br');
  const [shape, setShape] = useState<PennantShape>('circle');
  return (
    <p>
      <Pennant code={code} shape={shape} size={48} />
      <button type="button" onClick={() => setCode('mx')}>
        Mexico
      </button>
      {SHAPES.map((choice) => (
        <button key={choice} type="button" onClick={() => setShape(choice)}>
          {choice}
        </button>
      ))}
    </p>
  );
}
```

## SSR caveats

- During SSR, `<Pennant>` renders an empty box of the right size (with `role="img"` and an
  `aria-label`). The SVG arrives after hydration, from a lazy chunk. For flags known at build
  time, use `PennantSvg` with a static art import instead.
- `<Pennant mode="img" />` renders an `<img>` on the server. `mode="fetch"` fetches the SVG
  instead of bundling chunks. Both point to jsDelivr by default; pass `base` to serve the
  files yourself.
- In client components, `<Pennant>` adds <Size probe="react-pennant" /> gzip, plus a few KB
  for each flag shown. `PennantSvg` with one art module adds <Size probe="react-svg" /> gzip
  when used on the client.
