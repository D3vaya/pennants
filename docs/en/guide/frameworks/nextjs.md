# Next.js

App Router, Next.js 16. Works with Turbopack (default) and `next build --webpack`.

[Full example](https://github.com/d3vaya/pennants/tree/main/examples/nextjs)

```sh
npm install pennants
```

## Stylesheet

Import it once in the root layout to use the `pn pn-xx` classes anywhere:

```tsx [app/layout.tsx]
import 'pennants/css/pennants.min.css';
```

Next.js emits the 271 flag SVGs as separate files under `/_next/static/media/`. The
stylesheet is about 16 KB minified, and each flag image is downloaded only when it is used.

## Server Components: `PennantSvg`

Import the flag statically and render it with `PennantSvg`. The SVG goes straight into the
HTML, and this adds no client-side JavaScript.

```tsx [app/page.tsx]
import Image from 'next/image';
import { PennantSvg } from 'pennants/react';
import ar from 'pennants/flags/ar';
import jpUrl from 'pennants/svg/jp.svg';

export default function Page() {
  return (
    <main>
      <PennantSvg svg={ar} size={48} />
      <span className="pn pn-de pn-2x" role="img" aria-label="Germany" />
      <Image src={jpUrl} alt="Japan" height={48} width={44} />
    </main>
  );
}
```

`next/image` serves SVG imports as-is (no optimization). They are vector images, so they
stay sharp at any size.

## Client Components: `Pennant`

Use `<Pennant>` when the code is only known at runtime. It needs `'use client'`.

```tsx [app/flag-picker.tsx]
'use client';

import { useState } from 'react';
import { Pennant } from 'pennants/react';
import type { PennantCode } from 'pennants';

export function FlagPicker() {
  const [code, setCode] = useState<PennantCode>('br');
  return (
    <p>
      <Pennant code={code} size={48} />
      <button type="button" onClick={() => setCode('mx')}>
        Mexico
      </button>
    </p>
  );
}
```

## SSR caveats

- During SSR, `<Pennant>` renders an empty box of the right size (with `role="img"` and an
  `aria-label`). The SVG arrives after hydration, from a lazy chunk. For flags known at build
  time, use `PennantSvg` with a static import instead.
- `<Pennant mode="img" />` renders an `<img>` on the server. By default it points to jsDelivr;
  pass `base` to serve the files yourself.
- In client components, `<Pennant>` adds about 7 KB gzip, plus a few KB for each flag shown.
