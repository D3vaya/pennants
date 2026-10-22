# Next.js

App Router, Next.js 16. Funciona con Turbopack (por defecto) y con `next build --webpack`.

[Ejemplo completo](https://github.com/d3vaya/pennants/tree/main/examples/nextjs)

```sh
npm install pennants
```

## Hoja de estilos

Impórtala una vez en el layout raíz para usar las clases `pn pn-xx` en cualquier página:

```tsx [app/layout.tsx]
import 'pennants/css/pennants.min.css';
```

Next.js emite los 271 SVG como archivos en `/_next/static/media/`. La hoja de estilos ocupa
unos 16 KB minificada, y cada imagen se descarga solo cuando se usa.

## Server Components: `PennantSvg`

Importa la bandera de forma estática y muéstrala con `PennantSvg`. El SVG va directo al HTML,
y esto no añade JavaScript en el cliente.

```tsx [app/page.tsx]
import Image from 'next/image';
import { PennantSvg } from 'pennants/react';
import ar from 'pennants/flags/ar';
import jpUrl from 'pennants/svg/jp.svg';

export default function Page() {
  return (
    <main>
      <PennantSvg svg={ar} size={48} locale="es" />
      <span className="pn pn-de pn-2x" role="img" aria-label="Alemania" />
      <Image src={jpUrl} alt="Japón" height={48} width={44} />
    </main>
  );
}
```

`next/image` sirve los SVG importados tal cual (sin optimizarlos). Son vectoriales, así que
se ven nítidos a cualquier tamaño.

## Client Components: `Pennant`

Usa `<Pennant>` cuando el código se conoce recién en tiempo de ejecución. Necesita
`'use client'`.

```tsx [app/flag-picker.tsx]
'use client';

import { useState } from 'react';
import { Pennant } from 'pennants/react';
import type { PennantCode } from 'pennants';

export function FlagPicker() {
  const [code, setCode] = useState<PennantCode>('br');
  return (
    <p>
      <Pennant code={code} size={48} locale="es" />
      <button type="button" onClick={() => setCode('mx')}>
        México
      </button>
    </p>
  );
}
```

## Detalles de SSR

- Durante el SSR, `<Pennant>` renderiza una caja vacía del tamaño correcto (con `role="img"`
  y `aria-label`). El SVG llega tras la hidratación, desde un chunk diferido. Para banderas
  conocidas al compilar, usa `PennantSvg` con un import estático.
- `<Pennant mode="img" />` renderiza un `<img>` en el servidor. Por defecto apunta a
  jsDelivr; pasa `base` para servir los archivos tú.
- En Client Components, `<Pennant>` suma unos 7 KB con gzip, más unos pocos KB por cada
  bandera que se muestra.
