# Next.js

App Router, Next.js 16. Funciona con Turbopack (por defecto) y con `next build --webpack`.

[Ejemplo completo](https://github.com/d3vaya/pennants/tree/main/examples/nextjs)

```sh
npm install pennants
```

## Hoja de estilos

Importa una sola vez, en el layout raíz, la hoja de cada forma que uses:

```tsx [app/layout.tsx]
import 'pennants/css'; // className="pn pn-ar"
import 'pennants/css/circle'; // className="pn-circle pn-ar"
```

`pennants/css/rect` y `pennants/css/square` funcionan igual, con las clases base `pn-rect` y
`pn-square`.

Next.js emite los 271 SVG como archivos en `/_next/static/media/`. Cada imagen se descarga
solo cuando se usa.

## Server Components: `PennantSvg`

Importa el arte de la bandera de forma estática y muéstrala con `PennantSvg` en cualquier
forma. El SVG va directo al HTML, y esto no añade JavaScript en el cliente. `pennants/react`
se puede importar sin problemas desde Server Components.

```tsx [app/page.tsx]
import Image from 'next/image';
import { PennantSvg } from 'pennants/react';
import ar from 'pennants/art/1x1/ar'; // pennant, square, circle
import ar4x3 from 'pennants/art/4x3/ar'; // rect
import jpUrl from 'pennants/svg/circle/jp.svg';

export default function Page() {
  return (
    <main>
      <PennantSvg art={ar} size={48} locale="es" />
      <PennantSvg art={ar4x3} shape="rect" size={48} locale="es" />
      <PennantSvg art={ar} shape="square" size={48} locale="es" />
      <PennantSvg art={ar} shape="circle" size={48} locale="es" />

      <span className="pn pn-de pn-2x" role="img" aria-label="Alemania" />
      <Image src={jpUrl} alt="Japón" height={48} width={48} />
    </main>
  );
}
```

`next/image` sirve los SVG importados tal cual (sin optimizarlos). Son vectoriales, así que
se ven nítidos a cualquier tamaño.

## Client Components: `Pennant`

Usa `<Pennant>` cuando el código o la forma se conocen recién en tiempo de ejecución.
Necesita `'use client'`.

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
      <Pennant code={code} shape={shape} size={48} locale="es" />
      <button type="button" onClick={() => setCode('mx')}>
        México
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

## Detalles de SSR

- Durante el SSR, `<Pennant>` renderiza una caja vacía del tamaño correcto (con `role="img"`
  y `aria-label`). El SVG llega tras la hidratación, desde un chunk diferido. Para banderas
  conocidas al compilar, usa `PennantSvg` con un import estático del arte.
- `<Pennant mode="img" />` renderiza un `<img>` en el servidor. `mode="fetch"` pide el SVG
  por red en lugar de empaquetar chunks. Los dos apuntan a jsDelivr por defecto; pasa `base`
  para servir los archivos tú.
- En Client Components, `<Pennant>` suma <Size probe="react-pennant" /> con gzip, más unos
  pocos KB por cada bandera que se muestra. `PennantSvg` con un módulo de arte suma
  <Size probe="react-svg" /> con gzip si se usa en el cliente.
