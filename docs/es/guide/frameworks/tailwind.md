# Tailwind CSS

Tailwind CSS 4 con `@tailwindcss/vite`. Usa las clases `pn pn-xx` y dales tamaño con
utilidades.

[Ejemplo completo](https://github.com/d3vaya/pennants/tree/main/examples/tailwind)

```sh
npm install pennants
```

## Configuración

Importa la hoja de una forma en la capa `components` de Tailwind:

```css [src/style.css]
@import 'tailwindcss';
@import 'pennants/css' layer(components); /* o pennants/css/circle, /rect, /square */
```

La capa importa. Sin ella, `.pn` queda como CSS sin capa, que gana a cualquier utilidad de
Tailwind, así que `h-12` o `w-auto` no harían nada.

Con Vite, añade la opción `assetsInlineLimit` de la
[guía de Vite](./vite#evita-que-vite-incruste-las-banderas). Así los 271 SVG quedan fuera
de tu CSS.

## Tamaño

`.pn` mide `1em` de alto, y su ancho depende de la forma (`11/12em` el banderín, `4/3em`
rect, `1em` square y circle). Dale tamaño con utilidades de font-size:

```html
<span class="pn pn-ar text-[32px]" role="img" aria-label="Argentina"></span>
<span class="pn pn-br text-5xl" role="img" aria-label="Brasil"></span>
<!-- Sigue al texto que la rodea -->
<span class="text-xl"><span class="pn pn-mx" aria-hidden="true"></span> México</span>
```

O fija la altura y deja que el ancho la siga:

```html
<span class="pn pn-jp h-12 w-auto aspect-[11/12]" role="img" aria-label="Japón"></span>
<span
  class="pn pn-de h-16 w-auto aspect-[11/12] drop-shadow-md transition hover:-rotate-6"
  role="img"
  aria-label="Alemania"
></span>
```

Ajusta la proporción a la forma: `aspect-[11/12]` para el banderín, `aspect-[4/3]` para
rect y `aspect-square` para square y circle. Con square y circle también sirve `size-*`.

## Peso

Las reglas de una forma suman unos 14 KB minificadas (menos de 2 KB con gzip) a tu CSS.
Tailwind no elimina las reglas sin usar del CSS importado, pero cada imagen se descarga solo
cuando se usa.
