# Accesibilidad

Una bandera puede aportar información ("Envíos a Argentina") o decorar un texto que ya dice el
nombre del país. Decide cuál de los dos casos es en cada uso.

## Los componentes ponen el nombre por ti

| Componente       | Nombre accesible por defecto            | Decorativa |
| ---------------- | --------------------------------------- | ---------- |
| `<Pennant>`      | `getPennantName(code, locale)`          | `title=""` |
| `<PennantSvg>`   | Nombre de la bandera del SVG, traducido | `title=""` |
| `<pennant-flag>` | Nombre en inglés                        | `label=""` |

Las banderas con nombre reciben `role="img"` y `aria-label` (o `alt` en modo `img`). Las
decorativas reciben `aria-hidden="true"` (o un `alt` vacío). Un `<pennant-flag>` sin nombre, por
ejemplo con un código desconocido o tras un error de carga, se oculta a las tecnologías de
asistencia en lugar de anunciarse como una imagen sin nombre.

Como el Web Component usa el nombre en inglés por defecto, en un sitio en español conviene pasar
siempre `label`:

```jsx
<Pennant code="de" locale="es" />            {/* aria-label="Alemania" */}
<Pennant code="de" title="" /> Alemania      {/* decorativa: el texto ya lo dice */}
```

```html
<pennant-flag code="de" label="Alemania"></pennant-flag>
<pennant-flag code="de" label=""></pennant-flag> Alemania
```

## Formatos estáticos

Agrega el nombre tú mismo:

```html
<img src="/flags/ar.svg" alt="Argentina" width="33" height="36" />
<img src="/flags/ar.svg" alt="" width="33" height="36" /> Argentina

<span class="pn pn-ar" role="img" aria-label="Argentina"></span>
<span class="pn pn-ar" aria-hidden="true"></span> Argentina

<svg role="img" aria-label="Argentina"><use href="/pennant.svg#pn-ar" /></svg>
```

## Nombres traducidos

`getPennantName(código, locale)` usa `Intl.DisplayNames`, así que los nombres siguen el idioma
del usuario sin incluir traducciones en el bundle. Las banderas que no son ISO (`gb-eng`, `eu`,
`asean`, ...) usan su nombre en inglés.

```js
getPennantName('jp', 'es'); // 'Japón'
getPennantName('jp', navigator.language);
```

## Otras recomendaciones

- No uses una bandera como única forma de identificar un idioma: muchos idiomas se hablan en
  varios países. Muestra el nombre del idioma.
- Los banderines mantienen la proporción y escalan con el `font-size` (en las clases CSS y con
  el `size` por defecto de `1em`), así que respetan el zoom de texto del usuario.
- El emoji de `toEmoji` se ve como dos letras en algunas plataformas (Windows). No lo uses como
  única etiqueta.
