# HTML y CDN

Sin paso de build. Carga una hoja de estilos y el Web Component desde jsDelivr, o copia los
archivos de `node_modules/pennants` a tu servidor.

[Ejemplo completo](https://github.com/d3vaya/pennants/tree/main/examples/html-cdn)

## Desde la CDN

Fija siempre la versión en las URLs de la CDN.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pennants@0.1.0/css/pennant.min.css" />
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/pennants@0.1.0/dist/element/register.js"
></script>

<!-- Clases CSS: sin JavaScript -->
<span class="pn pn-ar" role="img" aria-label="Argentina"></span>
<span class="pn pn-br pn-2x" role="img" aria-label="Brasil"></span>

<!-- Imagen: svg/<forma>/<código>.svg -->
<img
  src="https://cdn.jsdelivr.net/npm/pennants@0.1.0/svg/pennant/jp.svg"
  width="33"
  height="36"
  alt="Japón"
/>

<!-- Web Component: descarga solo esta bandera, en cualquier forma -->
<pennant-flag code="de" size="48" label="Alemania"></pennant-flag>
<pennant-flag code="de" shape="circle" size="48" label="Alemania"></pennant-flag>
```

Hay una hoja de estilos por forma, y cada una tiene su clase base: `css/pennant.min.css`
(`pn`), `css/rect.min.css` (`pn-rect`), `css/square.min.css` (`pn-square`) y
`css/circle.min.css` (`pn-circle`). Carga las que necesites y combínalas en la misma página:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pennants@0.1.0/css/circle.min.css" />

<span class="pn pn-ar" role="img" aria-label="Argentina"></span>
<span class="pn-circle pn-ar" role="img" aria-label="Argentina"></span>
```

Usa una sola clase base por elemento: `pn-circle pn-ar`, no `pn pn-circle pn-ar`. Las reglas
de distintas hojas tienen la misma especificidad, así que ganaría la última hoja cargada.

## En tu propio servidor

```sh
npm install pennants
```

Copia `css/`, `svg/`, `sprite/` y `dist/` de `node_modules/pennants` a una carpeta pública
(el `build.js` del ejemplo los copia a `dist/pennants/`). Deja `css/` y `svg/` en la misma
carpeta: las hojas de estilos cargan `../svg/<forma>/<código>.svg`.

```html
<link rel="stylesheet" href="./pennants/css/pennant.min.css" />
<script type="module" src="./pennants/dist/element/register.js"></script>

<img src="./pennants/svg/pennant/jp.svg" width="33" height="36" alt="Japón" />

<svg width="33" height="36" role="img" aria-label="México">
  <use href="./pennants/sprite/pennant.svg#pn-mx" />
</svg>
```

El sprite tiene que servirse desde el mismo origen que la página: los navegadores no cargan
referencias `<use>` de otros orígenes.

## Peso

- Cada hoja de estilos ocupa entre 15 y 17 KB minificada (menos de 2 KB con gzip). Cada imagen se
  descarga solo cuando algún elemento de la página usa su clase.
- El Web Component ocupa <Size probe="element" /> con gzip en la primera carga. Cada bandera
  es un chunk aparte de pocos KB que se pide al usarla.
- `<img>` y el sprite no necesitan JavaScript. El sprite reúne todas las banderas en un
  archivo de alrededor de 1 MB: úsalo solo si muestras muchas.
