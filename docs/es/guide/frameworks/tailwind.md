# Tailwind CSS

Tailwind CSS 4 con `@tailwindcss/vite`. Usa las clases `pn pn-xx` y dales tamaño con
utilidades.

[Ejemplo completo](https://github.com/d3vaya/pennants/tree/main/examples/tailwind)

```sh
npm install pennants
```

## Configuración

Importa la hoja de estilos en la capa `components` de Tailwind:

```css [src/style.css]
@import 'tailwindcss';
@import 'pennants/css/pennants.min.css' layer(components);
```

La capa importa. Sin ella, `.pn` queda como CSS sin capa, que gana a cualquier utilidad de
Tailwind, así que `h-12` o `w-auto` no harían nada.

Con Vite, añade la opción `assetsInlineLimit` de la
[guía de Vite](./vite#evita-que-vite-incruste-las-banderas). Así los 271 SVG quedan fuera
de tu CSS.

## Tamaño

`.pn` mide `1em` de alto y `11/12em` de ancho. Dale tamaño con utilidades de font-size:

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

Las utilidades `size-*` ponen el mismo valor en ancho y alto, lo que deforma la proporción
11:12. Usa `h-*` con `w-auto aspect-[11/12]`.

## Peso

Las reglas de pennants suman unos 12 KB minificadas (menos de 2 KB con gzip) a tu CSS.
Tailwind no elimina las reglas sin usar del CSS importado, pero cada imagen se descarga solo
cuando se usa.
