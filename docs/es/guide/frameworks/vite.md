# Vite

Cualquier app de Vite (vanilla, React, Vue, Svelte, Solid...) puede usar todos los formatos.
Esta página usa TypeScript sin framework.

[Ejemplo completo](https://github.com/d3vaya/pennants/tree/main/examples/vite)

```sh
npm install pennants
```

## Evita que Vite incruste las banderas

`pennants.min.css` referencia los 271 SVG de banderas. Por defecto, Vite incrusta como data
URI todo recurso de menos de 4 KiB, lo que metería unos 380 KB de banderas en tu CSS.
Emítelos como archivos:

```ts [vite.config.ts]
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    assetsInlineLimit: (file) => (file.includes('/pennants/svg/') ? false : undefined),
  },
});
```

| `import 'pennants/css/pennants.min.css'` | CSS (min / gzip) | Banderas                          |
| ---------------------------------------- | ---------------- | --------------------------------- |
| Vite por defecto                         | 388 KB / 56 KB   | casi todas incrustadas en el CSS  |
| Con el `assetsInlineLimit` de arriba     | 14,8 KB / 3,7 KB | 271 archivos, se piden al usarlos |

## Uso

```ts [src/main.ts]
// Hoja de estilos para las clases `pn pn-xx`.
import 'pennants/css/pennants.min.css';
// Una bandera como string SVG. Solo se empaquetan las banderas que importas.
import ar from 'pennants/flags/ar';
import { getPennantName, loadPennant, toPennantCode } from 'pennants';
// Archivos estáticos como URLs con hash.
import deUrl from 'pennants/svg/de.svg?url';
import spriteUrl from 'pennants/sprite?url';

document.querySelector('#inline')!.innerHTML = ar;

const code = toPennantCode('BR'); // 'br'; lanza RangeError si el código no existe
const lazy = document.querySelector('#lazy')!;
lazy.innerHTML = await loadPennant(code); // descarga solo el chunk de esta bandera
lazy.setAttribute('role', 'img');
lazy.setAttribute('aria-label', getPennantName(code, 'es'));

document.querySelector<HTMLImageElement>('#img')!.src = deUrl;
document.querySelector('#sprite')!.setAttribute('href', `${spriteUrl}#pn-mx`);
```

```html
<span class="pn pn-ar pn-2x" role="img" aria-label="Argentina"></span>
<svg width="33" height="36" role="img" aria-label="México"><use id="sprite" /></svg>
```

Con `innerHTML`, inserta solo markup de `pennants/flags/*` o de `loadPennant`. Nunca
contenido que venga del usuario.

::: tip TypeScript
Escribe `import 'pennants/css/pennants.min.css'` en lugar de `import 'pennants/css'`. En
TypeScript 6, `noUncheckedSideEffectImports` viene activado por defecto, y el especificador
corto falla con `TS2882`: no termina en `.css`, así que no le aplican las declaraciones
`*.css` de `vite/client`. Añade `"types": ["vite/client"]` a tu tsconfig para los imports
con `?url`.
:::

## Impacto en el bundle

Medido con Vite 8, build de producción, frente a una app vacía:

| Importas                    | JS de entrada (min / gzip) | Otros archivos                |
| --------------------------- | -------------------------- | ----------------------------- |
| `pennants/flags/ar`         | +3,2 KB / +1,0 KB          | ninguno                       |
| tres módulos de bandera     | +8,1 KB / +2,2 KB          | ninguno                       |
| `getPennantName`            | +2,6 KB / +1,1 KB          | ninguno                       |
| `pennantUrl`                | +2,0 KB / +0,8 KB          | ninguno                       |
| `loadPennant`               | +15,4 KB / +5,1 KB         | un chunk diferido por bandera |
| `pennants/element/register` | +19,5 KB / +7,0 KB         | un chunk diferido por bandera |

Los módulos por bandera son la opción más ligera para unas pocas banderas conocidas.
`loadPennant` y el Web Component cuestan unos 5–7 KB fijos con gzip, más unos pocos KB por
cada bandera que se muestra.
