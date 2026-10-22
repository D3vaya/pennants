# Personalización

La barra de la que cuelga la bandera se dibuja con un degradado que lee dos custom properties
de CSS:

| Propiedad             | Valor por defecto |
| --------------------- | ----------------- |
| `--pennant-bar-light` | `#d5b97a`         |
| `--pennant-bar-dark`  | `#8e713f`         |

Defínelas en cualquier elemento ancestro. Las custom properties se heredan a través del shadow
root de `<pennant-flag>`, así que el mismo CSS sirve para todos los formatos inline.

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

Solo el SVG inline: módulos por bandera insertados en el DOM, `loadPennant`, `<Pennant>` (modo
inline), `<PennantSvg>` y `<pennant-flag>`. Los archivos cargados como imagen (`<img>`, PNG,
fondos CSS, el sprite usado con `<use>` desde otro archivo) son documentos aislados y siempre
usan el dorado por defecto.

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
