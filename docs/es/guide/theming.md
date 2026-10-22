# Personalización

La barra de la que cuelga la bandera es un degradado cuyos dos colores llevan las clases
`pn-bar-l` y `pn-bar-d`. Una hoja de estilos pequeña los asocia a dos custom properties de CSS:

| Propiedad             | Valor por defecto |
| --------------------- | ----------------- |
| `--pennant-bar-light` | `#d5b97a`         |
| `--pennant-bar-dark`  | `#8e713f`         |

La regla está en `pennants/css/theme.css` (unos 110 bytes) y ya viene incluida en
`pennants/css` y `pennants/css/cdn`. Si usas SVG inline sin las clases CSS (módulos por bandera,
`loadPennant`, React), impórtala una vez:

```js
import 'pennants/css/theme.css';
```

Después define las propiedades en cualquier elemento ancestro. Sin esa hoja de estilos, la
barra mantiene el dorado por defecto, así que nada se rompe. Como es una regla de CSS normal,
funciona con una Content Security Policy estricta (`style-src 'self'`).

<ThemePlayground />

```css
.medalla-plata {
  --pennant-bar-light: #ececec;
  --pennant-bar-dark: #8a8a8a;
}

@media (prefers-color-scheme: dark) {
  :root {
    --pennant-bar-light: #c4a865;
    --pennant-bar-dark: #6a532c;
  }
}
```

## Qué formatos se pueden personalizar

El SVG inline en tu documento, con la hoja de estilos del tema cargada: módulos por bandera
insertados en el DOM, `loadPennant`, `<Pennant>` (modo inline) y `<PennantSvg>`.

No se pueden personalizar:

- los archivos cargados como imagen (`<img>`, PNG, fondos CSS, el sprite usado con `<use>`
  desde otro archivo): son documentos aislados y siempre usan el dorado por defecto;
- `<pennant-flag>` en la versión 0.1.0: la regla del tema de tu documento no llega dentro de su
  shadow root.

## Tamaño

| Formato          | Cómo cambiar el tamaño                                               |
| ---------------- | -------------------------------------------------------------------- |
| Clases CSS       | `font-size`, o `.pn-lg`, `.pn-2x`, `.pn-3x`, `.pn-4x`                |
| React            | `size={32}` (px) o `size="2rem"`; el ancho sigue la proporción 66:72 |
| `<pennant-flag>` | `size="32"`, `size="2rem"` o la propiedad `--pennant-size`           |
| Imágenes         | `width` y `height` con proporción 66:72, por ejemplo 33 × 36         |

`pennantBox(size)` de `pennants/react` devuelve el par `{ width, height }` que usan los
componentes, por si necesitas armar tu propio contenedor.

## Estilos del Web Component

```css
pennant-flag {
  --pennant-size: 1.5rem;
}

pennant-flag::part(svg) {
  filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.25));
}
```
