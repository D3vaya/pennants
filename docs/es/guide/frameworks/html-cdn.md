# HTML y CDN

Sin paso de build. Carga la hoja de estilos y el Web Component desde jsDelivr, o copia los
archivos de `node_modules/pennants` a tu servidor.

[Ejemplo completo](https://github.com/d3vaya/pennants/tree/main/examples/html-cdn)

## Desde la CDN

Fija siempre la versión en las URLs de la CDN.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pennants@0.1.0/css/pennants.min.css" />
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/pennants@0.1.0/dist/element/register.js"
></script>

<!-- Clases CSS: sin JavaScript -->
<span class="pn pn-ar" role="img" aria-label="Argentina"></span>
<span class="pn pn-br pn-2x" role="img" aria-label="Brasil"></span>

<!-- Imagen -->
<img
  src="https://cdn.jsdelivr.net/npm/pennants@0.1.0/svg/jp.svg"
  width="33"
  height="36"
  alt="Japón"
/>

<!-- Web Component: descarga solo esta bandera -->
<pennant-flag code="de" size="48"></pennant-flag>
```

## En tu propio servidor

```sh
npm install pennants
```

Copia `css/`, `svg/`, `sprite/` y `dist/` de `node_modules/pennants` a una carpeta pública
(el `build.js` del ejemplo los copia a `dist/pennants/`). Deja `css/` y `svg/` en la misma
carpeta: la hoja de estilos carga `../svg/<código>.svg`.

```html
<link rel="stylesheet" href="./pennants/css/pennants.min.css" />
<script type="module" src="./pennants/dist/element/register.js"></script>

<img src="./pennants/svg/jp.svg" width="33" height="36" alt="Japón" />

<svg width="33" height="36" role="img" aria-label="México">
  <use href="./pennants/sprite/pennants.svg#pn-mx" />
</svg>
```

El sprite tiene que servirse desde el mismo origen que la página: los navegadores no cargan
referencias `<use>` de otros orígenes.

## Peso

- La hoja de estilos ocupa unos 12 KB minificada (menos de 2 KB con gzip). Cada imagen se
  descarga solo cuando algún elemento de la página usa su clase.
- El Web Component ocupa unos 20 KB minificado (7 KB con gzip) en la primera carga. Cada
  bandera es un chunk aparte de pocos KB que se pide al usarla.
- `<img>` y el sprite no necesitan JavaScript. El sprite es un único archivo de 1,1 MB (unos
  290 KB con gzip) con todas las banderas: úsalo solo si muestras muchas.
